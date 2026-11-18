// ============================================
// GOOGLE APPS SCRIPT - Wedding RSVP Handler
// ============================================
// Guarda cada confirmación del formulario en una Google Sheet y avisa por
// email a los novios.
//
// CÓMO USARLO (una vez por pareja):
// 1. Crear una Google Sheet nueva para la pareja.
// 2. En la Sheet: Extensiones > Apps Script. Pegar TODO este código.
// 3. Cambiar EMAIL_NOVIOS (más abajo) por los emails de los novios.
// 4. Ejecutar testScript una vez y aceptar los permisos.
// 5. Implementar > Nueva implementación > Aplicación web
//    - Ejecutar como: Yo
//    - Acceso: Cualquier persona
// 6. Copiar la URL que termina en /exec y pegarla en rsvp.scriptUrl del
//    config de la pareja (couples/<pareja>/config.ts).
// ============================================

// ⚠️ Emails que reciben el aviso de cada confirmación (separados por coma)
var EMAIL_NOVIOS = "novio@ejemplo.com, novia@ejemplo.com";

var HEADERS = [
  "Fecha de Respuesta",
  "Timestamp",
  "Nombre",
  "Email",
  "Teléfono",
  "Asistencia",
  "Número de Acompañantes",
  "Nombres de Acompañantes",
  "Alergias",
  "Dieta Especial",
  "Mensaje",
];

function doPost(e) {
  try {
    // Obtener la hoja de cálculo activa
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Parsear los datos recibidos
    var data = JSON.parse(e.postData.contents);

    // Verificar si es la primera vez que se ejecuta (agregar encabezados)
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);

      // Formatear encabezados
      var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground("#d4af37");
      headerRange.setFontColor("#ffffff");
      headerRange.setFontWeight("bold");
      headerRange.setHorizontalAlignment("center");
    }

    // Agregar los datos a una nueva fila
    sheet.appendRow([
      data.fecha || new Date().toLocaleString("es-AR"),
      data.timestamp || new Date().toISOString(),
      data.nombre || "",
      data.email || "",
      data.telefono || "",
      data.asistencia || "",
      data.numeroAcompanantes || "0",
      data.nombresAcompanantes || "",
      data.alergias || "Ninguna",
      data.dietaEspecial || "Ninguna",
      data.mensaje || "",
    ]);

    // Auto-ajustar columnas
    sheet.autoResizeColumns(1, HEADERS.length);

    // Enviar email de notificación (opcional)
    sendNotificationEmail(data);

    // Responder con éxito
    return ContentService.createTextOutput(
      JSON.stringify({
        result: "success",
        message: "Datos guardados correctamente",
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Log del error para debugging
    Logger.log("Error en doPost: " + error.toString());

    // Manejar errores
    return ContentService.createTextOutput(
      JSON.stringify({
        result: "error",
        message: error.toString(),
      }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Función para enviar email de notificación a los novios
function sendNotificationEmail(data) {
  // Escapar lo que escribió el invitado antes de meterlo en el HTML del email
  data = escapeData(data);
  var subject = "🎉 Nueva confirmación de asistencia - " + data.nombre;

  var body = '<html><body style="font-family: Arial, sans-serif;">';
  body +=
    '<div style="max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; border-radius: 10px;">';
  body +=
    '<h2 style="color: #d4af37; text-align: center;">Nueva Confirmación de Asistencia</h2>';
  body +=
    '<div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">';
  body += "<p><strong>Nombre:</strong> " + data.nombre + "</p>";
  body += "<p><strong>Email:</strong> " + data.email + "</p>";
  body +=
    "<p><strong>Teléfono:</strong> " +
    (data.telefono || "No proporcionado") +
    "</p>";
  body +=
    "<p><strong>Asistencia:</strong> " +
    formatAsistencia(data.asistencia) +
    "</p>";
  body +=
    "<p><strong>Acompañantes:</strong> " + data.numeroAcompanantes + "</p>";
  if (data.nombresAcompanantes) {
    body +=
      "<p><strong>Nombres:</strong> " + data.nombresAcompanantes + "</p>";
  }
  body +=
    "<p><strong>Alergias:</strong> " + (data.alergias || "Ninguna") + "</p>";
  body +=
    "<p><strong>Dieta Especial:</strong> " +
    formatDieta(data.dietaEspecial) +
    "</p>";

  if (data.mensaje) {
    body +=
      '<div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #d4af37; border-radius: 4px;">';
    body += '<p style="margin: 0;"><strong>Mensaje:</strong></p>';
    body += '<p style="margin: 10px 0 0 0;">' + data.mensaje + "</p>";
    body += "</div>";
  }

  body += "</div>";
  body +=
    '<p style="text-align: center; color: #666; margin-top: 20px; font-size: 12px;">Recibido el ' +
    data.fecha +
    "</p>";
  body += "</div>";
  body += "</body></html>";

  try {
    MailApp.sendEmail({
      to: EMAIL_NOVIOS,
      subject: subject,
      htmlBody: body,
    });
  } catch (error) {
    Logger.log("Error enviando email: " + error.toString());
  }
}

// Escapa los caracteres especiales de HTML en todos los campos de texto
function escapeData(data) {
  var safe = {};
  for (var key in data) {
    safe[key] = String(data[key] === undefined ? "" : data[key])
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  return safe;
}

// Función auxiliar para formatear la respuesta de asistencia
function formatAsistencia(asistencia) {
  switch (asistencia) {
    case "si":
      return "✅ Sí asistiré";
    case "no":
      return "❌ No podré asistir";
    case "talvez":
      return "❓ Aún no estoy seguro/a";
    default:
      return asistencia;
  }
}

// Función auxiliar para formatear la dieta especial
function formatDieta(dieta) {
  switch (dieta) {
    case "ninguna":
      return "Ninguna";
    case "vegetariano":
      return "🥗 Vegetariano";
    case "vegano":
      return "🌱 Vegano";
    case "sinGluten":
      return "🌾 Sin gluten";
    case "otra":
      return "📝 Otra (ver mensaje)";
    default:
      return dieta;
  }
}

// Función GET para probar que el script está funcionando
function doGet(e) {
  return ContentService.createTextOutput(
    "Wedding RSVP API está funcionando correctamente! ✅",
  ).setMimeType(ContentService.MimeType.TEXT);
}

// ============================================
// FUNCIÓN DE PRUEBA - EJECUTA ESTA PRIMERO
// ============================================
function testScript() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

  Logger.log("Sheet Name: " + sheet.getName());
  Logger.log("Last Row: " + sheet.getLastRow());

  // Crear datos de prueba
  var testData = {
    fecha: new Date().toLocaleString("es-AR"),
    timestamp: new Date().toISOString(),
    nombre: "Prueba Test",
    email: "test@test.com",
    telefono: "1234567890",
    asistencia: "si",
    numeroAcompanantes: "2",
    nombresAcompanantes: "Ana Test, Pedro Test",
    alergias: "Ninguna",
    dietaEspecial: "ninguna",
    mensaje: "Esto es una prueba",
  };

  // Simular doPost
  var e = {
    postData: {
      contents: JSON.stringify(testData),
    },
  };

  var result = doPost(e);
  Logger.log("Resultado: " + result.getContent());

  // Verificar que se haya agregado
  Logger.log("Filas después de la prueba: " + sheet.getLastRow());

  return "Test completado. Verifica el Google Sheet y los logs (Ver > Registros)";
}

// ============================================
// FUNCIONES AUXILIARES OPCIONALES
// ============================================

// Función para obtener estadísticas de confirmaciones
function getStats() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();

  var stats = {
    total: data.length - 1, // Restar el encabezado
    confirmados: 0,
    rechazados: 0,
    indecisos: 0,
    totalPersonas: 0,
    vegetarianos: 0,
    veganos: 0,
    conAlergias: 0,
  };

  // Saltar la primera fila (encabezados)
  for (var i = 1; i < data.length; i++) {
    var row = data[i];

    // Contar asistencias
    if (row[5] === "si") {
      stats.confirmados++;
      stats.totalPersonas += 1 + parseInt(row[6] || 0);
    } else if (row[5] === "no") {
      stats.rechazados++;
    } else if (row[5] === "talvez") {
      stats.indecisos++;
    }

    // Contar dietas especiales
    if (row[9] === "vegetariano") stats.vegetarianos++;
    if (row[9] === "vegano") stats.veganos++;

    // Contar alergias
    if (row[8] && row[8] !== "Ninguna" && row[8] !== "") {
      stats.conAlergias++;
    }
  }

  Logger.log("Estadísticas:");
  Logger.log("Total respuestas: " + stats.total);
  Logger.log("Confirmados: " + stats.confirmados);
  Logger.log("Total personas: " + stats.totalPersonas);
  Logger.log("Vegetarianos: " + stats.vegetarianos);
  Logger.log("Veganos: " + stats.veganos);
  Logger.log("Con alergias: " + stats.conAlergias);

  return stats;
}

// Función para enviar recordatorio a quienes no han confirmado
function sendReminders() {
  Logger.log("Función de recordatorios - Por implementar");
}
