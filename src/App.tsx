import React, {
  useState,
  useEffect,
  useRef,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  MapPin,
  Heart,
  Instagram,
  Send,
  CheckCircle,
  AlertCircle,
  X,
  Gift,
  Camera,
  Wallet,
  Hotel,
  Music,
  VolumeX,
} from "lucide-react";
import wedding from "@couple";
import type { BankData } from "./config/types";
import EnvelopeSplash from "./components/EnvelopeSplash";

// ============================================
// TIPOS E INTERFACES
// ============================================

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface FormData {
  nombre: string;
  email: string;
  telefono: string;
  asistencia: "si" | "no" | "talvez";
  numeroAcompanantes: string;
  /** Nombres de los acompañantes, uno por posición */
  nombresAcompanantes: string[];
  alergias: string;
  dietaEspecial: "ninguna" | "vegetariano" | "vegano" | "sinGluten" | "otra";
  mensaje: string;
}

interface FormStatus {
  loading: boolean;
  success: boolean;
  error: boolean;
  message: string;
}

interface CountdownItem {
  value: number;
  label: string;
}

interface DataToSend extends Omit<FormData, "nombresAcompanantes"> {
  /** Nombres de los acompañantes separados por coma */
  nombresAcompanantes: string;
  fecha: string;
  timestamp: string;
}

interface FileUpload {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  message: string;
}

interface PhotoUploadStatus {
  uploading: boolean;
  filesSelected: FileUpload[];
  totalFiles: number;
  successCount: number;
  errorCount: number;
}

// ============================================
// HELPERS
// ============================================

const EMPTY_FORM: FormData = {
  nombre: "",
  email: "",
  telefono: "",
  asistencia: "si",
  numeroAcompanantes: "0",
  nombresAcompanantes: [],
  alergias: "",
  dietaEspecial: "ninguna",
  mensaje: "",
};

const capitalize = (text: string): string =>
  text.charAt(0).toUpperCase() + text.slice(1);

/** Textos de fecha derivados de wedding.date, en el idioma de wedding.locale */
const weddingDate: Date = new Date(wedding.date);
const formatPart = (options: Intl.DateTimeFormatOptions): string =>
  new Intl.DateTimeFormat(wedding.locale, options).format(weddingDate);
const dateTexts = {
  weekday: capitalize(formatPart({ weekday: "long" })),
  day: formatPart({ day: "numeric" }),
  month: capitalize(formatPart({ month: "long" })),
  year: formatPart({ year: "numeric" }),
};

/**
 * Devuelve true cuando el elemento con ese id entra en pantalla (20% visible).
 * Una vez visible, queda en true: las animaciones de entrada se ven una sola vez.
 * `deps` permite volver a buscar el elemento cuando cambia algo del render.
 */
function useInView(id: string, deps: unknown[] = []): boolean {
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    const element = document.getElementById(id);
    if (!element || visible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, visible, ...deps]);

  return visible;
}

/** Bloque con alias / CVU / banco / titular */
function BankDetails({ data }: { data: BankData }): React.JSX.Element {
  return (
    <>
      Alias: <span className="font-mono font-bold">{data.alias}</span>
      <br />
      CVU: <span className="font-mono font-bold">{data.cvu}</span>
      <br />
      Banco: <span className="font-mono font-bold">{data.bank}</span>
      <br />
      Titular: <span className="font-mono font-bold">{data.holder}</span>
    </>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function App(): React.JSX.Element {
  // ============================================
  // CONFIGURACIÓN (todo sale de couples/<pareja>/config.ts, ver vite.config.ts)
  // ============================================

  const { media, sections } = wedding;
  const hasVideo: boolean = Boolean(media.video);
  const carouselImages: string[] = media.gallery;
  const novios: string = wedding.couple;

  // ============================================
  // ESTADOS
  // ============================================

  // Estados de carga
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  // Estados de splash y video
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [fadeOut, setFadeOut] = useState<boolean>(false);
  const [videoEnded, setVideoEnded] = useState<boolean>(!hasVideo);

  // Música de fondo
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [musicPlaying, setMusicPlaying] = useState<boolean>(false);

  // Modal RSVP
  const [showRSVPModal, setShowRSVPModal] = useState<boolean>(false);

  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  const [formStatus, setFormStatus] = useState<FormStatus>({
    loading: false,
    success: false,
    error: false,
    message: "",
  });

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  // Carousel mobile
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Upload de fotos
  const [photoUpload, setPhotoUpload] = useState<PhotoUploadStatus>({
    uploading: false,
    filesSelected: [],
    totalFiles: 0,
    successCount: 0,
    errorCount: 0,
  });

  // Visibilidad de secciones (para animaciones de entrada)
  const dateTimeVisible = useInView("date-time", [videoEnded]);
  const locationVisible = useInView("location", [videoEnded]);
  const pricesVisible = useInView("prices-section", [videoEnded]);
  const dressCodeVisible = useInView("dress-code", [videoEnded]);
  const giftsVisible = useInView("gifts-section", [videoEnded]);
  const lodgingVisible = useInView("lodging-section", [videoEnded]);
  const photosVisible = useInView("photos-section", [videoEnded]);

  const HERO_BACKGROUND_IMAGE: string = isMobile
    ? media.heroMobile
    : media.heroDesktop;

  // ============================================
  // EFECTOS
  // ============================================

  // Título de la pestaña y colores de la pareja
  useEffect(() => {
    document.title = wedding.pageTitle;
    const root = document.documentElement.style;
    root.setProperty("--color-warm-taupe", wedding.theme.primary);
    root.setProperty("--color-dark-espresso", wedding.theme.dark);
    root.setProperty("--color-cream-beige", wedding.theme.light);
    root.setProperty("--color-silver-mist", wedding.theme.mist);
    root.setProperty("--color-gray-sage", wedding.theme.muted);
    root.setProperty("--color-accent", wedding.theme.accent);
  }, []);

  // Countdown timer
  useEffect(() => {
    const updateCountdown = (): void => {
      const now: number = new Date().getTime();
      const distance: number = weddingDate.getTime() - now;

      if (distance < 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days: number = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours: number = Math.floor(
        (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes: number = Math.floor(
        (distance % (1000 * 60 * 60)) / (1000 * 60),
      );
      const seconds: number = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detectar cambios de tamaño de ventana para responsive background
  useEffect(() => {
    const handleResize = (): void => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Autoplay para el carousel mobile (cambio automático cada 5 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
    }, 5000); // 5 segundos

    return () => clearInterval(interval);
  }, [carouselImages.length]);

  // Efecto para precargar recursos multimedia (imagen del splash + video si hay)
  useEffect(() => {
    let resourcesLoaded = 0;
    // Piezas del splash "carta": se precargan para que no aparezcan de a poco
    const extraImages: string[] =
      wedding.splashStyle === "carta"
        ? Object.values(media.envelope ?? {}).filter((src): src is string => Boolean(src))
        : [];
    const totalResources = (hasVideo ? 2 : 1) + extraImages.length;
    let cancelled = false;

    const updateProgress = () => {
      if (cancelled) return;
      resourcesLoaded++;
      setLoadingProgress((resourcesLoaded / totalResources) * 100);

      // Si todos los recursos están cargados, ocultar pantalla de carga
      if (resourcesLoaded === totalResources) {
        setTimeout(() => setIsLoading(false), 500); // Suaviza la transición
      }
    };

    // Precargar imagen del splash screen (si falla, se sigue igual)
    const splashImage = new Image();
    splashImage.onload = updateProgress;
    splashImage.onerror = () => {
      console.error("Error cargando imagen del splash");
      updateProgress();
    };
    splashImage.src = media.splash;

    const extraLoaders = extraImages.map((src) => {
      const img = new Image();
      img.onload = updateProgress;
      img.onerror = updateProgress;
      img.src = src;
      return img;
    });

    // Precargar video
    if (hasVideo) {
      const videoElement = document.createElement("video");
      videoElement.preload = "auto";
      videoElement.addEventListener("loadeddata", updateProgress, { once: true });
      videoElement.addEventListener(
        "error",
        () => {
          console.error("Error cargando video");
          updateProgress();
        },
        { once: true },
      );
      videoElement.src = media.video as string;
      videoElement.load();
    }

    return () => {
      cancelled = true;
      splashImage.onload = null;
      splashImage.onerror = null;
      extraLoaders.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [hasVideo, media.splash, media.video, media.envelope]);

  // ============================================
  // FUNCIONES
  // ============================================

  // Los navegadores solo dejan reproducir audio después de un toque del
  // usuario: por eso la música arranca desde el click del splash.
  const playMusic = (): void => {
    const audio = audioRef.current;
    if (!audio) return;
    audio
      .play()
      .then(() => setMusicPlaying(true))
      .catch(() => setMusicPlaying(false));
  };

  const toggleMusic = (): void => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      playMusic();
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  };

  const handleSplashClick = (): void => {
    setFadeOut(true);
    // Reproducir música inmediatamente al hacer clic en el splash
    playMusic();
    setTimeout(() => {
      setShowSplash(false);
      // Si no hay video, marcar como terminado inmediatamente para mostrar la invitación
      if (!hasVideo) {
        setVideoEnded(true);
      }
    }, 800); // Espera a que termine la animación
  };

  const handleVideoEnd = (): void => {
    setVideoEnded(true);
    // No llamar playMusic() aquí ya que la música ya está reproduciéndose
  };

  const openRSVPModal = (): void => {
    setShowRSVPModal(true);
    document.body.style.overflow = "hidden"; // Prevenir scroll del body
  };

  const closeRSVPModal = (): void => {
    setShowRSVPModal(false);
    document.body.style.overflow = "unset";
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompanionNameChange = (index: number, value: string): void => {
    setFormData((prev) => {
      const nombres = [...prev.nombresAcompanantes];
      nombres[index] = value;
      return { ...prev, nombresAcompanantes: nombres };
    });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!wedding.rsvp.scriptUrl) {
      setFormStatus({
        loading: false,
        success: false,
        error: true,
        message:
          "El formulario todavía no está configurado (falta rsvp.scriptUrl).",
      });
      return;
    }

    if (!formData.nombre || !formData.email) {
      setFormStatus({
        loading: false,
        success: false,
        error: true,
        message: "Por favor completa al menos tu nombre y email",
      });
      return;
    }

    setFormStatus({
      loading: true,
      success: false,
      error: false,
      message: "Enviando tu respuesta...",
    });

    try {
      const companions = Number(formData.numeroAcompanantes);
      const dataToSend: DataToSend = {
        ...formData,
        nombresAcompanantes: formData.nombresAcompanantes
          .slice(0, companions)
          .map((n) => (n || "").trim())
          .filter(Boolean)
          .join(", "),
        fecha: new Date().toLocaleString("es-AR", {
          timeZone: "America/Argentina/Buenos_Aires",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        timestamp: new Date().toISOString(),
      };

      console.log("Enviando datos:", dataToSend);

      // Se manda como texto plano (sin headers) para que sea un "simple
      // request": así Apps Script responde con CORS y podemos leer si el
      // guardado salió bien, en vez de asumirlo.
      const response = await fetch(wedding.rsvp.scriptUrl, {
        method: "POST",
        body: JSON.stringify(dataToSend),
      });
      const result = await response.json();
      if (result.result !== "success") {
        throw new Error(result.message || "Error al guardar la respuesta");
      }

      setFormStatus({
        loading: false,
        success: true,
        error: false,
        message: "¡Gracias! Tu confirmación ha sido registrada exitosamente 🎉",
      });

      setFormData(EMPTY_FORM);

      setTimeout(() => {
        setFormStatus({
          loading: false,
          success: false,
          error: false,
          message: "",
        });
        closeRSVPModal();
      }, 3000);
    } catch (error) {
      console.error("Error al enviar:", error);
      setFormStatus({
        loading: false,
        success: false,
        error: true,
        message:
          "Hubo un error al enviar tu respuesta. Por favor intenta de nuevo.",
      });
    }
  };

  // ============================================
  // FUNCIONES PARA UPLOAD DE FOTOS
  // ============================================

  // Validar archivo antes de subir
  const validateFile = (file: File): { valid: boolean; message: string } => {
    const maxMB = wedding.photoUpload.maxFileSizeMB;
    const MAX_SIZE = maxMB * 1024 * 1024;
    const ALLOWED_TYPES = ["image/", "video/"];

    // Validar tamaño
    if (file.size > MAX_SIZE) {
      return { valid: false, message: `Archivo muy grande (máx ${maxMB}MB)` };
    }

    // Validar tipo
    if (!ALLOWED_TYPES.some((type) => file.type.startsWith(type))) {
      return { valid: false, message: "Tipo de archivo no permitido" };
    }

    return { valid: true, message: "OK" };
  };

  // Convertir archivo a Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Quitar el prefijo "data:image/jpeg;base64," para enviar solo los datos
        const base64Data = base64.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  // Actualizar el estado de un archivo específico
  const updateFileStatus = (
    index: number,
    status: FileUpload["status"],
    message: string,
    progress: number,
  ): void => {
    setPhotoUpload((prev) => ({
      ...prev,
      filesSelected: prev.filesSelected.map((f, i) =>
        i === index ? { ...f, status, message, progress } : f,
      ),
    }));
  };

  // Manejar selección de archivos
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validatedFiles: FileUpload[] = [];

    // Validar cada archivo
    fileArray.forEach((file) => {
      const validation = validateFile(file);
      validatedFiles.push({
        file,
        progress: 0,
        status: validation.valid ? "pending" : "error",
        message: validation.valid ? "Listo para subir" : validation.message,
      });
    });

    setPhotoUpload({
      uploading: false,
      filesSelected: validatedFiles,
      totalFiles: validatedFiles.length,
      successCount: 0,
      errorCount: 0,
    });
  };

  // Subir fotos a Google Drive
  const uploadPhotos = async (): Promise<void> => {
    if (photoUpload.filesSelected.length === 0) return;
    if (!wedding.photoUpload.scriptUrl) {
      console.error("Falta configurar photoUpload.scriptUrl");
      return;
    }

    setPhotoUpload((prev) => ({ ...prev, uploading: true }));

    for (let i = 0; i < photoUpload.filesSelected.length; i++) {
      const fileUpload = photoUpload.filesSelected[i];

      // Saltar archivos que ya tienen error de validación
      if (fileUpload.status === "error") continue;

      try {
        // Actualizar estado: uploading
        updateFileStatus(i, "uploading", "Convirtiendo archivo...", 10);

        // Convertir a base64
        const base64Data = await fileToBase64(fileUpload.file);

        updateFileStatus(i, "uploading", "Subiendo a Drive...", 40);

        // Enviar a Google Apps Script
        const formData = new URLSearchParams();
        formData.append("file", base64Data);
        formData.append("filename", fileUpload.file.name);
        formData.append("mimeType", fileUpload.file.type);

        const response = await fetch(wedding.photoUpload.scriptUrl, {
          method: "POST",
          body: formData,
        });

        updateFileStatus(i, "uploading", "Procesando...", 80);

        const result = await response.json();

        if (result.success) {
          updateFileStatus(i, "success", "✅ Subido exitosamente", 100);
          setPhotoUpload((prev) => ({
            ...prev,
            successCount: prev.successCount + 1,
          }));
        } else {
          throw new Error(result.message || "Error desconocido");
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al subir";
        updateFileStatus(i, "error", `❌ ${errorMessage}`, 0);
        setPhotoUpload((prev) => ({
          ...prev,
          errorCount: prev.errorCount + 1,
        }));
      }
    }

    setPhotoUpload((prev) => ({ ...prev, uploading: false }));
  };

  // Limpiar selección de archivos
  const clearPhotoSelection = (): void => {
    setPhotoUpload({
      uploading: false,
      filesSelected: [],
      totalFiles: 0,
      successCount: 0,
      errorCount: 0,
    });

    // Limpiar el input file
    const fileInput = document.getElementById(
      "photo-upload",
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // Datos del countdown
  const countdownItems: CountdownItem[] = [
    { value: countdown.days, label: "Días" },
    { value: countdown.hours, label: "Horas" },
    { value: countdown.minutes, label: "Minutos" },
    { value: countdown.seconds, label: "Segundos" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-silver-mist to-cream-beige">
      {/* ============================================ */}
      {/* LOADING SCREEN - Pantalla de Carga */}
      {/* ============================================ */}
      {isLoading && (
        <div className="fixed inset-0 z-[150] bg-gradient-to-br from-warm-taupe to-dark-espresso flex flex-col items-center justify-center">
          <div className="text-center px-4 space-y-8">
            {/* Título de la invitación */}
            <h1 className="font-serif italic text-4xl md:text-6xl text-cream-beige mb-4 animate-pulse">
              {novios}
            </h1>

            {/* Mensaje de carga */}
            <p className="text-lg md:text-xl text-silver-mist mb-8">
              Cargando invitación...
            </p>

            {/* Barra de progreso */}
            <div className="w-64 md:w-80 mx-auto">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cream-beige transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-sm text-silver-mist mt-3">
                {Math.round(loadingProgress)}%
              </p>
            </div>

            {/* Icono de corazón animado */}
            <div className="mt-8">
              <Heart className="w-12 h-12 mx-auto text-cream-beige animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SPLASH SCREEN - Pantalla de Bienvenida */}
      {/* ============================================ */}
      {!isLoading && showSplash && wedding.splashStyle === "carta" && (
        <EnvelopeSplash
          photo={media.splash}
          couple={novios}
          initials={wedding.initials}
          subtitle={wedding.texts.splashSubtitle}
          dateText={`${dateTexts.day} de ${dateTexts.month}, ${dateTexts.year}`}
          sealColor={wedding.theme.primary}
          art={media.envelope}
          onOpen={playMusic}
          onFinish={() => {
            setShowSplash(false);
            if (!hasVideo) setVideoEnded(true);
          }}
        />
      )}
      {!isLoading && showSplash && wedding.splashStyle !== "carta" && (
        <div
          onClick={handleSplashClick}
          className={`fixed inset-0 z-[100] bg-dark-espresso bg-cover bg-center flex items-center justify-center cursor-pointer transition-opacity duration-800 ${
            fadeOut ? "opacity-0" : "opacity-100"
          }`}
          style={{
            backgroundImage: `radial-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('${media.splash}')`,
          }}
        >
          <div className="text-center px-4 animate-fade-in">
            {wedding.initials ? (
              <div className="mx-auto mb-8 w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-accent flex items-center justify-center">
                <span className="font-serif italic text-3xl md:text-4xl text-accent">
                  {wedding.initials}
                </span>
              </div>
            ) : (
              <div className="mb-8"></div>
            )}
            <h1 className="font-serif italic text-5xl md:text-7xl text-cream-beige mb-6">
              {novios}
            </h1>
            <p className="text-xl md:text-2xl text-white mb-8">
              {wedding.texts.splashSubtitle}
            </p>
            <p className="text-lg md:text-xl text-silver-mist mb-12">
              {dateTexts.day} de {dateTexts.month}, {dateTexts.year}
            </p>
            <p className="text-sm md:text-base text-silver-mist animate-bounce">
              Toca para continuar
            </p>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* SECCIÓN DE VIDEO */}
      {/* ============================================ */}
      {hasVideo && !showSplash && !videoEnded && (
        <div
          className="fixed inset-0 z-50 bg-cover bg-center"
          style={{ backgroundImage: `url('${HERO_BACKGROUND_IMAGE}')` }}
        >
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <video
              autoPlay
              playsInline
              onEnded={handleVideoEnd}
              className="max-w-full max-h-full object-contain"
            >
              <source src={media.video} type="video/mp4" />
              Tu navegador no soporta el video.
            </video>
          </div>
          {/* Botón para saltar el video */}
          <button
            onClick={handleVideoEnd}
            className="absolute bottom-8 right-8 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full hover:bg-white/30 transition"
          >
            Saltar video
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* CONTENIDO PRINCIPAL (visible después del video) */}
      {/* ============================================ */}
      <div
        className={`transition-opacity duration-1000 ${!videoEnded && !showSplash ? "opacity-0 pointer-events-none" : "opacity-100"}`}
      >
        {/* ============================================ */}
        {/* HERO SECTION - Imagen de fondo + Countdown + Botón RSVP */}
        {/* ============================================ */}
        <section
          className="min-h-screen flex items-center justify-center relative bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('${HERO_BACKGROUND_IMAGE}')`,
          }}
        >
          <div className="container mx-auto px-4 text-center text-white">
            <div className="text-3xl md:text-4xl mb-6 font-serif italic text-accent">
              Nos Casamos
            </div>

            <div className="font-serif italic text-5xl md:text-7xl my-8">
              {novios}
            </div>

            <p className="text-xl md:text-2xl mb-2">
              {dateTexts.weekday} {dateTexts.day} de {dateTexts.month}{" "}
              {dateTexts.year}
            </p>
            <p className="text-lg md:text-xl mb-12"></p>

            {/* Countdown */}
            <div className="flex justify-center gap-4 md:gap-8 flex-wrap mb-12">
              {countdownItems.map((item, index) => (
                <div
                  key={index}
                  className={`bg-white/20 backdrop-blur-md rounded-xl p-4 md:p-6 min-w-[80px] md:min-w-[100px] ${item.label === "Segundos" ? "hidden md:flex md:flex-col" : ""}`}
                >
                  <div className="text-3xl md:text-5xl font-bold">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-sm md:text-base mt-2">{item.label}</div>
                </div>
              ))}
            </div>

            {/* Botón RSVP Principal */}
            <button
              onClick={openRSVPModal}
              className="group relative inline-flex items-center justify-center gap-3 bg-warm-taupe hover:bg-dark-espresso text-white px-12 py-5 rounded-full text-xl font-semibold transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-gray/50"
            >
              Confirma acá tu asistencia
            </button>
          </div>
        </section>

        {/* ============================================ */}
        {/* SECCIONES ADICIONALES */}
        {/* ============================================ */}

        {/* Invitation Text */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center text-dark-espresso space-y-4">
              {wedding.texts.intro.map((line, index) => (
                <p key={index} className="text-lg md:text-2xl font-family-sans">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Date & Time Section */}
        <section
          className="py-16 md:py-24 relative bg-cover bg-center bg-fixed overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url('${media.dateTimeBackground}')`,
          }}
          id="date-time"
        >
          {/* Animación de parallax sutil en el fondo */}
          <div
            className="absolute inset-0 bg-cover bg-center animate-subtle-zoom"
            style={{
              backgroundImage: `url('${media.dateTimeBackground}')`,
              opacity: 0.5,
            }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <h2
              className={`font-serif italic text-4xl md:text-6xl text-center text-dark-espresso mb-12 ${dateTimeVisible ? "animate-fade-in-up" : "opacity-0"}`}
            >
              Fecha y Hora
            </h2>

            <div
              className={`max-w-2xl mx-auto bg-white/40 backdrop-blur-sm shadow-2xl p-8 md:p-12 rounded-2xl ${dateTimeVisible ? "animate-fade-in-up-delayed" : "opacity-0"}`}
            >
              <div className="text-center space-y-6">
                <div
                  className={`text-xl md:text-2xl text-dark-espresso ${dateTimeVisible ? "animate-fade-in-content" : "opacity-0"}`}
                >
                  {dateTexts.weekday}
                </div>
                <div
                  className={`text-6xl md:text-8xl font-bold text-warm-taupe ${dateTimeVisible ? "animate-scale-in-content" : "opacity-0"}`}
                >
                  {dateTexts.day}
                </div>
                <div
                  className={`text-xl md:text-2xl text-dark-espresso ${dateTimeVisible ? "animate-fade-in-content" : "opacity-0"}`}
                >
                  {dateTexts.month} {dateTexts.year}
                </div>

                <div className="my-8 flex justify-center">
                  <div
                    className={`border-t-2 border-accent ${dateTimeVisible ? "animate-expand-width" : "w-0"}`}
                  />
                </div>

                <div className="space-y-6">
                  {wedding.schedule.map((item, index) => (
                    <div
                      key={index}
                      className={
                        dateTimeVisible
                          ? index === 0
                            ? "animate-fade-in-content-slow"
                            : "animate-fade-in-content-slower"
                          : "opacity-0"
                      }
                    >
                      <p className="font-semibold text-dark-espresso mb-2">
                        {item.label}
                      </p>
                      <p className="text-3xl md:text-4xl text-warm-taupe">
                        {item.time}{" "}
                        {item.suffix && (
                          <span className="text-xl"> {item.suffix}</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Invitation Text */}
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center text-dark-espresso space-y-4">
              {wedding.texts.quote && (
                <div className="mb-10">
                  <p className="font-serif italic text-lg md:text-2xl">
                    "{wedding.texts.quote}"
                  </p>
                  {wedding.texts.quoteSource && (
                    <p className="mt-2 text-sm md:text-base tracking-widest uppercase text-accent">
                      {wedding.texts.quoteSource}
                    </p>
                  )}
                </div>
              )}
              {wedding.texts.storyTitle && (
                <h2 className="font-serif italic text-3xl md:text-5xl text-dark-espresso mb-6">
                  {wedding.texts.storyTitle}
                </h2>
              )}
              {wedding.texts.story.map((line, index) => (
                <p key={index} className="text-lg md:text-2xl font-family-sans">
                  {line}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section
          className="py-16 md:py-24 relative bg-cover bg-center bg-fixed overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url('${media.locationBackground}')`,
          }}
          id="location"
        >
          {/* Animación de parallax sutil en el fondo */}
          <div
            className="absolute inset-0 bg-cover bg-center animate-subtle-zoom"
            style={{
              backgroundImage: `url('${media.locationBackground}')`,
              opacity: 0.7,
            }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <h2
              className={`font-serif italic text-4xl md:text-6xl text-center text-dark-espresso mb-12 ${locationVisible ? "animate-fade-in-up" : "opacity-0"}`}
            >
              Ubicación
            </h2>

            <div
              className={`max-w-2xl mx-auto bg-white/40 backdrop-blur-sm shadow-2xl p-8 md:p-12 rounded-2xl ${locationVisible ? "animate-fade-in-up-delayed" : "opacity-0"}`}
            >
              <div className="text-center space-y-6">
                <div
                  className={`text-xl md:text-2xl text-dark-espresso ${locationVisible ? "animate-fade-in-content" : "opacity-0"}`}
                >
                  <h3 className="text-2xl md:text-3xl font-semibold text-warm-taupe text-center mb-4">
                    {wedding.location.name}
                  </h3>
                </div>
                <div
                  className={`text-6xl md:text-8xl font-bold text-warm-taupe ${locationVisible ? "animate-scale-in-content" : "opacity-0"}`}
                >
                  {" "}
                </div>
                <div
                  className={`text-xl md:text-2xl text-dark-espresso ${locationVisible ? "animate-fade-in-content" : "opacity-0"}`}
                >
                  {" "}
                </div>

                <div className="my-8 flex justify-center">
                  <div
                    className={`border-t-2 border-accent ${locationVisible ? "animate-expand-width" : "w-0"}`}
                  />
                </div>

                <div className="space-y-6">
                  <div
                    className={
                      locationVisible
                        ? "animate-fade-in-content-slow"
                        : "opacity-0"
                    }
                  >
                    <p className="text-center text-gray-sage mb-8">
                      {wedding.location.addressLines.map((line, index) => (
                        <span key={index} className="block">
                          {line}
                        </span>
                      ))}
                    </p>
                  </div>

                  <div
                    className={
                      locationVisible
                        ? "animate-fade-in-content-slower"
                        : "opacity-0"
                    }
                  >
                    {wedding.location.mapEmbedUrl && (
                      <iframe
                        src={wedding.location.mapEmbedUrl}
                        width="100%"
                        height="350"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        className="w-full"
                        title="Ubicación del evento"
                      />
                    )}
                  </div>
                </div>

                {wedding.location.mapsUrl && (
                  <a
                    href={wedding.location.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-warm-taupe hover:bg-dark-espresso text-white px-8 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 shadow-lg w-full"
                  >
                    <MapPin className="w-5 h-5" />
                    Abrir en Google Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Lodging Section - Opciones de hospedaje */}
        {sections.lodging && wedding.lodging.options.length > 0 && (
          <section className="py-16 md:py-24" id="lodging-section">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <Hotel
                  className={`w-12 h-12 mx-auto text-warm-taupe mb-4 ${lodgingVisible ? "animate-fade-in" : "opacity-0"}`}
                />
                <h2
                  className={`font-serif italic text-4xl md:text-6xl text-dark-espresso mb-8 ${lodgingVisible ? "animate-fade-in-up" : "opacity-0"}`}
                >
                  Hospedaje
                </h2>
                <div
                  className={`bg-white rounded-2xl shadow-xl p-8 md:p-12 ${lodgingVisible ? "animate-fade-in-up-delayed" : "opacity-0"}`}
                >
                  <p className="text-lg text-dark-espresso mb-8">
                    {wedding.lodging.intro}
                  </p>
                  <div className="space-y-4">
                    {wedding.lodging.options.map((option, index) => (
                      <a
                        key={index}
                        href={option.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-4 bg-cream-beige/30 hover:bg-cream-beige/60 rounded-xl p-5 text-left transition-all hover:scale-[1.02]"
                      >
                        <div>
                          <p className="font-semibold text-dark-espresso">
                            {option.name}
                          </p>
                          {option.description && (
                            <p className="text-sm text-gray-sage mt-1">
                              {option.description}
                            </p>
                          )}
                        </div>
                        <span className="flex items-center gap-1 text-sm font-medium text-warm-taupe whitespace-nowrap">
                          <MapPin className="w-4 h-4" />
                          Ver mapa
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Price Section  */}
        {sections.prices && (
        <section className="py-16 md:py-24" id="prices-section">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Wallet
                className={`w-12 h-12 mx-auto text-warm-taupe mb-4 ${pricesVisible ? "animate-fade-in" : "opacity-0"}`}
              />
              <h2
                className={`font-serif italic text-4xl md:text-6xl text-dark-espresso mb-8 ${pricesVisible ? "animate-fade-in-up" : "opacity-0"}`}
              >
                Valor de las Tarjetas
              </h2>

              <div
                className={`bg-white rounded-2xl shadow-xl p-8 md:p-12 ${pricesVisible ? "animate-fade-in-up-delayed" : "opacity-0"}`}
              >
                {/* Contenedor de las dos listas de precios */}
                <div
                  className={`grid grid-cols-1 gap-8 mb-6 ${wedding.prices.lists.length > 1 ? "md:grid-cols-2" : ""}`}
                >
                  {wedding.prices.lists.map((list, index) => (
                    <div key={index}>
                      <p className="text-lg font-medium text-dark-espresso mb-4">
                        {list.title}
                      </p>
                      <ul className="text-gray-sage text-lg">
                        {list.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="mb-4">
                            {item.label}: {item.price}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Texto aclaratorio */}
                <div className="text-center mb-8">
                  {wedding.prices.notes.map((note, index) => (
                    <p key={index} className="text-sm text-gray-sage italic">
                      {note}
                    </p>
                  ))}
                </div>

                <div className="space-y-6">
                  <div className="bg-cream-beige/20 rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-warm-taupe mb-3">
                      Datos para el pago
                    </h3>
                    <p className="text-gray-sage">
                      <BankDetails data={wedding.prices.payment} />
                      {wedding.prices.paymentNote && (
                        <>
                          <br />
                          <br />
                          {wedding.prices.paymentNote}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Photo Gallery Section - Carousel */}
        {sections.gallery && carouselImages.length > 0 && (
        <section className="py-8 md:py-16" id="photo-gallery">
          <div className="w-full">
            <div className="text-center mb-8 md:mb-12 px-4">
              <h2 className="font-serif italic text-3xl md:text-5xl text-dark-espresso mb-4">
                {wedding.texts.galleryTitle}
              </h2>
              <p className="text-gray-sage text-lg">
                {wedding.texts.gallerySubtitle}
              </p>
            </div>

            {/* Carousel Container - Mobile: 1 image, Desktop: infinite loop */}
            <div className="relative w-full">
              {/* Mobile: Single image carousel */}
              <div className="md:hidden h-[70vh] relative overflow-hidden shadow-2xl bg-gray-100">
                {carouselImages.map((image, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
                      index === currentSlide
                        ? "opacity-100 scale-100"
                        : "opacity-0 scale-95"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>

              {/* Desktop: Infinite scroll carousel - loop continuo */}
              <div className="hidden md:block h-[75vh] relative overflow-hidden">
                <div className="infinite-scroll-container">
                  {/* Primera serie de imágenes */}
                  {carouselImages.map((image, index) => (
                    <div
                      key={`first-${index}`}
                      className="infinite-scroll-item group bg-gradient-to-br from-gray-100 to-gray-200"
                    >
                      <img
                        src={image}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                      />
                      {/* Overlay sutil en hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                    </div>
                  ))}
                  {/* Segunda serie de imágenes (duplicado para loop infinito) */}
                  {carouselImages.map((image, index) => (
                    <div
                      key={`second-${index}`}
                      className="infinite-scroll-item group bg-gradient-to-br from-gray-100 to-gray-200"
                    >
                      <img
                        src={image}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                      />
                      {/* Overlay sutil en hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <br />
          <br />
        </section>
        )}

        {/* Dress Code Section */}
        {sections.dressCode && (
        <section
          className="py-16 md:py-24 relative bg-cover bg-center bg-fixed overflow-hidden"
          style={{
            backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.5)), url('${media.dressCodeBackground}')`,
          }}
          id="dress-code"
        >
          {/* Animación de parallax sutil en el fondo */}
          <div
            className="absolute inset-0 bg-cover bg-center animate-subtle-zoom"
            style={{
              backgroundImage: `url('${media.dressCodeBackground}')`,
              opacity: 0.5,
            }}
          />

          <div className="container mx-auto px-4 relative z-10">
            <h2
              className={`font-serif italic text-4xl md:text-6xl text-center text-dark-espresso mb-12 ${dressCodeVisible ? "animate-fade-in-up" : "opacity-0"}`}
            >
              Código de Vestimenta
            </h2>

            <div
              className={`max-w-2xl mx-auto bg-white/20 backdrop-blur-sm shadow-2xl p-8 md:p-12 rounded-2xl ${dressCodeVisible ? "animate-fade-in-up-delayed" : "opacity-0"}`}
            >
              <div className="text-center space-y-6">
                <div
                  className={`text-2xl md:text-3xl font-semibold text-warm-taupe ${dressCodeVisible ? "animate-fade-in-content" : "opacity-0"}`}
                >
                  {wedding.dressCode.title}
                </div>

                <div
                  className={`text-lg text-dark-espresso ${dressCodeVisible ? "animate-fade-in-content" : "opacity-0"}`}
                ></div>

                <div className="my-8 flex justify-center">
                  <div
                    className={`border-t-2 border-accent ${dressCodeVisible ? "animate-expand-width" : "w-0"}`}
                  />
                </div>

                <div
                  className={`grid gap-6 text-left ${wedding.dressCode.groups.length > 1 ? "md:grid-cols-2" : ""}`}
                >
                  {wedding.dressCode.groups.map((group, index) => (
                    <div
                      key={index}
                      className={`bg-cream-beige/20 rounded-xl p-6 ${
                        dressCodeVisible
                          ? index === 0
                            ? "animate-fade-in-content-slow"
                            : "animate-fade-in-content-slower"
                          : "opacity-0"
                      }`}
                    >
                      <h3 className="text-xl font-semibold text-dark-espresso mb-3">
                        {group.title}
                      </h3>
                      <ul className="space-y-2 text-gray-sage">
                        {group.items.map((item, itemIndex) => (
                          <li key={itemIndex}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        <section className="flex justify-center items-center py-8">
          <button
            onClick={openRSVPModal}
            className="group relative inline-flex items-center justify-center gap-3 bg-warm-taupe hover:bg-dark-espresso text-white px-12 py-5 rounded-full text-xl font-semibold transition-all duration-300 hover:scale-110 shadow-2xl hover:shadow-gray/50"
          >
            Confirma acá tu asistencia
          </button>
        </section>

        {/* Gifts Section */}
        {sections.gifts && (
        <section className="py-16 md:py-24" id="gifts-section">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Gift
                className={`w-12 h-12 mx-auto text-warm-taupe mb-4 ${giftsVisible ? "animate-fade-in" : "opacity-0"}`}
              />
              <h2
                className={`font-serif italic text-4xl md:text-6xl text-dark-espresso mb-8 ${giftsVisible ? "animate-fade-in-up" : "opacity-0"}`}
              >
                Regalos
              </h2>

              <div
                className={`bg-white rounded-2xl shadow-xl p-8 md:p-12 ${giftsVisible ? "animate-fade-in-up-delayed" : "opacity-0"}`}
              >
                <div className="space-y-6">
                  <p
                    className={`text-lg md:text-xl text-dark-espresso ${giftsVisible ? "animate-fade-in-content" : "opacity-0"}`}
                  >
                    {wedding.gifts.intro}
                  </p>

                  <div
                    className={`text-base md:text-lg text-gray-sage ${giftsVisible ? "animate-fade-in-content-slow" : "opacity-0"}`}
                  >
                    <p className="mb-4">{wedding.gifts.detail}</p>
                  </div>

                  <div className="my-8 flex justify-center">
                    <div
                      className={`border-t-2 border-accent ${giftsVisible ? "animate-expand-width" : "w-0"}`}
                    />
                  </div>

                  <div
                    className={`bg-cream-beige/20 rounded-xl p-6 ${giftsVisible ? "animate-fade-in-content-slower" : "opacity-0"}`}
                  >
                    <h3 className="text-xl font-semibold text-warm-taupe mb-3">
                      Datos para transferencias
                    </h3>
                    <p className="text-gray-sage">
                      <BankDetails data={wedding.gifts.transfer} />
                    </p>
                  </div>

                  {wedding.gifts.listUrl && (
                  <div
                    className={`mt-8 ${giftsVisible ? "animate-fade-in-button" : "opacity-0"}`}
                  >
                    <a
                      href={wedding.gifts.listUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-warm-taupe hover:bg-dark-espresso text-white px-8 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 shadow-lg w-full"
                    >
                      <Gift className="w-5 h-5" />
                      Ver Lista de Regalos
                    </a>
                  </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Photos Upload Section */}
        {sections.photoUpload && (
        <section className="py-16 md:py-24" id="photos-section">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Camera
                className={`w-12 h-12 mx-auto text-warm-taupe mb-4 ${photosVisible ? "animate-fade-in" : "opacity-0"}`}
              />
              <h2
                className={`font-serif italic text-4xl md:text-6xl text-dark-espresso mb-8 ${photosVisible ? "animate-fade-in-up" : "opacity-0"}`}
              >
                Compartí tus Fotos
              </h2>

              <div
                className={`bg-white rounded-2xl shadow-xl p-8 md:p-12 ${photosVisible ? "animate-fade-in-up-delayed" : "opacity-0"}`}
              >
                <div className="space-y-6">
                  <p
                    className={`text-lg md:text-xl text-dark-espresso ${photosVisible ? "animate-fade-in-content" : "opacity-0"}`}
                  >
                    Queremos que seas parte de nuestros recuerdos
                  </p>

                  <div
                    className={`text-base md:text-lg text-gray-sage ${photosVisible ? "animate-fade-in-content-slow" : "opacity-0"}`}
                  >
                    <p className="mb-4">
                      Subí tus fotos y videos del casamiento para que podamos
                      revivirlos juntos. Podés acceder a la carpeta compartida
                      de Google Drive o subir directamente desde acá.
                    </p>
                  </div>

                  <div className="my-8 flex justify-center">
                    <div
                      className={`border-t-2 border-accent ${photosVisible ? "animate-expand-width" : "w-0"}`}
                    />
                  </div>

                  <div
                    className={`space-y-4 ${photosVisible ? "animate-fade-in-content-slower" : "opacity-0"}`}
                  >
                    {/* Botón para ver carpeta de Drive */}
                    {wedding.photoUpload.driveFolderUrl && (
                      <a
                        href={wedding.photoUpload.driveFolderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-warm-taupe hover:bg-dark-espresso text-white px-8 py-4 rounded-full text-lg font-medium transition-all hover:scale-105 shadow-lg w-full"
                      >
                        <Camera className="w-5 h-5" />
                        Ver Carpeta de Drive
                      </a>
                    )}

                    {/* Input para seleccionar archivos */}
                    <div className="relative">
                      <input
                        type="file"
                        id="photo-upload"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={photoUpload.uploading}
                      />
                      <label
                        htmlFor="photo-upload"
                        className={`flex items-center justify-center gap-2 border-2 border-warm-taupe px-8 py-4 rounded-full text-lg font-medium transition-all shadow-lg w-full ${
                          photoUpload.uploading
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-cream-beige/30 hover:bg-cream-beige/50 text-dark-espresso cursor-pointer hover:scale-105"
                        }`}
                      >
                        <Camera className="w-5 h-5" />
                        {photoUpload.filesSelected.length > 0
                          ? `${photoUpload.filesSelected.length} archivo(s) seleccionado(s)`
                          : "Seleccionar Fotos/Videos"}
                      </label>
                    </div>

                    {/* Lista de archivos seleccionados */}
                    {photoUpload.filesSelected.length > 0 && (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {photoUpload.filesSelected.map((fileUpload, index) => (
                          <div
                            key={index}
                            className="bg-cream-beige/20 rounded-lg p-4 text-left"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium text-dark-espresso truncate flex-1">
                                {fileUpload.file.name}
                              </p>
                              <span className="text-xs text-gray-sage ml-2">
                                {(fileUpload.file.size / (1024 * 1024)).toFixed(
                                  2,
                                )}{" "}
                                MB
                              </span>
                            </div>

                            {/* Barra de progreso */}
                            {fileUpload.status === "uploading" && (
                              <div className="mb-2">
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-warm-taupe transition-all duration-300"
                                    style={{ width: `${fileUpload.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Mensaje de estado */}
                            <p
                              className={`text-xs ${
                                fileUpload.status === "success"
                                  ? "text-green-600"
                                  : fileUpload.status === "error"
                                    ? "text-red-600"
                                    : fileUpload.status === "uploading"
                                      ? "text-blue-600"
                                      : "text-gray-600"
                              }`}
                            >
                              {fileUpload.message}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Botones de acción */}
                    {photoUpload.filesSelected.length > 0 && (
                      <div className="flex gap-3">
                        <button
                          onClick={uploadPhotos}
                          disabled={
                            photoUpload.uploading ||
                            photoUpload.filesSelected.every(
                              (f) =>
                                f.status === "success" || f.status === "error",
                            )
                          }
                          className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full text-base font-medium transition-all shadow-lg ${
                            photoUpload.uploading ||
                            photoUpload.filesSelected.every(
                              (f) =>
                                f.status === "success" || f.status === "error",
                            )
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-warm-taupe hover:bg-dark-espresso text-white hover:scale-105"
                          }`}
                        >
                          {photoUpload.uploading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Subiendo...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Subir Archivos
                            </>
                          )}
                        </button>

                        <button
                          onClick={clearPhotoSelection}
                          disabled={photoUpload.uploading}
                          className={`px-6 py-3 rounded-full text-base font-medium transition-all shadow-lg ${
                            photoUpload.uploading
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : "bg-red-100 hover:bg-red-200 text-red-700 hover:scale-105"
                          }`}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* Resumen de resultados */}
                    {(photoUpload.successCount > 0 ||
                      photoUpload.errorCount > 0) &&
                      !photoUpload.uploading && (
                        <div className="bg-warm-taupe/10 rounded-lg p-4">
                          <p className="text-sm text-dark-espresso font-medium">
                            ✅ {photoUpload.successCount} archivo(s) subido(s)
                            exitosamente
                            {photoUpload.errorCount > 0 &&
                              ` · ❌ ${photoUpload.errorCount} error(es)`}
                          </p>
                        </div>
                      )}
                  </div>

                  <div
                    className={`mt-6 p-4 bg-warm-taupe/10 rounded-lg text-sm text-gray-sage ${photosVisible ? "animate-fade-in-button" : "opacity-0"}`}
                  >
                    <p>
                      Formatos aceptados: JPG, PNG, MP4, MOV
                      <br />
                      Tamaño máximo por archivo:{" "}
                      {wedding.photoUpload.maxFileSizeMB}MB
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {/* Footer */}
        <footer className="bg-dark-espresso text-silver-mist py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="flex items-center justify-center gap-2 mb-4">
              {dateTexts.year} © Creado con{" "}
              <Heart className="w-5 h-5 text-warm-taupe fill-current" /> para{" "}
              {novios}
            </p>
            <div className="flex justify-center gap-6">
              {wedding.footer.instagram.map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-warm-taupe hover:text-cream-beige transition-all hover:scale-110"
                >
                  <Instagram className="w-8 h-8" />
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* ============================================ */}
      {/* MÚSICA DE FONDO */}
      {/* ============================================ */}
      {media.music && (
        <>
          <audio ref={audioRef} src={media.music} loop preload="auto" />
          {!showSplash && (
            <button
              onClick={toggleMusic}
              aria-label={musicPlaying ? "Pausar música" : "Reproducir música"}
              className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-warm-taupe/90 hover:bg-dark-espresso text-white shadow-2xl flex items-center justify-center transition-all hover:scale-110 backdrop-blur-sm"
            >
              {musicPlaying ? (
                <Music className="w-6 h-6 animate-pulse" />
              ) : (
                <VolumeX className="w-6 h-6" />
              )}
            </button>
          )}
        </>
      )}

      {/* ============================================ */}
      {/* MODAL RSVP */}
      {/* ============================================ */}
      {showRSVPModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-warm-taupe to-dark-espresso text-white p-6 rounded-t-2xl flex justify-between items-center">
              <h2 className="font-serif italic text-3xl md:text-4xl">
                Confirmación de Asistencia
              </h2>
              <button
                onClick={closeRSVPModal}
                className="text-white hover:bg-white/20 rounded-full p-2 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-8">
              <div className="text-center text-dark-espresso space-y-4 mb-8">
                <p className="text-base md:text-lg leading-relaxed font-semibold text-warm-taupe">
                  Por favor completa el siguiente formulario:
                </p>
              </div>

              {/* Formulario de RSVP */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Nombre completo */}
                <div>
                  <label
                    htmlFor="nombre"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Nombre Completo *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    required
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-taupe focus:border-warm-taupe transition placeholder:text-gray-400"
                    placeholder="Tu nombre completo"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-taupe focus:border-warm-taupe transition placeholder:text-gray-400"
                    placeholder="tu@email.com"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label
                    htmlFor="telefono"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-taupe focus:border-warm-taupe transition placeholder:text-gray-400"
                    placeholder="+54 9 11 1234 5678"
                  />
                </div>

                {/* Asistencia */}
                <div>
                  <label
                    htmlFor="asistencia"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    ¿Podrás asistir? *
                  </label>
                  <select
                    id="asistencia"
                    name="asistencia"
                    required
                    value={formData.asistencia}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-taupe focus:border-warm-taupe transition text-gray-900"
                  >
                    <option value="si">Sí, confirmo asistencia ✓</option>
                    <option value="no">No, no podré asistir</option>
                  </select>
                </div>

                {/* Número de acompañantes */}
                <div>
                  <label
                    htmlFor="numeroAcompanantes"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Número de acompañantes
                  </label>
                  <select
                    id="numeroAcompanantes"
                    name="numeroAcompanantes"
                    value={formData.numeroAcompanantes}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-taupe focus:border-warm-taupe transition text-gray-900"
                  >
                    <option value="0">Solo yo</option>
                    {Array.from(
                      { length: wedding.rsvp.maxCompanions },
                      (_, i) => i + 1,
                    ).map((n) => (
                      <option key={n} value={String(n)}>
                        {n} acompañante{n > 1 ? "s" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Nombres de los acompañantes */}
                {wedding.rsvp.askCompanionNames &&
                  Number(formData.numeroAcompanantes) > 0 && (
                    <div className="space-y-3">
                      <p className="block text-sm font-medium text-gray-700">
                        Nombre de cada acompañante
                      </p>
                      {Array.from(
                        { length: Number(formData.numeroAcompanantes) },
                        (_, i) => i,
                      ).map((i) => (
                        <input
                          key={i}
                          type="text"
                          aria-label={`Acompañante ${i + 1}`}
                          value={formData.nombresAcompanantes[i] || ""}
                          onChange={(e) =>
                            handleCompanionNameChange(i, e.target.value)
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-taupe focus:border-warm-taupe transition placeholder:text-gray-400 text-gray-900"
                          placeholder={`Acompañante ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}

                {/* Alergias */}
                <div>
                  <label
                    htmlFor="alergias"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    ¿Tienes alguna alergia alimentaria?
                  </label>
                  <input
                    type="text"
                    id="alergias"
                    name="alergias"
                    value={formData.alergias}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-taupe focus:border-warm-taupe transition placeholder:text-gray-400"
                    placeholder="Ej: Nueces, mariscos, lácteos..."
                  />
                </div>

                {/* Dieta especial */}
                <div>
                  <label
                    htmlFor="dietaEspecial"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Preferencia alimentaria
                  </label>
                  <select
                    id="dietaEspecial"
                    name="dietaEspecial"
                    value={formData.dietaEspecial}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-taupe focus:border-warm-taupe transition text-gray-900"
                  >
                    <option value="ninguna">Ninguna (como todo)</option>
                    <option value="vegetariano">Vegetariano</option>
                    <option value="vegano">Vegano</option>
                    <option value="sinGluten">Sin gluten</option>
                    <option value="otra">Otra (especificá en el mensaje)</option>
                  </select>
                </div>

                {/* Mensaje */}
                <div>
                  <label
                    htmlFor="mensaje"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mensaje para los novios (opcional)
                  </label>
                  <textarea
                    id="mensaje"
                    name="mensaje"
                    rows={3}
                    value={formData.mensaje}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-warm-taupe focus:border-warm-taupe transition placeholder:text-gray-400 text-gray-900"
                    placeholder="Escribí lo que quieras..."
                  />
                </div>

                {/* Estado del formulario */}
                {formStatus.message && (
                  <div
                    className={`p-4 rounded-lg flex items-center gap-2 ${
                      formStatus.success
                        ? "bg-green-50 text-green-800 border border-green-200"
                        : formStatus.error
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {formStatus.success && <CheckCircle className="w-5 h-5" />}
                    {formStatus.error && <AlertCircle className="w-5 h-5" />}
                    <span>{formStatus.message}</span>
                  </div>
                )}

                {/* Botón de envío */}
                <button
                  type="submit"
                  disabled={formStatus.loading}
                  className={`w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full text-lg font-medium transition-all shadow-lg ${
                    formStatus.loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-warm-taupe hover:bg-dark-espresso hover:scale-105"
                  } text-white`}
                >
                  {formStatus.loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Confirmar Asistencia
                    </>
                  )}
                </button>
              </form>

              {wedding.rsvp.note && (
                <div className="mt-8 p-4 bg-cream-beige/50 border-l-4 border-warm-taupe rounded">
                  <p className="text-sm text-dark-espresso">
                    <strong>Nota:</strong> {wedding.rsvp.note}
                  </p>
                  {wedding.rsvp.whatsappContacts &&
                    wedding.rsvp.whatsappContacts.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        *En el comprobante incluir el nombre del invitado.
                        WhatsApp:{" "}
                        {wedding.rsvp.whatsappContacts
                          .map((c) => `${c.phone} (${c.name})`)
                          .join(" · ")}
                      </p>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* ESTILOS DE ANIMACIÓN */}
      {/* ============================================ */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in-subtle {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes expand-width {
          from {
            width: 0;
          }
          to {
            width: 300px;
          }
        }

        @keyframes subtle-zoom {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        @keyframes slide-in-left {
          from {
            transform: translateX(100%);
            opacity: 0.5;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fade-out-left {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-slide-in-left {
          animation: slide-in-left 1.2s ease-out;
        }

        .animate-fade-out-left {
          animation: fade-out-left 1.2s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
          opacity: 0;
        }

        .animate-fade-in-up-delayed {
          animation: fade-in-up 1s ease-out 0.3s forwards;
          opacity: 0;
        }

        .animate-fade-in-content {
          animation: fade-in-up 0.8s ease-out 0.5s forwards;
          opacity: 0;
        }

        .animate-scale-in-content {
          animation: scale-in-subtle 1s ease-out 0.6s forwards;
          opacity: 0;
        }

        .animate-fade-in-content-slow {
          animation: fade-in-up 0.8s ease-out 0.8s forwards;
          opacity: 0;
        }

        .animate-fade-in-content-slower {
          animation: fade-in-up 0.8s ease-out 1s forwards;
          opacity: 0;
        }

        .animate-fade-in-button {
          animation: scale-in-subtle 0.8s ease-out 1.2s forwards;
          opacity: 0;
        }

        .animate-expand-width {
          animation: expand-width 1s ease-out 0.7s forwards;
          width: 0;
        }

        @media (max-width: 768px) {
          @keyframes expand-width {
            from {
              width: 0;
            }
            to {
              width: 200px;
            }
          }
        }

        .animate-subtle-zoom {
          animation: subtle-zoom 20s ease-in-out infinite;
        }

        /* Infinite scroll carousel - Loop infinito continuo */
        @keyframes infinite-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-scroll-container {
          display: flex;
          width: max-content;
          animation: infinite-scroll 30s linear infinite;
        }

        .infinite-scroll-container:hover {
          animation-play-state: paused;
        }

        .infinite-scroll-item {
          position: relative;
          flex-shrink: 0;
          width: 33.333vw;
          height: 75vh;
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .infinite-scroll-item {
            width: 100vw;
          }
        }
      `}</style>
    </div>
  );
}
