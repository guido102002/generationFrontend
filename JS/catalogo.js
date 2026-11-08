const STORAGE_KEY = "tbc_servicios"; // misma clave que usa admin.js

const grid = document.getElementById("catalogo-grid");
const totalEl = document.getElementById("catalogo-total");

function escapeHTML(texto) {
    return String(texto).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
}

function formatoPrecio(valor) {
    return "$" + new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(valor);
}

/* Devuelve el arreglo guardado, o null si no existe / está dañado */
function leerServicios() {
    try {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (guardado === null) return null;
        const datos = JSON.parse(guardado);
        return Array.isArray(datos) ? datos : null;
    } catch (err) {
        console.error("No se pudo leer localStorage:", err);
        return null;
    }
}

function crearCard(s) {
    // Las rutas guardadas por admin.js ("../img/...") ya son correctas desde /Pages
    const media = s.imagen
        ? `<img src="${escapeHTML(s.imagen)}" alt="${escapeHTML(s.nombre)}">`
        : `<div class="d-flex align-items-center justify-content-center h-100" style="background:var(--bg-black);color:var(--gold-dark);font-size:2.5rem;"><i class="bi bi-image"></i></div>`;

    return `
        <div class="col-sm-6 col-lg-3">
            <article class="service-card">
                <div class="service-media">
                    ${media}
                    <span class="service-price">Desde ${formatoPrecio(s.precio)}</span>
                </div>
                <div class="service-body">
                    <h3 class="service-name">${escapeHTML(s.nombre)}</h3>
                    <p class="service-meta"><i class="bi bi-clock"></i> ${escapeHTML(s.duracion)} min &middot; ${escapeHTML(s.sede)}</p>
                    <a href="../index.html#widget" class="btn btn-gold btn-sm">Reservar</a>
                </div>
            </article>
        </div>`;
}

function renderCatalogo() {
    if (!grid) return;

    const servicios = leerServicios();
    if (servicios === null) return; // sin datos guardados: quedan las 10 cards base del HTML

    totalEl.textContent = servicios.length;

    if (servicios.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center"><p>Por ahora no hay servicios disponibles.</p></div>`;
        return;
    }

    grid.innerHTML = servicios.map(crearCard).join("");
}

/* Si el admin está abierto en otra pestaña, el catálogo se actualiza solo */
window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) renderCatalogo();
});

document.addEventListener("DOMContentLoaded", renderCatalogo);