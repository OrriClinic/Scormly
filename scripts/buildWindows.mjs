import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream } from 'node:fs'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { build } from 'esbuild'
import JSZip from 'jszip'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { values } = parseArgs({ options: { 'output-directory': { type: 'string' } }, allowPositionals: false })
const outputDirectory = resolve(values['output-directory'] || join(root, 'dist-windows'))
const releaseName = 'Scormly-Windows'
const destination = join(outputDirectory, releaseName)
await rm(destination, { recursive: true, force: true })
await mkdir(destination, { recursive: true })

const result = await build({
  absWorkingDir: root,
  entryPoints: ['scripts/videoToScormCli.ts'],
  outfile: join(destination, 'video-to-scorm.cjs'),
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node24',
  metafile: true,
  // Browser-only functions in packageCommon are eliminated from this bundle.
  define: { 'import.meta.env.BASE_URL': '""' },
  legalComments: 'inline',
})
for (const name of ['Convert video.cmd', 'Convert video.ps1']) {
  const content = await readFile(join(root, 'scripts', 'windows', name), 'utf8')
  await writeFile(join(destination, name), content.replace(/\r?\n/g, '\r\n'))
}
const player = join(destination, 'player')
await mkdir(player)
for (const name of ['index.html', 'player.js', 'player.css', 'scorm.js']) {
  await cp(join(root, 'public', 'scorm-player', name), join(player, name))
}
await cp(join(root, 'public', 'scorm-player', 'schemas', 'scorm12'), join(player, 'schemas', 'scorm12'), { recursive: true })
await cp(join(root, 'docs', 'windows-converter.md'), join(destination, 'README.txt'))
await cp(join(root, 'LICENSE'), join(destination, 'LICENSE'))

const dependencies = [...new Set(Object.keys(result.metafile.inputs)
  .map((name) => name.match(/(?:^|\/)node_modules\/((?:@[^/]+\/)?[^/]+)/)?.[1])
  .filter(Boolean))].sort()
const notices = [
  'Scormly Windows converter: third-party notices',
  'Scormly is copyright 2026 Dmytro Matsiuk, licensed under MIT (see LICENSE).',
  'JSZip is used under its MIT license. Bundled dependency license texts follow.',
  'The portable Node.js runtime is downloaded separately from nodejs.org. Its full license and third-party notices are in the runtime LICENSE file under %LOCALAPPDATA%\\Scormly\\runtime.',
]
for (const name of dependencies) {
  const directory = join(root, 'node_modules', name)
  const metadata = JSON.parse(await readFile(join(directory, 'package.json'), 'utf8'))
  // isarray 1.0.0 includes its complete MIT license in README.md.
  const licenses = name === 'isarray' ? ['README.md']
    : (await readdir(directory)).filter((file) => /^licen[sc]e(?:\..*)?$/i.test(file))
  if (!licenses.length) throw new Error(`Missing license text for bundled dependency ${name}`)
  notices.push(`\n--- ${name} ${metadata.version} ---\n`)
  for (const license of licenses) notices.push(await readFile(join(directory, license), 'utf8'))
}
await writeFile(join(destination, 'THIRD-PARTY-NOTICES.txt'), notices.join('\n\n'))

const archivePath = join(outputDirectory, `${releaseName}.zip`)
const zip = new JSZip()
for (const item of await readdir(destination, { recursive: true, withFileTypes: true })) {
  if (!item.isFile()) continue
  const path = join(item.parentPath, item.name)
  const name = relative(destination, path).split('\\').join('/')
  zip.file(`${releaseName}/${name}`, await readFile(path))
}
try {
  await pipeline(zip.generateNodeStream({ streamFiles: true, compression: 'DEFLATE' }), createWriteStream(archivePath))
} catch (error) {
  await rm(archivePath, { force: true })
  throw error
}
const hash = createHash('sha256')
for await (const chunk of createReadStream(archivePath)) hash.update(chunk)
await writeFile(`${archivePath}.sha256`, `${hash.digest('hex')}  ${releaseName}.zip\n`)
console.log(`Windows release folder: ${destination}`)
console.log(`Windows release ZIP: ${archivePath}`)
