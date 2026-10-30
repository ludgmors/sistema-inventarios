param(
    [Parameter(Mandatory=$true)][ValidateSet('Preparar','CrearCuenta','HacerSuperadmin','HacerAdministrador','LimpiarUsuarios','PermitirEnvio','VentanaEnvios','VencerVentanaEnvios','Expirar','AdelantarReenvio','CambiarCorreo','Desactivar','CambiarClave','CodigoCambiado')][string]$Accion,
    [string]$Usuario = '',
    [ValidatePattern('^$|^[a-f0-9]{32}$')][string]$DesafioId = ''
)
$ErrorActionPreference = 'Stop'
# Base fija y exclusiva de pruebas: nunca usar la base de trabajo.
$conexion = New-Object System.Data.SqlClient.SqlConnection 'Server=(localdb)\MSSQLLocalDB;Database=SistemaInventarios_Pruebas2FA;Integrated Security=True;TrustServerCertificate=True'
$conexion.Open()
try {
    $cmd = $conexion.CreateCommand()
    $null = $cmd.Parameters.AddWithValue('@usuario', $Usuario)
    $null = $cmd.Parameters.AddWithValue('@id', $DesafioId)
    switch ($Accion) {
        'Preparar' { $cmd.CommandText = "UPDATE Usuarios SET Correo='admin@example.com' WHERE NombreUsuario='admin'; DELETE FROM LimitesAcceso; UPDATE SesionesAcceso SET RevocadaUtc=SYSUTCDATETIME() WHERE RevocadaUtc IS NULL;" }
        'CrearCuenta' { $cmd.CommandText = "INSERT INTO Usuarios (NombreCompleto,NombreUsuario,Correo,HashContrasena,RolId,Activo,FechaCreacion) SELECT 'Prueba 2FA',@usuario,@usuario+'@example.com',HashContrasena,(SELECT Id FROM Roles WHERE Nombre='Consulta'),1,GETDATE() FROM Usuarios WHERE NombreUsuario='admin';" }
        'HacerSuperadmin' { $cmd.CommandText = "UPDATE Usuarios SET RolId=(SELECT Id FROM Roles WHERE Nombre='Superadmin') WHERE NombreUsuario=@usuario AND NombreUsuario LIKE 'dosfa-%';" }
        'HacerAdministrador' { $cmd.CommandText = "UPDATE Usuarios SET RolId=(SELECT Id FROM Roles WHERE Nombre='Administrador') WHERE NombreUsuario=@usuario AND NombreUsuario LIKE 'dosfa-%';" }
        'VentanaEnvios' { $cmd.CommandText = "INSERT INTO LimitesAcceso(Clave,InicioUtc,Cantidad) SELECT CONVERT(varchar(64),HASHBYTES('SHA2_256',CONVERT(varchar(100),'2fa-envios:'+CONVERT(varchar(20),Id))),2),DATEADD(second,-890,SYSUTCDATETIME()),3 FROM Usuarios WHERE NombreUsuario=@usuario;" }
        'VencerVentanaEnvios' { $cmd.CommandText = "UPDATE LimitesAcceso SET InicioUtc=DATEADD(second,-901,SYSUTCDATETIME()) WHERE Clave=(SELECT CONVERT(varchar(64),HASHBYTES('SHA2_256',CONVERT(varchar(100),'2fa-envios:'+CONVERT(varchar(20),Id))),2) FROM Usuarios WHERE NombreUsuario=@usuario);" }
        'LimpiarUsuarios' { $cmd.CommandText = "UPDATE Usuarios SET Activo=0 WHERE NombreUsuario LIKE 'dosfa-%';" }
        'PermitirEnvio' { $cmd.CommandText = "DELETE FROM LimitesAcceso WHERE Clave IN (SELECT CONVERT(varchar(64),HASHBYTES('SHA2_256',CONVERT(varchar(100),'2fa-espera:'+CONVERT(varchar(20),Id))),2) FROM Usuarios WHERE NombreUsuario=@usuario OR Correo=@usuario UNION ALL SELECT CONVERT(varchar(64),HASHBYTES('SHA2_256',CONVERT(varchar(100),'2fa-envios:'+CONVERT(varchar(20),Id))),2) FROM Usuarios WHERE NombreUsuario=@usuario OR Correo=@usuario);" }
        'Expirar' { $cmd.CommandText = 'UPDATE DesafiosAcceso SET ExpiraUtc=DATEADD(second,-1,SYSUTCDATETIME()) WHERE Id=@id;' }
        'AdelantarReenvio' { $cmd.CommandText = "UPDATE DesafiosAcceso SET UltimoEnvioUtc=DATEADD(second,-61,SYSUTCDATETIME()) WHERE Id=@id; DELETE FROM LimitesAcceso WHERE Clave IN (SELECT CONVERT(varchar(64),HASHBYTES('SHA2_256',CONVERT(varchar(100),'2fa-espera:'+CONVERT(varchar(20),UsuarioId))),2) FROM DesafiosAcceso WHERE Id=@id);" }
        'CambiarCorreo' { $cmd.CommandText = "UPDATE Usuarios SET Correo='modificado.'+CONVERT(varchar(20),Id)+'@example.com' WHERE Id=(SELECT UsuarioId FROM DesafiosAcceso WHERE Id=@id);" }
        'Desactivar' { $cmd.CommandText = 'UPDATE Usuarios SET Activo=0 WHERE Id=(SELECT UsuarioId FROM DesafiosAcceso WHERE Id=@id);' }
        'CambiarClave' { $cmd.CommandText = "UPDATE Usuarios SET HashContrasena=HashContrasena+'x' WHERE Id=(SELECT UsuarioId FROM DesafiosAcceso WHERE Id=@id);" }
        'CodigoCambiado' { $cmd.CommandText = 'SELECT LEN(HashCodigo) FROM DesafiosAcceso WHERE Id=@id;'; Write-Output $cmd.ExecuteScalar(); return }
    }
    $null = $cmd.ExecuteNonQuery()
} finally { $conexion.Dispose() }
