import { randomBytes } from 'node:crypto'
import { existsSync, truncateSync, writeFileSync } from 'node:fs'
import { mkdir, mkdtemp, open, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import vm from 'node:vm'
import JSZip from 'jszip'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { MAX_VIDEO_BYTES, packageVideo } from '../scripts/videoToScorm'
import { SCHEMA_FILES } from '../src/export/packageCommon'
import { buildManifest } from '../src/export/scormManifest'
import type { Course } from '../src/types/course'

const playerDirectory = resolve('public/scorm-player')
let directory: string
let inputPath: string
let outputPath: string

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'scormly-package-'))
  inputPath = join(directory, 'A recording.webm')
  outputPath = join(directory, 'A course.zip')
})
afterEach(async () => { await rm(directory, { recursive: true, force: true }) })

function convert(overrides: Partial<Parameters<typeof packageVideo>[0]> = {}) {
  return packageVideo({ inputPath, outputPath, playerDirectory, ...overrides })
}

describe('video packaging', () => {
  test.each(['webm', 'MP4'])('packages original %s bytes with the upstream player and a valid course', async (extension) => {
    const title = "Résumé & $& 'training' (100%)"
    inputPath = join(directory, `${title}.${extension}`)
    const original = randomBytes(256 * 1024)
    await writeFile(inputPath, original)
    const result = await convert()
    const archive = await JSZip.loadAsync(await readFile(outputPath), { checkCRC32: true })
    const media = `assets/video.${extension.toLowerCase()}`
    expect(await archive.file(media)!.async('nodebuffer')).toEqual(original)
    expect(await readFile(inputPath)).toEqual(original)
    expect(result.title).toBe(title)
    expect(result.bytes).toBeGreaterThan(original.length)

    const context = { window: {} as { __SCORMLY_COURSE__?: Course } }
    vm.runInNewContext(await archive.file('course-data.js')!.async('string'), context)
    const course = context.window.__SCORMLY_COURSE__!
    expect(course.title).toBe(title)
    expect(course.theme).toBe('ocean')
    expect(course.settings).toMatchObject({ completion: 'view', scored: false, navigation: 'linear', playerLanguage: 'en', contentLanguage: 'en' })
    expect(course.lessons).toHaveLength(1)
    expect(course.lessons[0].blocks).toMatchObject([{ type: 'video', data: { src: media, requireWatch: true } }])
    expect(await archive.file('index.html')!.async('string')).toContain('<title>Résumé &amp; $&amp; \'training\' (100%)</title>')
    const manifest = await archive.file('imsmanifest.xml')!.async('string')
    expect(manifest).toContain('<schemaversion>1.2</schemaversion>')
    expect(manifest).toContain('Résumé &amp; $&amp; &apos;training&apos; (100%)')
    expect(manifest).not.toContain('masteryscore')
    const listedFiles = ['index.html', 'player.css', 'player.js', 'scorm.js', 'course-data.js', media, ...SCHEMA_FILES.scorm12]
    expect(Object.keys(archive.files).sort()).toEqual([...listedFiles, 'imsmanifest.xml'].sort())
    expect(manifest).toBe(buildManifest(course, listedFiles, '1.2'))
    for (const name of ['player.js', 'player.css', 'scorm.js']) {
      expect(await archive.file(name)!.async('nodebuffer')).toEqual(await readFile(join(playerDirectory, name)))
    }
    for (const name of SCHEMA_FILES.scorm12) {
      expect(await archive.file(name)!.async('nodebuffer')).toEqual(await readFile(join(playerDirectory, 'schemas', 'scorm12', name)))
    }
    expect((await readdir(directory)).filter((name) => name.endsWith('.partial'))).toEqual([])
  })

  test.skipIf(process.platform === 'win32')('escapes HTML syntax in filenames allowed on other filesystems', async () => {
    inputPath = join(directory, '<script>alert("x")<script>.webm')
    await writeFile(inputPath, randomBytes(10))
    await convert()
    const archive = await JSZip.loadAsync(await readFile(outputPath))
    expect(await archive.file('index.html')!.async('string')).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;script&gt;')
    expect(await archive.file('course-data.js')!.async('string')).not.toContain('<script>')
  })

  test('rejects missing, empty and unsupported inputs without creating outputs', async () => {
    await expect(convert()).rejects.toMatchObject({ code: 'ENOENT' })
    await writeFile(inputPath, '')
    await expect(convert()).rejects.toThrow('empty')
    await expect(convert({ inputPath: join(directory, 'movie.mov') })).rejects.toThrow('.webm or .mp4')
    expect(existsSync(outputPath)).toBe(false)
    expect((await readdir(directory)).filter((name) => name.endsWith('.partial'))).toEqual([])
  })

  test('rejects directories and invalid output extensions', async () => {
    await mkdir(inputPath)
    await expect(convert()).rejects.toThrow()
    await expect(convert({ outputPath: join(directory, 'course.txt') })).rejects.toThrow('end in .zip')
    expect(existsSync(outputPath)).toBe(false)
  })

  test('never overwrites the source or an existing output', async () => {
    const original = randomBytes(100)
    await writeFile(inputPath, original)
    await expect(convert({ outputPath: inputPath })).rejects.toThrow('different from the original')
    await writeFile(outputPath, 'existing course')
    await expect(convert()).rejects.toThrow('already exists')
    expect(await readFile(outputPath, 'utf8')).toBe('existing course')
    expect(await readFile(inputPath)).toEqual(original)
  })

  test('rejects oversized sparse files before packaging', async () => {
    const file = await open(inputPath, 'w')
    try { await file.truncate(MAX_VIDEO_BYTES + 1) } finally { await file.close() }
    await expect(convert()).rejects.toThrow('3 GiB limit')
    expect(existsSync(outputPath)).toBe(false)
    expect(await readdir(directory)).toEqual(['A recording.webm'])
  })

  test('missing player assets or a missing destination fail without an output', async () => {
    await writeFile(inputPath, randomBytes(100))
    await expect(convert({ playerDirectory: join(directory, 'missing-player') })).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(convert({ outputPath: join(directory, 'missing-folder', 'course.zip') })).rejects.toMatchObject({ code: 'ENOENT' })
    expect(await readdir(directory)).toEqual(['A recording.webm'])
  })

  test('cancellation removes an in-progress file and never publishes the final ZIP', async () => {
    await writeFile(inputPath, randomBytes(8 * 1024 ** 2))
    const controller = new AbortController()
    await expect(convert({
      signal: controller.signal,
      onProgress(bytes) { if (bytes > 0) controller.abort() },
    })).rejects.toMatchObject({ name: 'AbortError' })
    expect(await readdir(directory)).toEqual(['A recording.webm'])
  })

  test('a source truncated during the stream fails and cleans its partial output', async () => {
    await writeFile(inputPath, randomBytes(8 * 1024 ** 2))
    let changed = false
    await expect(convert({
      onProgress(bytes) {
        if (bytes > 0 && !changed) {
          changed = true
          truncateSync(inputPath, 1)
        }
      },
    })).rejects.toThrow('changed during conversion')
    expect(changed).toBe(true)
    expect(await readdir(directory)).toEqual(['A recording.webm'])
  })

  test('a competing output created during conversion survives unchanged', async () => {
    await writeFile(inputPath, randomBytes(1024 ** 2))
    let created = false
    await expect(convert({
      onProgress(bytes) {
        if (bytes > 0 && !created) {
          expect(existsSync(outputPath)).toBe(false)
          writeFileSync(outputPath, 'another package')
          created = true
        }
      },
    })).rejects.toThrow('already exists')
    expect(await readFile(outputPath, 'utf8')).toBe('another package')
    expect((await readdir(directory)).filter((name) => name.endsWith('.partial'))).toEqual([])
  })
})
