# Frontend — Sistema de Inventarios

Aplicación web desarrollada con Next.js 15, React 19, TypeScript y Tailwind CSS 4.

## Requisitos

- Node.js 22 o superior.
- Backend del Sistema de Inventarios en ejecución.

## Configuración

1. Instalar dependencias:

```powershell
npm install
```

2. Crear `.env.local` a partir de `.env.example`:

```text
API_URL=http://localhost:5279
```

3. Iniciar el servidor de desarrollo:

```powershell
npm run dev
```

Aplicación: `http://localhost:3000`

## Producción

```powershell
npm run build
npm run start
```

Las solicitudes a `/api/*` se reescriben al backend definido en `API_URL`. La autenticación usa la cookie `httpOnly` `access_token`, emitida por la API.

## Estructura

```text
src/
├── app/            Rutas del App Router
├── components/     Layout, UI compartida e inventario
├── lib/            Cliente API, tipos, formatos y hooks
└── middleware.ts   Protección de rutas por cookie
```

## Documentación

La documentación completa está en la carpeta [`../docs`](../docs):

- [Informe](../docs/informe.md)
- [Manual de usuario](../docs/manual-usuario.md)
- [Despliegue](../docs/despliegue.md)
- [Pruebas](../docs/pruebas.md)
