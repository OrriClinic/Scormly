@echo off
setlocal DisableDelayedExpansion
title Scormly - Convert video
"%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -STA -File "%~dp0Convert video.ps1" -NoPause
set "scormlyExitCode=%errorlevel%"
echo.
pause
exit /b %scormlyExitCode%
