/* =========================================================
   admin.js — Panel de administrador (Trips Barber Club)
   CRUD de servicios con persistencia en localStorage.
   ========================================================= */

/* ---------- Configuración ---------- */
const STORAGE_KEY = "tbc_servicios";

const MAX_IMG_BYTES = 3 * 1024 * 1024; // 3 MB antes de comprimir
const IMG_MAX_SIDE = 480; // lado máximo al comprimir (px)

/* Servicios de ejemplo (los mismos de index.html) */
const SERVICIOS_EJEMPLO = [
  { id: 1, nombre: "Corte clásico", tipo: "Corte", sede: "Sede Country Club", duracion: 45, precio: 35000, imagen: "../img/barber.png" },
  { id: 2, nombre: "Afeitado premium", tipo: "Barba", sede: "Sede Chapinero", duracion: 30, precio: 25000, imagen: "../img/tradicion.png" },
  { id: 3, nombre: "Corte + barba", tipo: "Combo", sede: "Sede Usaquén", duracion: 60, precio: 50000, imagen: "../img/calidad.png" },
  { id: 4, nombre: "Tratamiento facial", tipo: "Tratamiento", sede: "Sede Country Club", duracion: 40, precio: 40000, imagen: "../img/puntualidad.png" },
];

/* ---------- Referencias al DOM ---------- */
const $ = (id) => document.getElementById(id);

const form = $("servicio-form");
const formTitle = $("form-title");
const fId = $("srv-id");
const fNombre = $("srv-nombre");
const fTipo = $("srv-tipo");
const fSede = $("srv-sede");
const fDuracion = $("srv-duracion");
const fPrecio = $("srv-precio");
const fImagen = $("srv-imagen");
const imgPreview = $("image-preview");
const imgPlaceholder = $("image-placeholder");
const btnQuitarImagen = $("btn-quitar-imagen");
const btnGuardar = $("btn-guardar");
const btnCancelar = $("btn-cancelar");
const btnRestaurar = $("btn-restaurar");

const tabla = $("tabla-servicios");
const buscador = $("buscador");
const totalEl = $("total-servicios");
const toastEl = $("admin-toast");

const modalEl = $("modal-eliminar");
const modalNombre = $("modal-eliminar-nombre");
const btnConfirmarEliminar = $("btn-confirmar-eliminar");
const modalEliminar = new bootstrap.Modal(modalEl);

/* ---------- Estado ---------- */
let servicios = [];
let imagenActual = ""; // ruta o data URL de la imagen del formulario
let idAEliminar = null;
let toastTimer = null;

/* =========================================================
   UTILIDADES
   ========================================================= */
function escapeHTML(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

function formatoPrecio(valor) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(valor);
}

function siguienteId() {
  return servicios.length ? Math.max(...servicios.map((s) => s.id)) + 1 : 1;
}

function mostrarToast(mensaje, tipo = "ok") {
  toastEl.textContent = mensaje;
  toastEl.classList.toggle("error", tipo === "error");
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2600);
}

/* =========================================================
   PERSISTENCIA (localStorage)
   ========================================================= */
function cargarServicios() {
  try {
    const guardado = localStorage.getItem(STORAGE_KEY);
    if (guardado === null) {
      servicios = structuredClone(SERVICIOS_EJEMPLO);
      guardarServicios();
    } else {
      const datos = JSON.parse(guardado);
      servicios = Array.isArray(datos) ? datos : [];
    }
  } catch (err) {
    console.error("No se pudo leer localStorage:", err);
    servicios = structuredClone(SERVICIOS_EJEMPLO);
  }
}

function guardarServicios() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(servicios));
    return true;
  } catch (err) {
    console.error("No se pudo guardar:", err);
    mostrarToast("No se pudo guardar. Prueba con una imagen más liviana.", "error");
    return false;
  }
}

/* =========================================================
   TABLA (Leer)
   ========================================================= */
function renderTabla() {
  const filtro = buscador.value.trim().toLowerCase();

  const lista = servicios.filter((s) =>
    [s.nombre, s.tipo, s.sede].some((campo) => String(campo).toLowerCase().includes(filtro))
  );

  totalEl.textContent = servicios.length;

  if (lista.length === 0) {
    const mensaje = servicios.length === 0
      ? "Aún no hay servicios. Crea el primero con el formulario."
      : "Ningún servicio coincide con tu búsqueda.";
    tabla.innerHTML = `<tr><td colspan="7" class="empty-state">${mensaje}</td></tr>`;
    return;
  }

  tabla.innerHTML = lista.map((s) => {
    const editando = String(s.id) === fId.value;
    const miniatura = s.imagen
      ? `<img class="thumb" src="${escapeHTML(s.imagen)}" alt="Miniatura de ${escapeHTML(s.nombre)}">`
      : `<div class="thumb d-flex align-items-center justify-content-center"><i class="bi bi-image"></i></div>`;

    return `
      <tr class="${editando ? "row-editing" : ""}">
        <td>${s.id}</td>
        <td>${miniatura}</td>
        <td>
          <strong>${escapeHTML(s.nombre)}</strong><br>
          <small style="color:var(--grey)">${escapeHTML(s.tipo)}</small>
        </td>
        <td><span class="badge-sede">${escapeHTML(s.sede)}</span></td>
        <td>${s.duracion} min</td>
        <td>${formatoPrecio(s.precio)}</td>
        <td>
          <div class="cell-actions">
            <button type="button" class="btn-admin-edit" data-action="editar" data-id="${s.id}">
              <i class="bi bi-pencil-square"></i> Editar
            </button>
            <button type="button" class="btn-admin-delete" data-action="eliminar" data-id="${s.id}">
              <i class="bi bi-trash"></i> Eliminar
            </button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

/* Delegación de eventos: un solo listener para todos los botones de la tabla */
tabla.addEventListener("click", (e) => {
  const boton = e.target.closest("button[data-action]");
  if (!boton) return;

  const id = Number(boton.dataset.id);
  if (boton.dataset.action === "editar") iniciarEdicion(id);
  if (boton.dataset.action === "eliminar") pedirEliminar(id);
});

buscador.addEventListener("input", renderTabla);

/* =========================================================
   FORMULARIO (Crear / Actualizar)
   ========================================================= */
const reglas = {
  nombre: () => (fNombre.value.trim().length < 3 ? "Escribe un nombre de al menos 3 caracteres." : ""),
  tipo: () => (!fTipo.value ? "Selecciona un tipo." : ""),
  sede: () => (!fSede.value ? "Selecciona una sede." : ""),
  duracion: () => {
    const v = Number(fDuracion.value);
    return !Number.isFinite(v) || v < 5 || v > 480 ? "Ingresa una duración entre 5 y 480 minutos." : "";
  },
  precio: () => {
    const v = Number(fPrecio.value);
    return !Number.isFinite(v) || v < 1000 ? "Ingresa un precio válido (mínimo $1.000)." : "";
  },
};

const camposPorRegla = {
  nombre: fNombre, tipo: fTipo, sede: fSede, duracion: fDuracion, precio: fPrecio,
};

function validarCampo(nombre) {
  const mensaje = reglas[nombre]();
  form.querySelector(`.field-error[data-for="${nombre}"]`).textContent = mensaje;
  camposPorRegla[nombre].classList.toggle("is-invalid", Boolean(mensaje));
  return !mensaje;
}

Object.keys(reglas).forEach((nombre) => {
  const campo = camposPorRegla[nombre];
  campo.addEventListener("blur", () => validarCampo(nombre));
  campo.addEventListener("input", () => {
    if (campo.classList.contains("is-invalid")) validarCampo(nombre);
  });
});

function limpiarErrores() {
  form.querySelectorAll(".field-error").forEach((el) => (el.textContent = ""));
  form.querySelectorAll(".is-invalid").forEach((el) => el.classList.remove("is-invalid"));
}

function mostrarImagen(src) {
  imagenActual = src || "";
  if (imagenActual) {
    imgPreview.src = imagenActual;
    imgPreview.hidden = false;
    imgPlaceholder.hidden = true;
    btnQuitarImagen.hidden = false;
  } else {
    imgPreview.removeAttribute("src");
    imgPreview.hidden = true;
    imgPlaceholder.hidden = false;
    btnQuitarImagen.hidden = true;
  }
}

function resetFormulario() {
  form.reset();
  fId.value = "";
  fImagen.value = "";
  mostrarImagen("");
  limpiarErrores();
  formTitle.textContent = "Crear nuevo servicio";
  btnGuardar.innerHTML = '<i class="bi bi-save me-1"></i>Guardar servicio';
  btnCancelar.hidden = true;
  renderTabla();
}

function iniciarEdicion(id) {
  const servicio = servicios.find((s) => s.id === id);
  if (!servicio) return;

  limpiarErrores();
  fId.value = servicio.id;
  fNombre.value = servicio.nombre;
  fTipo.value = servicio.tipo;
  fSede.value = servicio.sede;
  fDuracion.value = servicio.duracion;
  fPrecio.value = servicio.precio;
  fImagen.value = "";
  mostrarImagen(servicio.imagen);

  formTitle.textContent = `Editar servicio #${servicio.id}`;
  btnGuardar.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i>Actualizar servicio';
  btnCancelar.hidden = false;

  renderTabla();
  form.scrollIntoView({ behavior: "smooth", block: "center" });
  fNombre.focus({ preventScroll: true });
}

btnCancelar.addEventListener("click", resetFormulario);

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const todoValido = Object.keys(reglas).map(validarCampo).every(Boolean);
  if (!todoValido) {
    mostrarToast("Revisa los campos marcados.", "error");
    return;
  }

  const datos = {
    nombre: fNombre.value.trim(),
    tipo: fTipo.value,
    sede: fSede.value,
    duracion: Number(fDuracion.value),
    precio: Number(fPrecio.value),
    imagen: imagenActual,
  };

  const editando = fId.value !== "";

  if (editando) {
    const indice = servicios.findIndex((s) => s.id === Number(fId.value));
    if (indice === -1) return;
    const anterior = servicios[indice];
    servicios[indice] = { ...anterior, ...datos };
    if (!guardarServicios()) {
      servicios[indice] = anterior; // revierte si falló el guardado
      return;
    }
    mostrarToast("Servicio actualizado.");
  } else {
    const nuevo = { id: siguienteId(), ...datos };
    servicios.push(nuevo);
    if (!guardarServicios()) {
      servicios.pop();
      return;
    }
    mostrarToast("Servicio creado.");
  }

  resetFormulario();
});

/* =========================================================
   IMAGEN (leer, validar y comprimir)
   ========================================================= */
function comprimirImagen(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onerror = () => reject(new Error("No se pudo leer el archivo."));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("El archivo no es una imagen válida."));
      img.onload = () => {
        const escala = Math.min(1, IMG_MAX_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * escala);
        canvas.height = Math.round(img.height * escala);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}

fImagen.addEventListener("change", async () => {
  const archivo = fImagen.files[0];
  const errorEl = form.querySelector('.field-error[data-for="imagen"]');
  errorEl.textContent = "";
  if (!archivo) return;

  if (!/^image\/(png|jpeg|webp)$/.test(archivo.type)) {
    errorEl.textContent = "Formato no permitido. Usa PNG, JPG o WEBP.";
    fImagen.value = "";
    return;
  }
  if (archivo.size > MAX_IMG_BYTES) {
    errorEl.textContent = "La imagen pesa más de 3 MB.";
    fImagen.value = "";
    return;
  }

  try {
    mostrarImagen(await comprimirImagen(archivo));
  } catch (err) {
    errorEl.textContent = err.message;
    fImagen.value = "";
  }
});

btnQuitarImagen.addEventListener("click", () => {
  fImagen.value = "";
  mostrarImagen("");
});


function pedirEliminar(id) {
  const servicio = servicios.find((s) => s.id === id);
  if (!servicio) return;
  idAEliminar = id;
  modalNombre.textContent = servicio.nombre;
  modalEliminar.show();
}

btnConfirmarEliminar.addEventListener("click", () => {
  if (idAEliminar === null) return;

  const copia = [...servicios];
  servicios = servicios.filter((s) => s.id !== idAEliminar);

  if (!guardarServicios()) {
    servicios = copia;
  } else {
    if (fId.value === String(idAEliminar)) resetFormulario();
    mostrarToast("Servicio eliminado.");
  }

  idAEliminar = null;
  modalEliminar.hide();
  renderTabla();
});


btnRestaurar.addEventListener("click", () => {
  if (!confirm("Esto reemplazará todos los servicios por los de ejemplo. ¿Continuar?")) return;
  servicios = structuredClone(SERVICIOS_EJEMPLO);
  guardarServicios();
  resetFormulario();
  mostrarToast("Servicios de ejemplo restaurados.");
});


cargarServicios();
renderTabla();