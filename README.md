# Wedding App Creator

Generador de invitaciones de boda web. Cada invitación se arma completando **un solo archivo de configuración**, sin tocar el código de la app.

Basado en la invitación original de Flor & Juan (repo `my-wedding-app`), que queda como proyecto aparte.

## Tecnologías

React 19 · TypeScript · Vite 7 · Tailwind CSS 4 · lucide-react · Google Apps Script (RSVP y subida de fotos)

## Cómo crear una invitación nueva

1. **Completar `src/config/wedding.ts`** con los datos de la pareja: nombres, fecha, horarios, lugar, precios, dress code, regalos, textos y colores. Cada campo está documentado en `src/config/types.ts`.
2. **Copiar las imágenes y el video a `public/`** con los nombres que pusiste en `media` (o cambiá los nombres en el config).
3. **Configurar Google**:
   - RSVP: crear una Google Sheet y su Apps Script, y pegar la URL `/exec` en `rsvp.scriptUrl`.
   - Fotos: seguir [SETUP-GOOGLE-DRIVE.md](SETUP-GOOGLE-DRIVE.md) y completar `photoUpload`.
4. Probar con `npm run dev` y publicar.

### Qué se puede configurar

| Sección del config | Qué controla |
|---|---|
| `couple`, `pageTitle`, `date`, `locale` | Nombres, título de la pestaña, fecha y hora (de acá salen la cuenta regresiva y todas las fechas que se muestran) |
| `theme` | Colores de la invitación |
| `media` | Splash, hero (desktop y mobile), video de intro (opcional), fondos y galería |
| `texts` | Textos de bienvenida, cita, historia y galería |
| `schedule` | Horarios (recepción, ceremonia, fiesta...) |
| `location` | Lugar, dirección y mapa de Google Maps |
| `sections` | Prender o apagar precios, galería, dress code, regalos y subida de fotos |
| `prices`, `dressCode`, `gifts` | Contenido de cada sección |
| `rsvp` | Script del formulario, máximo de acompañantes, nota y WhatsApp |
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
├── public/                        Imágenes y video de la invitación
├── src/
│   ├── config/
│   │   ├── types.ts               Tipos documentados de la configuración
│   │   └── wedding.ts             ← Datos de la invitación (lo único que se edita)
│   ├── App.tsx                    App completa (lee todo del config)
│   ├── main.tsx                   Punto de entrada
│   └── style.css                  Tailwind + paleta base
├── google-photos-upload-script.js Apps Script para subir fotos a Drive
└── SETUP-GOOGLE-DRIVE.md          Guía de configuración de la subida de fotos
```

## Pendientes conocidos

- El script de Google Apps Script del RSVP todavía no está en el repo.
- El RSVP se envía con `mode: "no-cors"`, así que la app no puede saber si el guardado falló.
- `App.tsx` todavía es un solo archivo grande. El próximo paso es separarlo en componentes.

## Licencia

Copyright © 2026 Juan Cruz Mezzopeva. Todos los derechos reservados. Ver [LICENSE](LICENSE).
