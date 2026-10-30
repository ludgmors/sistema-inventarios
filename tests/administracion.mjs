import assert from 'node:assert/strict';
import { Cliente, correos, fixture } from './cliente-local.mjs';
fixture('Preparar');
const sello = Date.now();
const superNombre = `dosfa-super-${sello}`, adminNombre = `dosfa-admin-${sello}`, normalNombre = `dosfa-normal-${sello}`;
for (const nombre of [superNombre, adminNombre, normalNombre]) {
  fixture('CrearCuenta', nombre); correos.set(nombre, nombre + '@example.com');
}
fixture('HacerSuperadmin', superNombre); fixture('HacerAdministrador', adminNombre);
const superior = new Cliente(), admin = new Cliente(), normal = new Cliente();
const creados = [];
try {
  const s = await superior.login(superNombre, 'Admin123!'); assert.equal(s.status, 200, JSON.stringify(s.data)); assert.equal(s.data.usuario.rol, 'Superadmin');
  const a = await admin.login(adminNombre, 'Admin123!'); assert.equal(a.status, 200);
  assert.equal((await normal.login(normalNombre, 'Admin123!')).status, 200);
  const roles = (await superior.pedir('/api/usuarios/roles')).data;
  const rolSuper = roles.find(x => x.nombre === 'Superadmin').id;
  const rolAdmin = roles.find(x => x.nombre === 'Administrador').id;
  const rolConsulta = roles.find(x => x.nombre === 'Consulta').id;
  assert.equal((await superior.pedir('/api/administracion/resumen')).status, 200);
  assert.equal((await admin.pedir('/api/administracion/resumen')).status, 200);
  assert.equal((await normal.pedir('/api/administracion/resumen')).status, 403);
  assert.equal((await normal.pedir('/api/usuarios')).status, 403);
  assert.ok(!(await admin.pedir('/api/usuarios/roles')).data.some(x => x.nombre === 'Superadmin'));
  console.log('OK: panel restringido a administradores y superadmins; lista de roles filtrada en servidor.');
  const datos = { nombreCompleto:'Prueba jerarquía', nombreUsuario:`dosfa-nuevo-${sello}`, correo:`dosfa-nuevo-${sello}@example.com`, contrasena:'Clave-pruebas-2026!', rolId:rolSuper };
  assert.equal((await admin.pedir('/api/usuarios','POST',datos)).status,403);
  const actualizarSuper = { nombreCompleto:s.data.usuario.nombreCompleto, correo:s.data.usuario.correo, rolId:rolSuper, activo:true };
  assert.equal((await admin.pedir(`/api/usuarios/${s.data.usuario.id}`,'PUT',actualizarSuper)).status,403);
  assert.equal((await admin.pedir(`/api/usuarios/${s.data.usuario.id}/contrasena`,'PUT',{contrasenaNueva:'Otra-clave-2026!'})).status,403);
  assert.equal((await admin.pedir(`/api/usuarios/${a.data.usuario.id}`,'PUT',{...actualizarSuper,correo:a.data.usuario.correo,rolId:rolSuper})).status,403);
  assert.equal((await superior.pedir('/api/auth/me')).status,200);
  console.log('OK: administrador no puede elevarse, crear superadmins ni editar/restablecer sus credenciales.');
  const nuevoAdmin = await admin.pedir('/api/usuarios','POST',{...datos,rolId:rolAdmin});
  assert.equal(nuevoAdmin.status,201,JSON.stringify(nuevoAdmin.data)); creados.push(nuevoAdmin.data);
  assert.equal((await admin.pedir(`/api/usuarios/${nuevoAdmin.data.id}`,'PUT',{...nuevoAdmin.data,nombreCompleto:'Administrador actualizado'})).status,200);
  console.log('OK: administrador puede crear y gestionar otros administradores.');
  const nuevoSuper = await superior.pedir('/api/usuarios','POST',{...datos,nombreUsuario:`dosfa-otro-${sello}`,correo:`dosfa-otro-${sello}@example.com`});
  assert.equal(nuevoSuper.status,201,JSON.stringify(nuevoSuper.data)); creados.push(nuevoSuper.data);
  assert.equal((await superior.pedir(`/api/usuarios/${nuevoSuper.data.id}`,'PUT',{...nuevoSuper.data,rolId:rolConsulta})).status,200);
  assert.equal((await superior.pedir(`/api/usuarios/${s.data.usuario.id}`,'PUT',{...actualizarSuper,activo:false})).status,400);
  assert.equal((await superior.pedir(`/api/usuarios/${s.data.usuario.id}`,'PUT',{...actualizarSuper,rolId:rolConsulta})).status,400);
  assert.equal((await superior.pedir('/api/parametros','PUT',{parametros:[]})).status,200);
  assert.equal((await superior.pedir('/api/compras')).status,200);
  assert.equal((await superior.pedir('/api/ventas')).status,200);
  console.log('OK: superadmin gestiona todos los niveles y accede a módulos existentes; no puede quitarse su propio acceso.');
} finally {
  // La base y las cuentas de estas pruebas son exclusivas del entorno de pruebas.
  fixture('LimpiarUsuarios');
}
