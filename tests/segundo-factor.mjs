import assert from 'node:assert/strict';
import { Cliente, fixture, leerCodigo } from './cliente-local.mjs';
fixture('Preparar');
const sufijo = Date.now(); let numero = 0;
async function nuevo() {
  const nombre = `dosfa-${sufijo}-${numero++}`;
  fixture('CrearCuenta', nombre);
  const c = new Cliente();
  const r = await c.pedir('/api/auth/login', 'POST', { nombreUsuario: nombre, contrasena: 'Admin123!' });
  assert.equal(r.status, 200, JSON.stringify(r.data));
  assert.equal(r.data.requiereCodigo, true);
  assert.equal(r.data.token, undefined); assert.equal(c.cookies.has('access_token'), false);
  assert.equal((await c.pedir('/api/auth/me')).status, 401);
  const codigo = await leerCodigo(nombre + '@example.com');
  assert.equal(fixture('CodigoCambiado', '', r.data.desafioId), '64');
  return { c, id: r.data.desafioId, codigo, nombre };
}
const verificar = (c,id,codigo) => c.pedir('/api/auth/verificar-codigo','POST',{ desafioId:id,codigo });
try {
  const a = await nuevo();
  assert.equal((await verificar(new Cliente(), a.id, a.codigo)).status, 400);
  assert.equal((await a.c.pedir('/api/auth/verificar-codigo','POST',{desafioId:a.id,codigo:a.codigo},false)).status, 400);
  assert.equal((await a.c.pedir('/api/auth/reenviar-codigo','POST',{desafioId:a.id})).status, 429);
  const copia = a.c.copia();
  assert.equal((await verificar(a.c,a.id,a.codigo)).status, 200);
  assert.equal((await a.c.pedir('/api/auth/me')).status, 200);
  assert.equal((await verificar(copia,a.id,a.codigo)).status, 400);
  console.log('OK: no hay sesión con contraseña sola; cookie de navegador y CSRF obligatorios; código de un solo uso.');

  const b = await nuevo();
  const incorrecto = b.codigo === '000000' ? '000001' : '000000';
  const intentos = await Promise.all(Array.from({length:5}, () => verificar(b.c.copia(),b.id,incorrecto)));
  assert.ok(intentos.every(r=>r.status===400));
  assert.equal((await verificar(b.c,b.id,b.codigo)).status,400);
  fixture('AdelantarReenvio','',b.id);
  assert.equal((await b.c.pedir('/api/auth/reenviar-codigo','POST',{desafioId:b.id})).status,400);
  console.log('OK: cinco fallos concurrentes agotan el desafío; reenviar no permite eludir los intentos.');

  const d = await nuevo(); fixture('Expirar','',d.id);
  assert.equal((await verificar(d.c,d.id,d.codigo)).status,400);
  fixture('AdelantarReenvio','',d.id);
  assert.equal((await d.c.pedir('/api/auth/reenviar-codigo','POST',{desafioId:d.id})).status,200);
  const nuevoCodigo = await leerCodigo(d.nombre+'@example.com');
  assert.notEqual(nuevoCodigo,d.codigo);
  assert.equal((await verificar(d.c,d.id,d.codigo)).status,400);
  assert.equal((await verificar(d.c,d.id,nuevoCodigo)).status,200);
  console.log('OK: vencimiento y reenvío; el código anterior queda inválido.');

  const concurrente = await nuevo();
  const resultados = await Promise.all([concurrente.c.copia(), concurrente.c.copia()].map(c=>verificar(c,concurrente.id,concurrente.codigo)));
  assert.deepEqual(resultados.map(r=>r.status).sort(),[200,400]);
  console.log('OK: dos verificaciones simultáneas crean una sola sesión.');

  for (const accion of ['CambiarCorreo','Desactivar','CambiarClave']) {
    const x = await nuevo(); fixture(accion,'',x.id);
    assert.equal((await verificar(x.c,x.id,x.codigo)).status,400);
  }
  console.log('OK: cambiar correo, desactivar la cuenta o cambiar credenciales invalida el desafío.');

  const e = await nuevo();
  for (let i=0;i<2;i++) {
    fixture('AdelantarReenvio','',e.id);
    assert.equal((await e.c.pedir('/api/auth/reenviar-codigo','POST',{desafioId:e.id})).status,200);
  }
  fixture('AdelantarReenvio','',e.id);
  assert.equal((await e.c.pedir('/api/auth/reenviar-codigo','POST',{desafioId:e.id})).status,429);
  console.log('OK: máximo tres envíos por cuenta en 15 minutos.');

  const demo = new Cliente();
  const local = await demo.pedir('/api/auth/login','POST',{nombreUsuario:'vendedor',contrasena:'Ventas123!'});
  assert.equal(local.status,400); assert.match(local.data.detail,/correo real/);
  console.log('OK: cuentas sin correo real no pueden omitir el segundo factor.');
} finally { fixture('LimpiarUsuarios'); }
