param([string]$Servidor = 'localhost')
$ErrorActionPreference = 'Stop'
$proyecto = Join-Path $PSScriptRoot '../backend/Inventarios.Api/Inventarios.Api.csproj'
$secretos = & dotnet user-secrets list --project $proyecto
if ($LASTEXITCODE -ne 0) { throw 'No se pudo acceder a los secretos de desarrollo.' }
if (-not ($secretos | Where-Object { $_ -match '^Jwt:Key = .+' })) {
    $bytesClave = New-Object byte[] 64
    $generador = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generador.GetBytes($bytesClave) } finally { $generador.Dispose() }
    & dotnet user-secrets set 'Jwt:Key' ([Convert]::ToBase64String($bytesClave)) --project $proyecto | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo guardar la clave JWT.' }
}
& dotnet user-secrets set 'ConnectionStrings:Inventarios' "Server=$Servidor;Database=SistemaInventarios;Trusted_Connection=True;Encrypt=True;TrustServerCertificate=True;" --project $proyecto | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'No se pudo guardar la conexión.' }
$frontend = Join-Path $PSScriptRoot '../frontend'
if (-not (Test-Path -LiteralPath (Join-Path $frontend '.env.local'))) {
    Copy-Item -LiteralPath (Join-Path $frontend '.env.example') -Destination (Join-Path $frontend '.env.local')
}
Write-Host 'Configuración local preparada. La clave JWT existente se conserva y no se muestra.'
