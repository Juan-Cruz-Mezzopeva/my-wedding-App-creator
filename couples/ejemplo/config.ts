import type { WeddingConfig } from "../../src/config/types";

// ============================================
// CONFIGURACIÓN DE LA INVITACIÓN
// ============================================
// Pareja de EJEMPLO: copiá esta carpeta completa para crear una nueva.
// Las imágenes, el video y la música van en la carpeta public/ de al lado.

const wedding: WeddingConfig = {
  couple: "Ana & Pablo",
  initials: "A & P",
  pageTitle: "Ana & Pablo - Nuestra Boda",
  date: "2027-11-20T17:00:00-03:00",
  locale: "es-AR",

  theme: {
    primary: "#3F2512",
    dark: "#382f25",
    light: "#e5e1d5",
    mist: "#dddee3",
    muted: "#3F2512",
    accent: "#C9A54C",
  },

  media: {
    splash: "/splash.webp",
    heroDesktop: "/hero-desktop.webp",
    heroMobile: "/hero-mobile.webp",
    video: "/video-intro.mp4",
    music: "",
    dateTimeBackground: "/fondo-fecha.webp",
    locationBackground: "/fondo-ubicacion.webp",
    dressCodeBackground: "/fondo-dress-code.webp",
    gallery: [
      "/galeria-1.webp",
      "/galeria-2.webp",
      "/galeria-3.webp",
      "/galeria-4.webp",
      "/galeria-5.webp",
    ],
  },

  texts: {
    splashSubtitle: "Nos casamos",
    intro: [
      "Porque sos parte de nuestras vidas",
      "queremos compartir con vos la alegría de casarnos",
    ],
    quote: "",
    story: [
      "Hoy, con el corazón lleno de ilusión, elegimos compartir la vida juntos.",
      "¡Te esperamos para celebrar este nuevo comienzo!",
    ],
    galleryTitle: "Acompañanos en esta aventura juntos",
    gallerySubtitle: "sé testigo del inicio de nuestro viaje",
  },

  schedule: [
    { label: "Ceremonia:", time: "17:00", suffix: "hs" },
    { label: "Fiesta:", time: "21:00", suffix: "hs" },
  ],

  location: {
    name: "Nombre del Salón",
    addressLines: ["Calle Ejemplo 1234", "Ciudad, Argentina"],
    mapEmbedUrl: "",
    mapsUrl: "",
  },

  sections: {
    lodging: false,
    prices: true,
    gallery: true,
    dressCode: true,
    gifts: true,
    photoUpload: true,
  },

  lodging: {
    intro: "Si venís de afuera, te dejamos algunas opciones cerca del salón.",
    options: [],
  },

  prices: {
    lists: [
      {
        title: "Adultos",
        items: [
          { label: "Septiembre", price: "$-------" },
          { label: "Octubre", price: "$-------" },
          { label: "Noviembre", price: "$-------" },
        ],
      },
      {
        title: "Menores de 3 a 10 años",
        items: [
          { label: "Septiembre", price: "$-------" },
          { label: "Octubre", price: "$-------" },
          { label: "Noviembre", price: "$-------" },
        ],
      },
    ],
    notes: [
      "El valor de la tarjeta varía según el mes en el que se realice el pago",
      "* Menores de 3 años no pagan tarjeta",
    ],
    payment: {
      alias: "alias.de.los.novios",
      cvu: "-------",
      bank: "Nombre del Banco",
      holder: "Nombre del Titular",
    },
    paymentNote: "Por favor, verificar los datos antes de realizar la transferencia",
  },

  dressCode: {
    title: "Elegante",
    groups: [
      {
        title: "Para Ellas",
        items: ["Evitar: blanco, crema, marfil"],
      },
      {
        title: "Para Ellos",
        items: ["Traje", "Sugerencia: corbata o moño"],
      },
    ],
  },

  gifts: {
    intro:
      "Aunque parezca una frase hecha, de corazón creemos que tu presencia es nuestro mejor regalo",
    detail:
      "Si aun así querés hacernos un presente, podés elegir algo de la lista o transferir el monto que desees para nuestra luna de miel, a la siguiente cuenta.",
    transfer: {
      alias: "alias.de.los.novios",
      cvu: "-------",
      bank: "Nombre del Banco",
      holder: "Nombre del Titular",
    },
    listUrl: "",
  },

  rsvp: {
    scriptUrl: "",
    maxCompanions: 4,
    askCompanionNames: false,
    note: "Les pedimos mandar el comprobante de pago de las tarjetas a nuestro WhatsApp para confirmar su asistencia.",
    whatsappContacts: [
      { name: "Ana", phone: "0000000000" },
      { name: "Pablo", phone: "0000000000" },
    ],
  },

  photoUpload: {
    scriptUrl: "",
    driveFolderUrl: "",
    maxFileSizeMB: 25,
  },

  footer: {
    instagram: [],
  },
};

export default wedding;
