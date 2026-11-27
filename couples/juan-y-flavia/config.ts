import type { WeddingConfig } from "../../src/config/types";

// ============================================
// INVITACIÓN: JUAN & FLAVIA — 9 de octubre de 2027
// ============================================
// Los "PENDIENTE" son datos que todavía faltan confirmar con los novios.

const wedding: WeddingConfig = {
  couple: "Juan & Flavia",
  initials: "J & F",
  pageTitle: "Juan & Flavia - Nuestra Boda",
  // PENDIENTE: confirmar hora de inicio (por ahora 19:00, según el audio)
  date: "2027-10-09T19:00:00-03:00",
  locale: "es-AR",
  // Pantalla de inicio con forma de carta y sello (pedido de los novios)
  splashStyle: "carta",

  // Colores elegidos por los novios: blanco, marfil, azul, dorado y bordó,
  // con un estilo "de noche".
  theme: {
    primary: "#1F2E4D", // azul noche: botones, números
    dark: "#141B2D", // azul casi negro: textos, footer, pantalla de carga
    light: "#EFE6D5", // marfil
    mist: "#F8F5EE", // blanco cálido
    muted: "#6B1E2E", // bordó: textos secundarios
    accent: "#C6A15B", // dorado: líneas, monograma, "Nos casamos"
  },

  // PENDIENTE: fotos de la sesión (las manda el fotógrafo). Hay que copiarlas
  // a couples/juan-y-flavia/public/ con estos nombres.
  media: {
    splash: "/splash.webp",
    heroDesktop: "/hero-desktop.webp",
    heroMobile: "/hero-mobile.webp",
    video: "",
    // Música de fondo
    music: "/musica-fondo.mp3",
    dateTimeBackground: "/fondo-fecha.webp",
    locationBackground: "/fondo-ubicacion.webp",
    dressCodeBackground: "/fondo-dress-code.webp",
    gallery: [
      "/galeria-1.webp",
      "/galeria-2.webp",
      "/galeria-3.webp",
      "/galeria-4.webp",
    ],
    // Piezas de la pantalla de inicio con forma de carta
    envelope: {
      sealLeft: "/carta/sello-izquierda.webp",
      sealRight: "/carta/sello-derecha.webp",
      vineLeft: "/carta/enredadera-izquierda.webp",
      vineRight: "/carta/enredadera-derecha.webp",
      dividerTop: "/carta/separador-1.webp",
      dividerBottom: "/carta/separador-2.webp",
      dividerSmall: "/carta/separador-3.webp",
    },
  },

  texts: {
    splashSubtitle: "¡Nos casamos!",
    intro: [
      "Queremos compartir esta bendición",
      "con las personas que amamos.",
    ],
    quote:
      "Uno solo puede ser vencido, pero dos pueden resistir. ¡La cuerda de tres hilos no se rompe fácilmente!",
    quoteSource: "Eclesiastés 4:12",
    storyTitle: "La oración que Dios respondió",
    story: [
      "Hay encuentros que llegan como respuesta a una oración y personas que se convierten en hogar.",
      "Hoy elegimos unir nuestros caminos, nuestros sueños y nuestras vidas, con Dios como guía y fundamento de nuestro amor.",
    ],
    galleryTitle: "Acompañanos en esta aventura juntos",
    gallerySubtitle: "sé testigo del inicio de nuestro viaje",
  },

  // PENDIENTE: los novios todavía no tienen el itinerario definido
  schedule: [
    { label: "Ceremonia civil y religiosa:", time: "19:00", suffix: "hs" },
    { label: "Fiesta:", time: "hasta las 03:00", suffix: "hs" },
  ],

  location: {
    name: "Villa Adelina Eventos",
    // PENDIENTE: dirección exacta del salón
    addressLines: ["Córdoba, Argentina"],
    mapEmbedUrl:
      "https://maps.google.com/maps?q=-31.3262402,-64.174548&z=16&output=embed",
    mapsUrl:
      "https://www.google.com/maps/place/Villa+Adelina+Eventos/@-31.3262402,-64.174548,17z",
  },

  sections: {
    lodging: true,
    prices: true,
    gallery: true, // se muestra sola cuando haya fotos en media.gallery
    dressCode: false, // PENDIENTE: no lo definieron todavía
    gifts: true,
    photoUpload: false, // se activa más cerca de la fecha
  },

  // PENDIENTE: nombres de cada alojamiento (solo tenemos los links)
  lodging: {
    intro:
      "Como muchos de ustedes vienen de afuera, les dejamos algunas opciones de alojamiento cerca del salón.",
    options: [
      {
        name: "Opción de alojamiento 1",
        url: "https://maps.app.goo.gl/NoBkmHEgHG1TSepH8",
      },
      {
        name: "Opción de alojamiento 2",
        url: "https://maps.app.goo.gl/PxFBroW4WN2RjTYW9",
      },
      {
        name: "Opción de alojamiento 3",
        url: "https://maps.app.goo.gl/DVbyVBguU3eShv9T8",
      },
    ],
  },

  prices: {
    lists: [
      {
        title: "Adultos",
        items: [{ label: "Tarjeta", price: "$130.500" }],
      },
      {
        title: "Niños de 2 a 12 años",
        // PENDIENTE: en la info vino "$ 58", falta el monto completo
        items: [{ label: "Tarjeta", price: "$58.000" }],
      },
    ],
    notes: [
      "Los precios aquí establecidos tendrán un incremento según el índice del IPC mensual",
    ],
    // PENDIENTE: CVU, banco y titular
    payment: {
      alias: "JyF-NuestraBoda",
      cvu: "4530000800015824136378",
      bank: "Naranja x",
      holder: "Flavia del Valle Avila",
    },
    paymentNote:
      "Por favor, verificar los datos antes de realizar la transferencia",
  },

  dressCode: {
    title: "",
    groups: [],
  },

  gifts: {
    intro:
      "Aunque parezca una frase hecha, de corazón creemos que tu presencia es nuestro mejor regalo",
    detail:
      "Si aun así querés hacernos un presente, podés transferir el monto que desees a la siguiente cuenta.",
    // PENDIENTE: confirmar si los regalos van a la misma cuenta que las tarjetas
    transfer: {
      alias: "JyF-NuestraBoda",
      cvu: "4530000800015824136378",
      bank: "Naranja x",
      holder: "Flavia del Valle Avila",
    },
    listUrl: "",
  },

  rsvp: {
    // PENDIENTE: URL /exec del Apps Script de RSVP de esta pareja
    scriptUrl:
      "https://script.google.com/macros/s/AKfycbySsABBhqnMePtpbJueKYc5o94CchwOmPMDtpKlpTEBhIhJeWhXEE_wbwqQnb7jTdwD/exec",
    // Una sola invitación por familia: puede confirmar por todos con sus nombres
    maxCompanions: 8,
    askCompanionNames: true,
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
