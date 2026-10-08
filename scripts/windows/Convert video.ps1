param(
    [string]$InputPath,
    [string]$OutputPath,
    [switch]$NoPause
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)

function Get-PortableNode {
    $version = '24.21.0'
    $architecture = $env:PROCESSOR_ARCHITECTURE
    if ($env:PROCESSOR_ARCHITEW6432) { $architecture = $env:PROCESSOR_ARCHITEW6432 }
    switch ($architecture) {
        'AMD64' {
            $arch = 'x64'
            $archiveHash = '158f7685b44de51f6c0df1d153526cbcd3e1bc739a8dfc607721cef75de9e541'
            $nodeHash = 'ba4e6d110e8c1592a1ecd390f6b05f3da124b13871a5be62b341a07a853c6c32'
        }
        'ARM64' {
            $arch = 'arm64'
            $archiveHash = '8779b1bde1d39f8d420e3b57aa657b39891af434d3de44a919044cec06785921'
            $nodeHash = 'dff59da18b6ffe1bf1ca99e1d2af4906080c481740619f5b5098c0fca28bd9b7'
        }
        default { throw 'This converter requires 64-bit Windows (x64 or ARM64).' }
    }
    if (-not $env:LOCALAPPDATA) { throw 'Windows LOCALAPPDATA is unavailable.' }
    $cache = Join-Path $env:LOCALAPPDATA 'Scormly\runtime'
    $runtimeName = "node-v$version-win-$arch"
    $runtime = Join-Path $cache $runtimeName
    $node = Join-Path $runtime 'node.exe'
    New-Item -ItemType Directory -Path $cache -Force | Out-Null
    $lock = $null
    $stage = $null
    try {
        try {
            $lock = [System.IO.File]::Open((Join-Path $cache "setup-$arch.lock"), 'OpenOrCreate', 'ReadWrite', 'None')
        } catch [System.IO.IOException] {
            throw 'Another Scormly runtime setup may be running. Close it or wait for it to finish, then retry.'
        }
        if (Test-Path -LiteralPath $node -PathType Leaf) {
            if ((Get-FileHash -LiteralPath $node -Algorithm SHA256).Hash -ne $nodeHash) {
                throw "The cached runtime failed verification. Remove this folder and try again: $runtime"
            }
            Write-Host 'Using the verified local runtime.'
            return $node
        }
        if (Test-Path -LiteralPath $runtime) { throw "The runtime folder is incomplete. Remove it and try again: $runtime" }
        $stage = Join-Path $cache ('setup-' + [Guid]::NewGuid().ToString('N'))
        New-Item -ItemType Directory -Path $stage | Out-Null
        $archive = Join-Path $stage 'node.zip'
        Write-Host 'First use: downloading the portable runtime from nodejs.org. No administrator access is needed.'
        [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -UseBasicParsing -Uri "https://nodejs.org/download/release/v$version/$runtimeName.zip" -OutFile $archive
        Write-Host 'Verifying the download...'
        if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $archiveHash) {
            throw 'The runtime download failed SHA256 verification. Nothing was installed. Try again.'
        }
        Write-Host 'Preparing the portable runtime...'
        Add-Type -AssemblyName System.IO.Compression.FileSystem
        [System.IO.Compression.ZipFile]::ExtractToDirectory($archive, $stage)
        $extracted = Join-Path $stage $runtimeName
        if ((Get-FileHash -LiteralPath (Join-Path $extracted 'node.exe') -Algorithm SHA256).Hash -ne $nodeHash) {
            throw 'The extracted runtime failed verification. Nothing was installed.'
        }
        Move-Item -LiteralPath $extracted -Destination $runtime
        return $node
    } finally {
        if ($stage -and (Test-Path -LiteralPath $stage)) { Remove-Item -LiteralPath $stage -Recurse -Force }
        if ($lock) { $lock.Dispose() }
    }
}

$result = 0
try {
    Write-Host 'Scormly - Video to SCORM'
    Write-Host ''
    if (-not $InputPath -or -not $OutputPath) { Add-Type -AssemblyName System.Windows.Forms }
    if (-not $InputPath) {
        $picker = New-Object System.Windows.Forms.OpenFileDialog
        try {
            $picker.Title = 'Choose your video'
            $picker.Filter = 'Video files (*.webm;*.mp4)|*.webm;*.mp4'
            $picker.Multiselect = $false
            $picker.CheckFileExists = $true
            if ($picker.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
                Write-Host 'Cancelled. No package was created.'
                exit 0
            }
            $InputPath = $picker.FileName
        } finally { $picker.Dispose() }
    }
    $InputPath = [System.IO.Path]::GetFullPath($InputPath)
    if (-not (Test-Path -LiteralPath $InputPath -PathType Leaf)) { throw 'The selected video does not exist.' }
    $video = Get-Item -LiteralPath $InputPath
    if ($video.Extension.ToLowerInvariant() -notin @('.webm', '.mp4')) { throw 'Choose a .webm or .mp4 video.' }
    if ($video.Length -eq 0) { throw 'The video is empty.' }
    if ($video.Length -gt 3GB) { throw 'The video exceeds the 3 GiB ZIP32 safety limit.' }
    if (-not $OutputPath) {
        $picker = New-Object System.Windows.Forms.SaveFileDialog
        try {
            $picker.Title = 'Save the SCORM package'
            $picker.Filter = 'SCORM ZIP package (*.zip)|*.zip'
            $picker.DefaultExt = 'zip'
            $picker.AddExtension = $true
            $picker.CheckPathExists = $true
            $picker.OverwritePrompt = $false
            $picker.InitialDirectory = $video.DirectoryName
            $picker.FileName = [System.IO.Path]::GetFileNameWithoutExtension($video.Name) + '.zip'
            if ($picker.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
                Write-Host 'Cancelled. No package was created.'
                exit 0
            }
            $OutputPath = $picker.FileName
        } finally { $picker.Dispose() }
    }
    $OutputPath = [System.IO.Path]::GetFullPath($OutputPath)
    if ([string]::Equals($InputPath, $OutputPath, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'The output must be different from the original video.'
    }
    if ([System.IO.Path]::GetExtension($OutputPath).ToLowerInvariant() -ne '.zip') { throw 'The output filename must end in .zip.' }
    if (Test-Path -LiteralPath $OutputPath) { throw 'The output already exists. Choose a new filename; existing files are never replaced.' }
    if (-not (Test-Path -LiteralPath ([System.IO.Path]::GetDirectoryName($OutputPath)) -PathType Container)) {
        throw 'The destination folder does not exist.'
    }
    $cli = Join-Path $PSScriptRoot 'video-to-scorm.cjs'
    if (-not (Test-Path -LiteralPath $cli -PathType Leaf)) { throw 'Extract the complete Scormly-Windows.zip before running this converter.' }
    $node = Get-PortableNode
    & $node $cli --input $InputPath --output $OutputPath
    if ($LASTEXITCODE -ne 0) { throw 'Conversion failed. See the error above.' }
} catch {
    Write-Host ''
    Write-Host ('ERROR: ' + $_.Exception.Message) -ForegroundColor Red
    $result = 1
} finally {
    if (-not $NoPause) { Read-Host 'Press Enter to close' | Out-Null }
}
exit $result
