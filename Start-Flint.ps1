param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$flintProject = $PSScriptRoot
$flintUrl = 'http://127.0.0.1:3000/'
$flintAlreadyRunning = $false
try {
  $flintResponse = Invoke-WebRequest -Uri $flintUrl -UseBasicParsing -TimeoutSec 3
  if ($flintResponse.Content -match 'Flint.*Build your rowing boat') { $flintAlreadyRunning = $true }
  else { throw 'Port 3000 is being used by another application. Close that application first.' }
} catch {
  if ($_.Exception.Message -like '*another application*') { throw }
}
if (-not $flintAlreadyRunning) {
  $flintNodeCommand = Get-Command node -ErrorAction SilentlyContinue
  if ($flintNodeCommand) { $flintNode = $flintNodeCommand.Source }
  else { $flintNode = 'C:\Users\Steve\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
  if (-not (Test-Path -LiteralPath $flintNode)) { throw 'Node.js is required to run the boat guide.' }
  if (-not (Test-Path -LiteralPath (Join-Path $flintProject 'dist/server/index.js'))) { throw 'Build the app with npm run build before starting it.' }
  $flintLogs = Join-Path $flintProject '.local'
  New-Item -ItemType Directory -Path $flintLogs -Force | Out-Null
  $flintCli = Join-Path $flintProject 'node_modules/vinext/dist/cli.js'
  $flintProcess = Start-Process -FilePath $flintNode -ArgumentList @(('"' + $flintCli + '"'),'start','--hostname','127.0.0.1','--port','3000') -WorkingDirectory $flintProject -WindowStyle Hidden -RedirectStandardOutput (Join-Path $flintLogs 'server.log') -RedirectStandardError (Join-Path $flintLogs 'server-error.log') -PassThru
  $flintProcess.Id | Set-Content -LiteralPath (Join-Path $flintLogs 'server.pid')
  $flintStarted = $false
  for ($flintAttempt=0; $flintAttempt -lt 25; $flintAttempt++) {
    Start-Sleep -Milliseconds 400
    if ($flintProcess.HasExited) { throw "The server stopped. See $flintLogs\server-error.log" }
    try { $flintResponse = Invoke-WebRequest -Uri $flintUrl -UseBasicParsing -TimeoutSec 5; if ($flintResponse.StatusCode -eq 200 -and $flintResponse.Content -match 'Flint.*Build your rowing boat') { $flintStarted=$true; break } } catch {}
  }
  if (-not $flintStarted) { throw "The server is not ready. See $flintLogs\server-error.log" }
}
if (-not $NoBrowser) { Start-Process $flintUrl }
Write-Output "Flint is available at $flintUrl"

