# Scormly for Windows: video to SCORM

1. Download **Scormly-Windows.zip** from https://github.com/OrriClinic/Scormly/releases/latest.
2. Right-click the ZIP, choose **Extract All**, then open the extracted **Scormly-Windows** folder.
3. Double-click **Convert video.cmd**, choose your `.webm` or `.mp4` video, and choose where to save the SCORM `.zip`.

Wait for **Complete** before uploading the new ZIP to your learning system. Do not upload the converter download itself. Your original video is left in place and existing files are never replaced. To change the course title, rename the video before converting it.

On first use, the converter downloads and checks a portable runtime from **nodejs.org**. This needs internet access; later conversions work offline. You do not need to install Node, npm, Git, or anything as administrator. Windows 10/11 on a 64-bit x64 or ARM64 PC is required. If your organisation blocks PowerShell scripts or the download, ask IT to approve this tool.

## What the package contains

The result is a **SCORM 1.2** course with one video, English player controls, the Ocean theme, and completion tracking. There are no quizzes or scores. It reuses the upstream Scormly player and manifest generator.

The player unlocks **Finish** when the playback position reaches approximately 95%, or the video ends. Learners can seek forward: this is not proof they watched every second. They finish the course in the player so completion is reported to the learning system.

Your video is copied byte for byte. Nothing is uploaded, transcoded, or recompressed by the converter, and no browser or local web server is needed to create the package. This preserves quality and keeps memory use low, but the resulting ZIP is roughly as large as the video. You need at least that much free space in the destination.

## Video and LMS limits

- Supported input containers: `.webm` and `.mp4`. A filename extension does not guarantee compatible codecs. The video must already play in your learners' browsers and your LMS must serve that media type correctly. H.264/AAC MP4 and VP8/VP9 with Opus/Vorbis WebM are common browser formats; test your actual recording in the target LMS. See MDN's [media format guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Formats).
- Maximum video size: **3 GiB (3,221,225,472 bytes)**. The converter deliberately stays below ZIP32's 4 GiB limit. Your LMS may have a much smaller upload limit.
- Save to a local Windows folder such as **Desktop** or **Documents** on an NTFS disk. Publishing the finished ZIP safely requires hardlink support. If a USB drive or network destination is unsupported, create the ZIP locally, then copy the finished file there.
- Conversion checks the file, package and player assets; it does not decode the video or repair damaged media. It does not add captions or transcripts.
- **My Learning Cloud import and completion have not been verified.** Test the generated package there before using it for learner records. Upstream Scormly's SCORM Cloud testing does not establish compatibility with this workflow or your LMS.

## Troubleshooting

- **Nothing happens / missing converter files:** use **Extract All** first, then run the CMD from the extracted folder. Keep its neighbouring files and `player` folder together.
- **Output already exists:** choose a new ZIP filename. The converter never overwrites an existing output or your video.
- **Runtime download or verification failed:** check the internet connection and run the converter again. Failed setup files are removed. A damaged cached runtime reports the precise folder that needs removing before retrying.
- **Not enough space or conversion interrupted:** no successful package is reported. Ordinary errors and Ctrl+C remove the temporary file. If you forcibly close the window or Windows shuts down, a `.scormly-*.partial` file can remain in the destination; you can delete it. The final ZIP name only appears after successful packaging.
- **Video does not play after import:** test the original file in the learner's browser and confirm the LMS supports its codecs and MIME type. Changing `.webm` to `.mp4` in the filename does not convert it.

The runtime is stored only in `%LOCALAPPDATA%\Scormly\runtime`. The launcher pins Node.js **24.21.0**, verifies the official SHA256 archive digest before extraction, and verifies `node.exe` on each run. It makes no global PATH changes. Delete that Scormly cache folder to remove the downloaded runtime; delete the extracted converter folder to remove the converter.

## Developer and automated use

Developers build the download with `npm ci` followed by `npm run build:windows`. The output is `dist-windows/Scormly-Windows.zip` and a `.sha256` file; release output is ignored by Git. The release contains the bundled CLI and licenses, not source code or `node_modules`. End users do not run npm.

The Windows launcher also accepts explicit paths for automated verification:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -File '.\Convert video.ps1' -InputPath 'C:\Videos\My recording.webm' -OutputPath 'C:\Courses\My recording.zip' -NoPause
```

The standalone CLI can run with only a Node runtime and the extracted release folder:

```text
node video-to-scorm.cjs --input recording.webm --output course.zip
```

The packager uses Node file streams and [JSZip's streaming API](https://stuk.github.io/jszip/documentation/api_jszip/generate_node_stream.html) with `STORE` compression. The same bundled player files, `buildManifest`, HTML escaping and SCORM 1.2 schemas are used by the original project. Packaging tests cover bytes, escaped titles, assets, errors, cancellation and a release folder isolated from development dependencies.

This is an Orri fork of [Scormly by Dmytro Matsiuk](https://github.com/dmmat/Scormly), distributed under the MIT license. See `LICENSE` and `THIRD-PARTY-NOTICES.txt` in the download.
