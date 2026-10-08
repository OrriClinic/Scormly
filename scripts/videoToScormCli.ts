import { dirname, join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { packageVideo } from './videoToScorm'

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: { input: { type: 'string' }, output: { type: 'string' }, help: { type: 'boolean' } },
    strict: true,
    allowPositionals: false,
  })
  if (values.help) {
    console.log('Scormly video converter\nUsage: node video-to-scorm.cjs --input video.webm --output course.zip')
    return
  }
  if (!values.input || !values.output) throw new Error('Both --input and --output are required.')
  const controller = new AbortController()
  const cancel = () => controller.abort(new Error('Conversion cancelled.'))
  process.once('SIGINT', cancel)
  process.once('SIGTERM', cancel)
  let lastProgress = -1
  try {
    console.log('Creating SCORM 1.2 package. The original video is copied without conversion.')
    const result = await packageVideo({
      inputPath: values.input,
      outputPath: values.output,
      playerDirectory: join(dirname(resolve(process.argv[1])), 'player'),
      signal: controller.signal,
      onProgress(bytesRead, totalBytes) {
        const percent = Math.min(100, Math.floor(bytesRead / totalBytes * 100))
        if (percent >= lastProgress + 10) {
          console.log(`Copying video: ${percent}%`)
          lastProgress = percent
        }
      },
    })
    console.log(`Complete: ${resolve(values.output)} (${(result.bytes / 1024 ** 2).toFixed(1)} MiB)`)
  } finally {
    process.removeListener('SIGINT', cancel)
    process.removeListener('SIGTERM', cancel)
  }
}

main().catch((error: unknown) => {
  console.error(`ERROR: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
