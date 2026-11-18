import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

// https://vite.dev/config/
//
// Cada pareja vive en couples/<nombre>/ (config.ts + public/).
// Cuál se usa se elige con la variable COUPLE:
//   - en tu compu: archivo .env.local con COUPLE=juan-y-flavia
//   - en Vercel/Netlify: variable de entorno COUPLE
// Solo la pareja elegida entra al build (no se mezclan datos entre parejas).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const couple = process.env.COUPLE || env.COUPLE || 'ejemplo'

  // En Netlify/Vercel, COUPLE es obligatoria: sin ella se publicaría la pareja
  // de ejemplo por error.
  const isHosting = Boolean(process.env.NETLIFY || process.env.VERCEL)
  if (isHosting && !process.env.COUPLE) {
    throw new Error('Falta la variable de entorno COUPLE (ej: juan-y-flavia) en la configuración del sitio')
  }
  const coupleDir = resolve(__dirname, 'couples', couple)

  if (!existsSync(resolve(coupleDir, 'config.ts'))) {
    throw new Error(`No existe la pareja "${couple}" (falta couples/${couple}/config.ts)`)
  }
  console.log(`\n💍 Invitación: ${couple}\n`)

  return {
    plugins: [react(), tailwindcss()],
    publicDir: resolve(coupleDir, 'public'),
    resolve: {
      alias: {
        '@couple': resolve(coupleDir, 'config.ts'),
      },
    },
  }
})
