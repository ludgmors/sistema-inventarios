param([string]$RutaMailpit = (Join-Path $PSScriptRoot '../../.tools/mailpit/mailpit.exe'))
$ErrorActionPreference = 'Stop'
if (-not (Test-Path -LiteralPath $RutaMailpit)) {
    throw 'Indique -RutaMailpit con el ejecutable descargado desde https://mailpit.axllent.org/docs/install/'
}
if (Get-NetTCPConnection -LocalPort 8025 -State Listen -ErrorAction SilentlyContinue) {
    Write-Host 'El puerto 8025 ya está en uso. Compruebe http://localhost:8025.'
    return
}
$proceso = Start-Process -FilePath (Resolve-Path -LiteralPath $RutaMailpit).Path `
    -ArgumentList '--listen','127.0.0.1:8025','--smtp','127.0.0.1:1025' -WindowStyle Hidden -PassThru
Write-Host "Mailpit iniciado (PID $($proceso.Id)). Bandeja: http://localhost:8025; SMTP: 127.0.0.1:1025."
