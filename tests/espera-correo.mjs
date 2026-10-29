import assert from 'node:assert/strict';
import { Cliente, fixture } from './cliente-local.mjs';
fixture('Preparar');
const nombre = `dosfa-espera-${Date.now()}`;
fixture('CrearCuenta', nombre);
fixture('VentanaEnvios', nombre);
const c = new Cliente();
try {
  const login = () => c.pedir('/api/auth/login', 'POST', { nombreUsuario: nombre, contrasena: 'Admin123!' });
  const limitado = await login();
  assert.equal(limitado.status, 429);
  assert.match(limitado.data.detail, /envíos de código/);
  assert.match(limitado.data.detail, /No es un error de contraseña/);
  const espera = Number(limitado.headers.get('retry-after'));
  assert.ok(espera > 0 && espera <= 10, `Espera inesperada: ${espera}`);
  fixture('VencerVentanaEnvios', nombre);
  // La petición rechazada no debe reservar otra espera de 60 segundos.
  const correcto = await login();
  assert.equal(correcto.status, 200, JSON.stringify(correcto.data));
  assert.equal(correcto.data.requiereCodigo, true);
  const inmediato = await login();
  assert.equal(inmediato.status, 429);
  assert.match(inmediato.data.detail, /esperar entre solicitudes/);
  assert.ok(Number(inmediato.headers.get('retry-after')) <= 60);
  console.log('OK: espera restante real, sin ampliar 15 minutos; petición rechazada no consume espera ni envíos; enfriamiento de 60 segundos conservado.');
} finally { fixture('LimpiarUsuarios'); }
