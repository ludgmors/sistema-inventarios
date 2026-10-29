import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
export const base = process.env.TEST_API_URL ?? 'http://localhost:5280';
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname) || new URL(base).port !== '5280')
  throw new Error('Usar API aislada de pruebas en localhost:5280 con SMTP Mailpit.');
export const correos = new Map([['admin', 'admin@example.com']]);
export function fixture(accion, usuario = '', id = '') {
  return execFileSync('powershell.exe', ['-NoProfile', '-File', fileURLToPath(new URL('./Fixture-SegundoFactor.ps1', import.meta.url)),
    '-Accion', accion, '-Usuario', usuario, '-DesafioId', id], { encoding: 'utf8' }).trim();
}
export async function leerCodigo(correo) {
  const mensajes = await (await fetch('http://localhost:8025/api/v1/messages?limit=100')).json();
  const m = mensajes.messages.find(x => x.Subject === 'Código de acceso - Sistema de Inventarios' && x.To.some(t => t.Address === correo));
  assert.ok(m, `Debe existir un mensaje para ${correo}`);
  const contenido = await (await fetch(`http://localhost:8025/api/v1/message/${m.ID}`)).json();
  return contenido.Text.match(/\b[0-9]{6}\b/)[0];
}
export class Cliente {
  cookies = new Map();
  copia() { const c = new Cliente(); c.cookies = new Map(this.cookies); return c; }
  async pedir(ruta, method = 'GET', body, csrf = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (csrf && !['GET', 'HEAD'].includes(method)) {
      const r = await this.pedir('/api/auth/csrf');
      assert.equal(r.status, 200, JSON.stringify(r.data)); headers['X-CSRF-TOKEN'] = r.data.token;
    }
    headers.Cookie = [...this.cookies].map(([k,v]) => `${k}=${v}`).join('; ');
    const r = await fetch(base + ruta, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    for (const cookie of r.headers.getSetCookie()) {
      const kv = cookie.split(';')[0], i = kv.indexOf('='), k = kv.slice(0,i), v = kv.slice(i+1);
      if (v) this.cookies.set(k,v); else this.cookies.delete(k);
    }
    const texto = await r.text();
    return { status: r.status, data: texto ? JSON.parse(texto) : null, headers: r.headers };
  }
  async login(usuario, contrasena) {
    // Solo para regresión ajena a las cuotas 2FA; las pruebas 2FA usan pedir directamente.
    fixture('PermitirEnvio', usuario);
    const r = await this.pedir('/api/auth/login', 'POST', { nombreUsuario: usuario, contrasena });
    if (r.status !== 200) return r;
    assert.equal(r.data.requiereCodigo, true);
    const codigo = await leerCodigo(correos.get(usuario) ?? usuario.toLowerCase());
    return this.pedir('/api/auth/verificar-codigo', 'POST', { desafioId: r.data.desafioId, codigo });
  }
}
