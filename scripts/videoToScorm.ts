import { randomUUID } from 'node:crypto'
import { createWriteStream, type ReadStream } from 'node:fs'
import { link, lstat, open, readFile, rm, stat } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { Transform } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import JSZip from 'jszip'
import { escapeHtml, SCHEMA_FILES } from '../src/export/packageCommon'
import { buildManifest } from '../src/export/scormManifest'
import type { Course } from '../src/types/course'

// Leave ample space for the player, ZIP headers and central directory: JSZip
// writes ZIP32 archives, whose entries and offsets must stay below 4 GiB.
export const MAX_VIDEO_BYTES = 3 * 1024 ** 3
const MAX_ZIP_BYTES = 4 * 1024 ** 3 - 1024 ** 2
const PLAYER_FILES = ['index.html', 'player.css', 'player.js', 'scorm.js']

interface PackageOptions {
  inputPath: string
  outputPath: string
  playerDirectory: string
  signal?: AbortSignal
  onProgress?: (bytesRead: number, totalBytes: number) => void
}

function videoCourse(title: string, assetPath: string): Course {
  return {
    id: randomUUID(),
    title,
    description: '',
    theme: 'ocean',
    settings: {
      completion: 'view',
      scored: false,
      passingScore: 0,
      navigation: 'linear',
      playerLanguage: 'en',
      contentLanguage: 'en',
    },
    lessons: [{
      id: 'video-lesson',
      title,
      status: 'published',
      blocks: [{
        id: 'video',
        type: 'video',
        settings: {},
        data: { src: assetPath, requireWatch: true },
      }],
    }],
  }
}

export async function packageVideo(options: PackageOptions): Promise<{ title: string; bytes: number }> {
  const { playerDirectory, signal, onProgress } = options
  const inputPath = resolve(options.inputPath)
  const outputPath = resolve(options.outputPath)
  const samePath = process.platform === 'win32'
    ? inputPath.toLowerCase() === outputPath.toLowerCase()
    : inputPath === outputPath
  if (samePath) throw new Error('The output must be different from the original video.')
  const extension = extname(inputPath).toLowerCase()
  if (!['.webm', '.mp4'].includes(extension)) throw new Error('Choose a .webm or .mp4 video.')
  if (extname(outputPath).toLowerCase() !== '.zip') throw new Error('The output filename must end in .zip.')
  try {
    await lstat(outputPath)
    throw new Error('The output already exists. Choose a new filename; existing files are never replaced.')
  } catch (error) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error
  }
  const title = basename(inputPath, extname(inputPath))
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/u.test(title)) {
    throw new Error('The video filename contains a character that cannot appear in a SCORM title. Rename it and try again.')
  }

  const input = await open(inputPath, 'r')
  const partialPath = join(dirname(outputPath), `.scormly-${randomUUID()}.partial`)
  let videoStream: ReadStream | undefined
  let ownsOutput = false
  try {
    const original = await input.stat()
    if (!original.isFile()) throw new Error('Choose a video file, not a folder.')
    if (original.size === 0) throw new Error('The video is empty.')
    if (original.size > MAX_VIDEO_BYTES) {
      throw new Error('The video exceeds the 3 GiB limit. This converter uses ZIP32 and cannot safely package larger videos.')
    }
    signal?.throwIfAborted()
    const assetPath = `assets/video${extension}`
    const course = videoCourse(title, assetPath)
    const zip = new JSZip()
    const files: string[] = []
    let staticBytes = 0
    for (const name of PLAYER_FILES) {
      let content = await readFile(join(playerDirectory, name), 'utf8')
      if (name === 'index.html') content = content.replace('{{COURSE_TITLE}}', () => escapeHtml(title))
      zip.file(name, content)
      staticBytes += Buffer.byteLength(content)
      files.push(name)
    }
    const courseData = `window.__SCORMLY_COURSE__ = ${JSON.stringify(course).replace(/</g, '\\u003c')};`
    zip.file('course-data.js', courseData)
    staticBytes += Buffer.byteLength(courseData)
    files.push('course-data.js', assetPath)
    for (const name of SCHEMA_FILES.scorm12) {
      const content = await readFile(join(playerDirectory, 'schemas', 'scorm12', name))
      zip.file(name, content)
      staticBytes += content.length
      files.push(name)
    }
    const manifest = buildManifest(course, files, '1.2')
    zip.file('imsmanifest.xml', manifest)
    if (original.size + staticBytes + Buffer.byteLength(manifest) + 1024 ** 2 >= MAX_ZIP_BYTES) {
      throw new Error('The package would exceed the safe ZIP32 size limit.')
    }

    // A killed process can leave a recognisable .partial, never a finished ZIP.
    const output = createWriteStream(partialPath, { flags: 'wx' })
    output.once('open', () => { ownsOutput = true })
    videoStream = input.createReadStream({ autoClose: false, end: original.size - 1 })
    zip.file(assetPath, videoStream, { compression: 'STORE', createFolders: false })
    const archive = zip.generateNodeStream({ streamFiles: true, compression: 'STORE' }, () => {
      onProgress?.(videoStream!.bytesRead, original.size)
    })
    let written = 0
    const sizeGuard = new Transform({
      transform(chunk: Buffer, _encoding, callback) {
        written += chunk.length
        callback(written >= MAX_ZIP_BYTES ? new Error('The package reached the safe ZIP32 size limit.') : null, chunk)
      },
    })
    await pipeline(archive, sizeGuard, output, { signal })
    const after = await input.stat()
    if (videoStream.bytesRead !== original.size || after.size !== original.size || after.mtimeMs !== original.mtimeMs) {
      throw new Error('The video changed during conversion. Close the recording or editing app, then try again.')
    }
    const result = await stat(partialPath)
    try {
      // A hardlink publishes the complete file atomically and refuses a name
      // another process created while conversion was running.
      await link(partialPath, outputPath)
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'EEXIST') throw error
      throw new Error(`Cannot publish the ZIP in this destination. Save to a local Windows Desktop or Documents folder, then copy the finished ZIP to your USB drive or network folder. ${error instanceof Error ? error.message : String(error)}`)
    }
    return { title, bytes: result.size }
  } catch (error) {
    signal?.throwIfAborted()
    if (error instanceof Error && 'code' in error && error.code === 'EEXIST') {
      throw new Error('The output already exists. Choose a new filename; existing files are never replaced.')
    }
    throw error
  } finally {
    try {
      videoStream?.destroy()
      await input.close()
    } finally {
      if (ownsOutput) await rm(partialPath, { force: true })
    }
  }
}
