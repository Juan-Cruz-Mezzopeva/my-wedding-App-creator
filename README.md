# Wedding App Creator

Generador de invitaciones de boda web. Cada invitación se arma completando **un solo archivo de configuración**, sin tocar el código de la app.

Basado en la invitación original de Flor & Juan (repo `my-wedding-app`), que queda como proyecto aparte.

## Tecnologías

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · lucide-react · Google Apps Script (RSVP y subida de fotos)

## Cómo funciona

Cada pareja tiene su carpeta en `couples/`:

```
couples/
├── ejemplo/              Pareja de ejemplo (plantilla para copiar)
│   ├── config.ts         Todos los datos de la invitación
│   └── public/           Imágenes, video y música de esa pareja
└── juan-y-flavia/
    ├── config.ts
    └── public/
```

Qué pareja se muestra lo decide la variable `COUPLE`. Solo esa pareja entra al build, así que los datos de una pareja nunca aparecen en la invitación de otra.

## Cómo crear una invitación nueva

1. **Copiar `couples/ejemplo/`** a `couples/<nombre-de-la-pareja>/`.
2. **Completar `config.ts`** con los datos de la pareja: nombres, fecha, horarios, lugar, hospedaje, precios, dress code, regalos, textos y colores. Cada campo está documentado en `src/config/types.ts`.
3. **Copiar imágenes, video y música a su `public/`** con los nombres que pusiste en `media`.
4. **Configurar Google**:
   - RSVP: seguir las instrucciones de [`google-apps-script/rsvp.gs`](google-apps-script/rsvp.gs) y pegar la URL `/exec` en `rsvp.scriptUrl`.
   - Fotos: seguir [SETUP-GOOGLE-DRIVE.md](SETUP-GOOGLE-DRIVE.md) y completar `photoUpload`.
5. **Elegir la pareja** creando un archivo `.env.local` en la raíz con:
   ```
   COUPLE=nombre-de-la-pareja
   ```
   (sin ese archivo se usa `ejemplo`). Probar con `npm run dev`.
6. **Publicar**: en Vercel o Netlify, un proyecto por pareja, con la variable de entorno `COUPLE`.

### Qué se puede configurar

| Sección del config | Qué controla |
|---|---|
| `couple`, `initials`, `pageTitle`, `date`, `locale` | Nombres, monograma, título de la pestaña, fecha y hora (de acá salen la cuenta regresiva y todas las fechas que se muestran) |
| `theme` | Colores de la invitación (incluye un color de detalle, `accent`) |
| `media` | Splash, hero (desktop y mobile), video de intro y música de fondo (opcionales), fondos y galería |
| `texts` | Textos de bienvenida, cita con su fuente, título e historia, galería |
| `schedule` | Horarios (recepción, ceremonia, fiesta...) |
| `location` | Lugar, dirección y mapa de Google Maps |
| `sections` | Prender o apagar hospedaje, precios, galería, dress code, regalos y subida de fotos |
| `lodging`, `prices`, `dressCode`, `gifts` | Contenido de cada sección |
| `rsvp` | Script del formulario, máximo de acompañantes, si se piden los nombres de cada acompañante, nota y WhatsApp |
| `photoUpload` | Script de subida, carpeta de Drive y tamaño máximo por archivo |
| `footer` | Links de Instagram |

Si un link (mapa, lista de regalos, carpeta de Drive) se deja vacío, su botón no se muestra. Si `media.video` se deja vacío, se saltea el video.

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # desarrollo
npm run build    # build de producción (chequea tipos)
npm run preview  # previsualizar el build
```

## Estructura

```
├── couples/                       Una carpeta por pareja (config.ts + public/)
├── src/
│   ├── config/types.ts            Tipos documentados de la configuración
│   ├── App.tsx                    App completa (lee todo del config de la pareja)
│   ├── main.tsx                   Punto de entrada
│   └── style.css                  Tailwind + paleta base
├── google-apps-script/
│   ├── rsvp.gs                    Guarda las confirmaciones en una Google Sheet
│   └── fotos-drive.gs             Sube las fotos de los invitados a Drive
├── SETUP-GOOGLE-DRIVE.md          Guía de configuración de la subida de fotos
└── vite.config.ts                 Elige la pareja según COUPLE
```

## Pendientes conocidos

- `App.tsx` todavía es un solo archivo grande. El próximo paso es separarlo en componentes.

## Licencia

Copyright © 2026 Juan Cruz Mezzopeva. Todos los derechos reservados. Ver [LICENSE](LICENSE).
