import { execFileSync, spawnSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import JSZip from 'jszip'
import { afterAll, beforeAll, expect, test } from 'vitest'

let directory: string
let release: string
let archiveBytes: Buffer

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'scormly-release-'))
  execFileSync(process.execPath, [resolve('scripts/buildWindows.mjs'), '--output-directory', join(directory, 'build')], { stdio: 'pipe' })
  archiveBytes = await readFile(join(directory, 'build', 'Scormly-Windows.zip'))
  const zip = await JSZip.loadAsync(archiveBytes, { checkCRC32: true })
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue
    const path = join(directory, 'extracted folder & Résumé', entry.name)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, await entry.async('nodebuffer'))
  }
  release = join(directory, 'extracted folder & Résumé', 'Scormly-Windows')
}, 30_000)
afterAll(async () => { if (directory) await rm(directory, { recursive: true, force: true }) })

test('the downloadable release includes only runtime assets and its published checksum matches', async () => {
  const zip = await JSZip.loadAsync(archiveBytes)
  const names = Object.keys(zip.files)
  for (const file of ['Convert video.cmd', 'Convert video.ps1', 'video-to-scorm.cjs', 'README.txt', 'LICENSE', 'THIRD-PARTY-NOTICES.txt', 'player/player.js']) {
    expect(names).toContain(`Scormly-Windows/${file}`)
  }
  expect(names.some((name) => /node_modules|package\.json|src\//.test(name))).toBe(false)
  const notices = await readFile(join(release, 'THIRD-PARTY-NOTICES.txt'), 'utf8')
  expect(notices).toContain('jszip 3.10.2')
  expect(notices).toContain('readable-stream')
  expect(await readFile(join(directory, 'build', 'Scormly-Windows.zip.sha256'), 'utf8'))
    .toBe(`${createHash('sha256').update(archiveBytes).digest('hex')}  Scormly-Windows.zip\n`)
})

test('the extracted CLI works with only a Node runtime and no PATH tools or development modules', async () => {
  const input = join(directory, "Résumé & $& '100%' !.webm")
  const output = join(directory, "Package & $& '100%' !.zip")
  const original = randomBytes(512 * 1024)
  await writeFile(input, original)
  const env = { ...process.env, PATH: '', NODE_PATH: '', NODE_OPTIONS: '' }
  const result = spawnSync(process.execPath, [
    '--no-global-search-paths', join(release, 'video-to-scorm.cjs'), '--input', input, '--output', output,
  ], { cwd: release, env, encoding: 'utf8' })
  expect(result.stderr).toBe('')
  expect(result.status).toBe(0)
  expect(result.stdout).toContain('Complete:')
  const zip = await JSZip.loadAsync(await readFile(output), { checkCRC32: true })
  expect(await zip.file('assets/video.webm')!.async('nodebuffer')).toEqual(original)

  const second = spawnSync(process.execPath, [join(release, 'video-to-scorm.cjs'), '--input', input, '--output', output], { cwd: release, env, encoding: 'utf8' })
  expect(second.status).toBe(1)
  expect(second.stderr).toContain('already exists')
  expect(second.stdout).not.toContain('Complete:')
})
