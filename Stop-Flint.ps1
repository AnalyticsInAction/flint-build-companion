$ErrorActionPreference = 'Stop'
$flintPidPath = Join-Path $PSScriptRoot '.local/server.pid'
if (-not (Test-Path -LiteralPath $flintPidPath)) { Write-Output 'No launcher-managed Flint server recorded.'; exit }
$flintServerPid = [int](Get-Content -LiteralPath $flintPidPath)
$flintServer = Get-CimInstance Win32_Process -Filter "ProcessId = $flintServerPid"
if (-not $flintServer) { Write-Output 'The recorded Flint server is already stopped.'; exit }
$flintExpectedCli = Join-Path $PSScriptRoot 'node_modules/vinext/dist/cli.js'
if ($flintServer.CommandLine -notlike "*$flintExpectedCli*") { throw 'The saved process is not running this app; nothing was stopped.' }
if ($flintServer.Name -ne 'node.exe' -or $flintServer.CommandLine -notmatch 'vinext[/\\]dist[/\\]cli.js.*start.*--hostname.*127.0.0.1.*--port.*3000') { throw 'The process no longer matches the local Flint server; nothing was stopped.' }
Stop-Process -Id $flintServerPid
Write-Output 'Flint server stopped.'
