// ============================================
// GOOGLE APPS SCRIPT - Wedding Photos Upload Handler
// ============================================
// INSTRUCCIONES PARA CONFIGURAR:
//
// 1. Crea una carpeta en Google Drive para las fotos del casamiento
// 2. Ve a https://script.google.com/
// 3. Crea un nuevo proyecto
// 4. Pega TODO este código
// 5. En la línea 24, reemplaza 'TU_ID_DE_CARPETA_AQUI' con el ID de tu carpeta de Drive
//    (El ID está en la URL de la carpeta: https://drive.google.com/drive/folders/ID_AQUI)
// 6. Despliega > Nueva implementación > Tipo: Aplicación web
// 7. Configura:
//    - Ejecutar como: Yo (tu email)
//    - Acceso: Cualquiera
// 8. Copia la URL de la aplicación web y pegala en photoUpload.scriptUrl de couples/<pareja>/config.ts
//
// ============================================

// ⚠️ IMPORTANTE: Reemplaza este ID con el ID de tu carpeta de Google Drive
const FOLDER_ID = 'TU_ID_DE_CARPETA_AQUI';

// Función para manejar las solicitudes POST (subida de archivos)
function doPost(e) {
  try {
    Logger.log('Iniciando upload de archivo...');

    // Validar que se recibió un archivo
    if (!e.parameter.file || !e.parameter.filename) {
      return createResponse(false, 'No se recibió ningún archivo');
    }

    // Obtener la carpeta de destino
    const folder = DriveApp.getFolderById(FOLDER_ID);

    // Decodificar el archivo base64
    const fileData = e.parameter.file;
    const fileName = e.parameter.filename;
    const mimeType = e.parameter.mimeType || 'application/octet-stream';

    Logger.log('Nombre del archivo: ' + fileName);
    Logger.log('Tipo MIME: ' + mimeType);

    // Decodificar base64 y crear el blob
    const fileBlob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );

    // Subir el archivo a Drive
    const file = folder.createFile(fileBlob);

    Logger.log('Archivo subido exitosamente: ' + file.getId());

    // Opcional: Hacer el archivo accesible para cualquiera con el enlace
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // Enviar notificación por email (opcional)
    sendUploadNotification(fileName, file.getUrl());

    return createResponse(true, 'Archivo subido exitosamente', {
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: file.getUrl()
    });

  } catch (error) {
    Logger.log('Error: ' + error.toString());
    return createResponse(false, 'Error al subir el archivo: ' + error.toString());
  }
}

// Función para manejar solicitudes GET (verificar que el script funciona)
function doGet(e) {
  return ContentService
    .createTextOutput('Wedding Photos Upload API está funcionando correctamente! ✅\n\nFolder ID configurado: ' + FOLDER_ID)
    .setMimeType(ContentService.MimeType.TEXT);
}

// Función auxiliar para crear respuestas JSON
function createResponse(success, message, data = {}) {
  const response = {
    success: success,
    message: message,
    data: data
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// Función para enviar notificación por email cuando alguien sube una foto
function sendUploadNotification(fileName, fileUrl) {
  try {
    // Configura aquí los emails de los novios
    const EMAIL_NOVIOS = 'novio@ejemplo.com, novia@ejemplo.com';

    const subject = '📸 Nueva foto/video subido - ' + fileName;

    let body = '<html><body style="font-family: Arial, sans-serif;">';
    body += '<div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">';
    body += '<h2 style="color: #d4af37; text-align: center;">📸 Nueva Foto/Video Subido</h2>';
    body += '<div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">';
    body += '<p><strong>Archivo:</strong> ' + fileName + '</p>';
    body += '<p><strong>Fecha:</strong> ' + new Date().toLocaleString('es-AR') + '</p>';
    body += '<div style="margin-top: 20px; text-align: center;">';
    body += '<a href="' + fileUrl + '" style="background: #d4af37; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Archivo</a>';
    body += '</div>';
    body += '</div>';
    body += '<p style="text-align: center; color: #666; margin-top: 20px; font-size: 12px;">Recibido el ' + new Date().toLocaleString('es-AR') + '</p>';
    body += '</div>';
    body += '</body></html>';

    MailApp.sendEmail({
      to: EMAIL_NOVIOS,
      subject: subject,
      htmlBody: body
    });

    Logger.log('Email de notificación enviado');
  } catch (error) {
    Logger.log('Error enviando email: ' + error.toString());
    // No falla el upload si el email falla
  }
}

// ============================================
// FUNCIÓN DE PRUEBA - Ejecuta esta primero
// ============================================
function testScript() {
  try {
    // Verificar que la carpeta existe
    const folder = DriveApp.getFolderById(FOLDER_ID);
    Logger.log('✅ Carpeta encontrada: ' + folder.getName());
    Logger.log('URL de la carpeta: ' + folder.getUrl());

    // Crear un archivo de prueba
    const testContent = 'Este es un archivo de prueba creado el ' + new Date().toLocaleString('es-AR');
    const testFile = folder.createFile('test-' + new Date().getTime() + '.txt', testContent);
    Logger.log('✅ Archivo de prueba creado: ' + testFile.getName());
    Logger.log('URL del archivo: ' + testFile.getUrl());

    // Eliminar el archivo de prueba
    testFile.setTrashed(true);
    Logger.log('✅ Archivo de prueba eliminado');

    Logger.log('\n✅ Test completado exitosamente!');
    Logger.log('El script está listo para usarse.');

    return 'Test completado. Verifica los logs (Ver > Registros)';
  } catch (error) {
    Logger.log('❌ Error en el test: ' + error.toString());
    Logger.log('\n⚠️ Asegúrate de:');
    Logger.log('1. Haber reemplazado FOLDER_ID con el ID real de tu carpeta');
    Logger.log('2. Tener permisos de escritura en la carpeta');
    return 'Error: ' + error.toString();
  }
}

// Función para obtener estadísticas de archivos subidos
function getUploadStats() {
  try {
    const folder = DriveApp.getFolderById(FOLDER_ID);
    const files = folder.getFiles();

    let stats = {
      totalFiles: 0,
      totalImages: 0,
      totalVideos: 0,
      totalSize: 0,
      fileList: []
    };

    while (files.hasNext()) {
      const file = files.next();
      const mimeType = file.getMimeType();
      const size = file.getSize();

      stats.totalFiles++;
      stats.totalSize += size;

      if (mimeType.startsWith('image/')) {
        stats.totalImages++;
      } else if (mimeType.startsWith('video/')) {
        stats.totalVideos++;
      }

      stats.fileList.push({
        name: file.getName(),
        type: mimeType,
        size: formatBytes(size),
        url: file.getUrl(),
        created: file.getDateCreated()
      });
    }

    stats.totalSizeFormatted = formatBytes(stats.totalSize);

    Logger.log('Estadísticas de uploads:');
    Logger.log('Total archivos: ' + stats.totalFiles);
    Logger.log('Total imágenes: ' + stats.totalImages);
    Logger.log('Total videos: ' + stats.totalVideos);
    Logger.log('Tamaño total: ' + stats.totalSizeFormatted);

    return stats;
  } catch (error) {
    Logger.log('Error obteniendo estadísticas: ' + error.toString());
    return null;
  }
}

// Función auxiliar para formatear bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}