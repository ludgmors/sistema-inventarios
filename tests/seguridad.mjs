// Ejecutar exclusivamente contra una base local de desarrollo y Mailpit local.
// Crea cuentas de prueba y las inactiva al terminar; conserva su bitácora.
import assert from 'node:assert/strict';

import { Cliente, correos, fixture } from './cliente-local.mjs';
fixture('Preparar');
const admin = new Cliente();
const bootstrap = new Cliente();
const pass = 'Prueba-segura-2026!';
const sufijo = Date.now();
const cuentas = [];
let ejecutor;
let limiteIpOriginal;
async function crear(nombre, rolId) {
  const body = { nombreCompleto: 'Prueba automática de seguridad', nombreUsuario: `test-${nombre}-${sufijo}`,
    correo: `test-${nombre}-${sufijo}@example.com`, contrasena: pass, rolId };
  const r = await admin.pedir('/api/usuarios', 'POST', body);
  assert.equal(r.status, 201, JSON.stringify(r.data)); cuentas.push(r.data); correos.set(r.data.nombreUsuario, r.data.correo); return r.data;
}
try {
  assert.equal((await bootstrap.login(process.env.TEST_ADMIN ?? 'admin', process.env.TEST_PASSWORD ?? 'Admin123!')).status, 200);
  const roles = (await bootstrap.pedir('/api/usuarios/roles')).data;
  const consulta = roles.find(x => x.nombre === 'Consulta').id;
  const administrador = roles.find(x => x.nombre === 'Administrador').id;
  const provision = await bootstrap.pedir('/api/usuarios', 'POST', {
    nombreCompleto: 'Ejecutor de pruebas de seguridad', nombreUsuario: `test-ejecutor-${sufijo}`,
    correo: `test-ejecutor-${sufijo}@example.com`, contrasena: pass, rolId: administrador,
  });
  assert.equal(provision.status, 201); ejecutor = provision.data;
  assert.equal((await admin.login(ejecutor.correo, pass)).status, 200);
  limiteIpOriginal = (await admin.pedir('/api/parametros')).data.find(x => x.clave === 'Seguridad.LoginPorIp').valor;
  assert.equal((await admin.pedir('/api/parametros', 'PUT', {
    parametros: [{ clave: 'Seguridad.LoginPorIp', valor: '100' }],
  })).status, 200);

  assert.equal((await admin.pedir('/api/usuarios', 'POST', {}, false)).status, 400);
  const sinCsrf = new Cliente();
  assert.equal((await sinCsrf.pedir('/api/auth/login', 'POST', { nombreUsuario: 'admin', contrasena: 'x' }, false)).status, 400);
  console.log('OK: CSRF obligatorio, incluso en login.');

  const u = await crear('sesion', consulta);
  const c = new Cliente();
  const login = await c.login(u.correo.toUpperCase(), pass);
  assert.equal(login.status, 200); assert.equal(login.data.token, undefined);
  assert.equal((await c.pedir('/api/auth/me')).status, 200);
  const robada = new Cliente(); robada.cookies = new Map(c.cookies);
  assert.equal((await c.pedir('/api/auth/logout', 'POST')).status, 200);
  assert.equal((await robada.pedir('/api/auth/me')).status, 401);
  console.log('OK: login por correo, JWT ausente del JSON y logout revoca una cookie copiada.');

  assert.equal((await c.login(u.nombreUsuario, pass)).status, 200);
  const anterior = new Cliente(); anterior.cookies = new Map(c.cookies);
  assert.equal((await c.pedir('/api/auth/cambiar-contrasena', 'POST', { contrasenaActual: pass, contrasenaNueva: pass + '2' })).status, 200);
  assert.equal((await anterior.pedir('/api/auth/me')).status, 401);
  assert.equal((await c.login(u.nombreUsuario, pass + '2')).status, 200);
  console.log('OK: cambiar contraseña invalida las sesiones anteriores.');

  const recuperacion = await c.pedir('/api/auth/recuperar', 'POST', { correo: u.correo });
  assert.equal(recuperacion.status, 200);
  const mensajes = await (await fetch('http://localhost:8025/api/v1/messages')).json();
  const mensaje = mensajes.messages.find(x => x.To.some(t => t.Address === u.correo));
  assert.ok(mensaje, 'Debe llegar el correo a Mailpit.');
  const contenido = await (await fetch(`http://localhost:8025/api/v1/message/${mensaje.ID}`)).json();
  const token = contenido.Text.match(/#token=([A-F0-9]{64})/)[1];
  const anonimo = new Cliente();
  assert.equal((await anonimo.pedir('/api/auth/restablecer', 'POST', { token, contrasenaNueva: pass + '3' })).status, 200);
  assert.equal((await c.pedir('/api/auth/me')).status, 401);
  assert.equal((await anonimo.pedir('/api/auth/restablecer', 'POST', { token, contrasenaNueva: pass + '4' })).status, 400);
  assert.equal((await c.login(u.correo, pass + '3')).status, 200);
  console.log('OK: recuperación por correo, revocación y rechazo del token reutilizado.');

  const malCorreo = await admin.pedir('/api/usuarios', 'POST', { nombreCompleto: 'Inválido', nombreUsuario: `invalido-${sufijo}`,
    correo: 'correo@localhost', contrasena: pass, rolId: consulta });
  assert.equal(malCorreo.status, 400);
  console.log('OK: se rechazan correos sin dominio completo.');

  // La cuota es por cuenta, también cuando se alternan alias y correo.
  const intentos = new Cliente();
  for (let i = 0; i < 6; i++) assert.equal((await intentos.login(i % 2 ? u.correo : u.nombreUsuario, 'incorrecta')).status, 400);
  const limitado = await intentos.login(u.correo, pass + '3');
  assert.equal(limitado.status, 429); assert.ok(limitado.headers.get('retry-after'));
  assert.equal((await c.pedir('/api/auth/me')).status, 200, 'Intentos anónimos no deben expulsar sesiones válidas.');
  console.log('OK: límite de login unificado por cuenta, sin expulsión por intentos ajenos.');

  const bot = await crear('bot', administrador);
  const b1 = new Cliente(), b2 = new Cliente();
  assert.equal((await b1.login(bot.correo, pass)).status, 200);
  assert.equal((await b2.login(bot.correo, pass)).status, 200);
  for (let i = 0; i < 5; i++) assert.equal((await b1.pedir('/api/usuarios', 'POST', {})).status, 400);
  const bloqueado = await b1.pedir('/api/usuarios', 'POST', {});
  assert.equal(bloqueado.status, 429); assert.equal(bloqueado.data.sesionCerrada, true);
  assert.equal((await b2.pedir('/api/auth/me')).status, 401);
  assert.equal((await b2.login(bot.correo, pass)).status, 429);
  console.log('OK: exceso de creación bloquea temporalmente la cuenta y revoca todas sus sesiones.');

  const operativo = await crear('operaciones', consulta);
  const operacion = new Cliente(), copiaOperacion = new Cliente();
  assert.equal((await operacion.login(operativo.correo, pass)).status, 200);
  copiaOperacion.cookies = new Map(operacion.cookies);
  // Peticiones no autorizadas también consumen cuota y no alteran el inventario.
  for (let i = 0; i < 30; i++) assert.equal((await operacion.pedir('/api/usuarios', 'POST', {})).status, 403);
  assert.equal((await operacion.pedir('/api/usuarios', 'POST', {})).status, 429);
  assert.equal((await copiaOperacion.pedir('/api/auth/me')).status, 401);
  console.log('OK: exceso de operaciones revoca la sesión sin modificar inventario.');

  // El rol se comprueba contra el estado actual, no solo contra el claim del JWT.
  assert.equal((await admin.pedir(`/api/usuarios/${u.id}`, 'PUT', { ...u, rolId: administrador })).status, 200);
  assert.equal((await c.pedir('/api/auth/me')).status, 401);
  console.log('OK: los cambios de rol invalidan tokens existentes.');
} finally {
  if (limiteIpOriginal) assert.equal((await admin.pedir('/api/parametros', 'PUT', {
    parametros: [{ clave: 'Seguridad.LoginPorIp', valor: limiteIpOriginal }],
  })).status, 200);
  for (const u of cuentas) {
    const r = await admin.pedir(`/api/usuarios/${u.id}`, 'PUT', { ...u, activo: false });
    assert.equal(r.status, 200, 'No se pudo inactivar la cuenta de prueba.');
  }
  await admin.pedir('/api/auth/logout', 'POST');
  if (ejecutor) assert.equal((await bootstrap.pedir(`/api/usuarios/${ejecutor.id}`, 'PUT', { ...ejecutor, activo: false })).status, 200);
  await bootstrap.pedir('/api/auth/logout', 'POST');
}
