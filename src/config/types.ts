// ============================================
// TIPOS DE LA CONFIGURACIÓN DE UNA INVITACIÓN
// ============================================
// Todo lo que cambia de una pareja a otra vive en un objeto WeddingConfig.
// El código de la app (App.tsx) solo lee de acá: para crear una invitación
// nueva no hace falta tocar componentes, solo completar un config.

export interface PriceList {
  /** Ej: "Adultos", "Menores de 3 a 10 años" */
  title: string;
  /** Ej: [{ label: "Febrero", price: "$50.000" }] */
  items: { label: string; price: string }[];
}

export interface BankData {
  alias: string;
  cvu: string;
  bank: string;
  holder: string;
}

export interface ScheduleItem {
  /** Ej: "Recepción:" */
  label: string;
  /** Ej: "11:30" o "12:00 - 17:00" */
  time: string;
  /** Ej: "am", "hs" */
  suffix?: string;
}

export interface WeddingConfig {
  /** Texto que se muestra como nombre de la pareja. Ej: "Flor & Juan" */
  couple: string;
  /** Título de la pestaña del navegador */
  pageTitle: string;
  /**
   * Fecha y hora del evento en formato ISO con zona horaria.
   * Ej: "2027-11-20T17:00:00-03:00"
   * De acá salen la cuenta regresiva y todas las fechas que se muestran.
   */
  date: string;
  /** Idioma/región para formatear fechas. Ej: "es-AR" */
  locale: string;

  /** Colores de la invitación (se aplican sobre la paleta de Tailwind) */
  theme: {
    /** Color principal: botones, títulos destacados */
    primary: string;
    /** Color oscuro: textos y footer */
    dark: string;
    /** Color claro cálido: fondos suaves */
    light: string;
    /** Color claro frío: fondos y textos secundarios sobre oscuro */
    mist: string;
    /** Color de textos secundarios */
    muted: string;
  };

  /** Imágenes y video (rutas dentro de /public o URLs completas) */
  media: {
    splash: string;
    heroDesktop: string;
    heroMobile: string;
    /** Video de intro. Si se deja vacío, se saltea la sección de video. */
    video?: string;
    dateTimeBackground: string;
    locationBackground: string;
    dressCodeBackground: string;
    gallery: string[];
  };

  texts: {
    /** Frase corta debajo de los nombres en el splash. Ej: "Nos casamos" */
    splashSubtitle: string;
    /** Líneas del primer bloque de texto, después del hero */
    intro: string[];
    /** Frase destacada (en cursiva) del segundo bloque. Opcional. */
    quote?: string;
    /** Líneas del segundo bloque de texto */
    story: string[];
    galleryTitle: string;
    gallerySubtitle: string;
  };

  schedule: ScheduleItem[];

  location: {
    name: string;
    addressLines: string[];
    /** URL "src" del iframe que da Google Maps en Compartir → Insertar un mapa */
    mapEmbedUrl: string;
    /** Link para abrir en Google Maps */
    mapsUrl: string;
  };

  /** Secciones que se pueden prender o apagar */
  sections: {
    prices: boolean;
    gallery: boolean;
    dressCode: boolean;
    gifts: boolean;
    photoUpload: boolean;
  };

  prices: {
    lists: PriceList[];
    notes: string[];
    payment: BankData;
    paymentNote?: string;
  };

  dressCode: {
    title: string;
    groups: { title: string; items: string[] }[];
  };

  gifts: {
    intro: string;
    detail: string;
    transfer: BankData;
    /** Link a la lista de regalos. Si se deja vacío, no se muestra el botón. */
    listUrl?: string;
  };

  rsvp: {
    /** URL /exec del Google Apps Script que guarda las confirmaciones */
    scriptUrl: string;
    /** Máximo de acompañantes que se ofrece en el formulario */
    maxCompanions: number;
    /** Nota al pie del formulario. Opcional. */
    note?: string;
    /** Contactos de WhatsApp que se muestran debajo de la nota. Opcional. */
    whatsappContacts?: { name: string; phone: string }[];
  };

  photoUpload: {
    /** URL /exec del Google Apps Script que sube archivos a Drive */
    scriptUrl: string;
    /** Link a la carpeta compartida de Google Drive */
    driveFolderUrl: string;
    /**
     * Tamaño máximo por archivo en MB. Apps Script no acepta requests muy
     * grandes y el archivo viaja en base64 (+33%), por eso conviene no pasar
     * de ~25 MB.
     */
    maxFileSizeMB: number;
  };

  footer: {
    instagram: string[];
  };
}
