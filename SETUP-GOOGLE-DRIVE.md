# 📸 Configuración de Upload de Fotos a Google Drive

Esta guía te explicará paso a paso cómo configurar la funcionalidad de carga de fotos/videos a Google Drive desde tu aplicación web de invitación de boda.

## 🎯 Objetivo

Permitir que los invitados suban fotos y videos del casamiento directamente desde la página web, y que estos archivos se guarden automáticamente en tu carpeta de Google Drive.

---

## 📋 Paso 1: Crear Carpeta en Google Drive

1. Ve a [Google Drive](https://drive.google.com)
2. Crea una nueva carpeta con el nombre que desees (ej: "Fotos Boda Ana & Pablo")
3. **Abre la carpeta** y copia el ID de la URL:
   - La URL se verá así: `https://drive.google.com/drive/folders/`**`1ABC123xyz...`**
   - La parte después de `/folders/` es el **ID de la carpeta**
   - **Guarda este ID**, lo necesitarás más adelante

### Ejemplo:
```
URL completa: https://drive.google.com/drive/folders/1kF7mN9pQ2rS3tU4vW5xY6zA7bC8dE9fG0h
ID de carpeta: 1kF7mN9pQ2rS3tU4vW5xY6zA7bC8dE9fG0h
```

---

## 📋 Paso 2: Crear el Google Apps Script

1. Ve a [Google Apps Script](https://script.google.com)
2. Haz clic en **"Nuevo proyecto"**
3. Dale un nombre: **"Wedding Photos Upload API"**
4. Borra todo el código que aparece por defecto
5. Abre el archivo `google-photos-upload-script.js` de tu proyecto
6. **Copia TODO el código** de ese archivo
7. **Pégalo** en el editor de Google Apps Script

---

## 📋 Paso 3: Configurar el Script

### 3.1 Reemplazar el ID de la Carpeta

En la línea 24 del script, encontrarás:

```javascript
const FOLDER_ID = 'TU_ID_DE_CARPETA_AQUI';
```

Reemplázalo con el ID que copiaste en el Paso 1:

```javascript
const FOLDER_ID = '1kF7mN9pQ2rS3tU4vW5xY6zA7bC8dE9fG0h';
```

### 3.2 Configurar Emails para Notificaciones (Opcional)

En la línea 103, puedes configurar los emails que recibirán notificaciones cuando alguien suba una foto:

```javascript
const EMAIL_NOVIOS = 'novio@ejemplo.com, novia@ejemplo.com';
```

Cambia estos emails por los tuyos si deseas.

---

## 📋 Paso 4: Probar el Script

Antes de desplegar, vamos a probar que funcione correctamente:

1. En el editor de Google Apps Script, selecciona la función **`testScript`** en el menú desplegable
2. Haz clic en el botón **"Ejecutar"** (▶️)
3. La primera vez te pedirá autorización:
   - Haz clic en **"Revisar permisos"**
   - Selecciona tu cuenta de Google
   - Haz clic en **"Avanzado"**
   - Haz clic en **"Ir a Wedding Photos Upload API (no seguro)"**
   - Haz clic en **"Permitir"**
4. Ve a **"Ver > Registros"** (o **"Ver > Ejecuciones"**)
5. Deberías ver mensajes como:
   ```
   ✅ Carpeta encontrada: Fotos Boda Ana & Pablo
   ✅ Archivo de prueba creado: test-123456789.txt
   ✅ Archivo de prueba eliminado
   ✅ Test completado exitosamente!
   ```

Si ves estos mensajes, ¡el script está configurado correctamente!

---

## 📋 Paso 5: Desplegar como Aplicación Web

1. En el editor de Google Apps Script, haz clic en **"Implementar"** → **"Nueva implementación"**
2. Haz clic en el ícono de ⚙️ junto a **"Seleccionar tipo"**
3. Selecciona **"Aplicación web"**
4. Configura los siguientes campos:
   - **Descripción:** "Wedding Photos Upload API"
   - **Ejecutar como:** "Yo (tu email)"
   - **Acceso:** "Cualquier persona"
5. Haz clic en **"Implementar"**
6. **Copia la URL de la aplicación web** que aparece (se verá así):
   ```
   https://script.google.com/macros/s/AKfycbx...ABC123.../exec
   ```
7. **Guarda esta URL**, la necesitarás en el siguiente paso

---

## 📋 Paso 6: Configurar la Aplicación React

Abrí `src/config/wedding.ts` y completá la sección `photoUpload`:

```ts
photoUpload: {
  scriptUrl: "https://script.google.com/macros/s/AKfycbx...ABC123.../exec", // URL del Paso 5
  driveFolderUrl: "https://drive.google.com/drive/folders/1kF7mN9pQ2rS3tU4vW5xY6zA7bC8dE9fG0h", // carpeta del Paso 1
  maxFileSizeMB: 25,
},
```

No hace falta tocar `App.tsx`.

---

## 📋 Paso 7: Probar la Funcionalidad

1. Inicia tu aplicación React:
   ```bash
   npm run dev
   ```
2. Ve a la sección "Compartí tus Fotos" (última sección de la página)
3. Haz clic en **"Seleccionar Fotos/Videos"**
4. Selecciona una o varias fotos de prueba
5. Haz clic en **"Subir Archivos"**
6. Deberías ver:
   - Barra de progreso para cada archivo
   - Mensaje de éxito cuando se complete: "✅ Subido exitosamente"
7. Verifica en tu carpeta de Google Drive que las fotos se hayan subido correctamente
8. Si configuraste las notificaciones por email, deberías recibir un correo

---

## ✅ ¡Listo!

Tu funcionalidad de upload de fotos está completamente configurada. Ahora los invitados podrán:

- ✅ Ver la carpeta de Google Drive directamente
- ✅ Subir fotos y videos desde la web (hasta el límite de `maxFileSizeMB`, 25MB por defecto)
- ✅ Ver el progreso de cada archivo en tiempo real
- ✅ Recibir confirmación cuando se complete la subida

---

## 🎨 Características Implementadas

### Validaciones
- ✅ Solo acepta imágenes y videos
- ✅ Tamaño máximo configurable (`maxFileSizeMB`, 25MB por defecto)
- ✅ Validación antes de subir

### UI/UX
- ✅ Selección múltiple de archivos
- ✅ Preview de archivos seleccionados con tamaño
- ✅ Barra de progreso individual por archivo
- ✅ Indicadores de estado (pendiente, subiendo, éxito, error)
- ✅ Botón para limpiar selección
- ✅ Resumen de archivos subidos exitosamente
- ✅ Mensajes de error detallados

### Backend
- ✅ Subida automática a Google Drive
- ✅ Notificaciones por email (opcional)
- ✅ Permisos automáticos de lectura para archivos
- ✅ Logging detallado para debugging

---

## 🔧 Solución de Problemas

### Error: "No se recibió ningún archivo"
**Causa:** El archivo no se está convirtiendo correctamente a base64.
**Solución:** Verifica que el navegador soporte FileReader API.

### Error: "Folder not found"
**Causa:** El ID de la carpeta en el script no es correcto.
**Solución:** Vuelve al Paso 3.1 y verifica que copiaste el ID correctamente.

### Error: "Permission denied"
**Causa:** El script no tiene permisos para escribir en la carpeta.
**Solución:**
1. Ve a Google Apps Script
2. Elimina la implementación actual
3. Crea una nueva implementación (Paso 5)
4. Autoriza nuevamente los permisos

### No se suben los archivos
**Causa:** La URL `photoUpload.scriptUrl` en `src/config/wedding.ts` no es correcta.
**Solución:** Verifica que la URL en el Paso 6.1 termine en `/exec` y no contenga espacios.

### Los emails no llegan
**Causa:** Los emails están en la carpeta de spam o la configuración es incorrecta.
**Solución:**
1. Revisa la carpeta de spam
2. Verifica que los emails en el Paso 3.2 sean correctos
3. En Gmail, marca el email como "No es spam"

---

## 📞 Soporte

Si tienes problemas con la configuración:

1. Verifica que hayas seguido todos los pasos en orden
2. Revisa los logs en Google Apps Script (**Ver > Registros**)
3. Abre la consola del navegador (F12) para ver errores de JavaScript
4. Verifica que la carpeta de Drive exista y tengas permisos

---

## 📝 Notas Adicionales

### Límites de Google Apps Script
- Las solicitudes muy grandes fallan, y el archivo viaja en base64 (pesa ~33% más). Por eso el límite por defecto es 25MB por archivo; subirlo mucho hace que los videos grandes fallen.
- Máximo 6 minutos de ejecución
- Máximo 100 emails por día

### Seguridad
- Los archivos se almacenan en tu cuenta de Google Drive
- Solo tú tienes acceso completo a la carpeta
- Los archivos subidos tienen permisos de solo lectura para quien tenga el link
- No se almacenan archivos en el servidor de la web

### Formatos Soportados
- **Imágenes:** JPG, JPEG, PNG, GIF, WEBP, HEIC, etc.
- **Videos:** MP4, MOV, AVI, MKV, WEBM, etc.

---

**¡Disfruta de tu boda y que tus invitados compartan todos los recuerdos! 💑📸**
