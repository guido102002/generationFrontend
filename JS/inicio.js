const STORAGE_KEY = "tbc_servicios"; 

function escapeHTML(texto) {
    return String(texto).replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
}

function formatoPrecio(valor) {
    return "$" + new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(valor);
}

function resolverImagen(src) {
    if (!src) return "";
    return src.startsWith("../img/") ? src.replace("../img/", "./img/") : src;
}

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

function crearCardServicio(s) {
    const imagen = resolverImagen(s.imagen);
    const media = imagen
        ? `<img src="${escapeHTML(imagen)}" alt="${escapeHTML(s.nombre)}">`
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
                    <a href="#widget" class="btn btn-gold btn-sm" data-servicio="${escapeHTML(s.nombre)}" data-sede="${escapeHTML(s.sede)}">Reservar</a>
                </div>
            </article>
        </div>`;
}

function renderServicios() {
    const grid = document.getElementById("servicios-populares-grid");
    if (!grid) return;

    const servicios = leerServicios();
    if (servicios === null) return; // sin datos guardados: se conservan las cards base del HTML

    if (servicios.length === 0) {
        grid.innerHTML = `<div class="col-12 text-center"><p>Por ahora no hay servicios disponibles.</p></div>`;
        return;
    }

    grid.innerHTML = servicios.map(crearCardServicio).join("");
}

function sincronizarSelectServicios() {
    const select = document.getElementById("hero-servicio");
    const servicios = leerServicios();
    if (!select || !servicios || servicios.length === 0) return;

    const actual = select.value;
    const nombres = [...new Set(servicios.map((s) => s.nombre))];
    select.innerHTML = nombres.map((n) => `<option>${escapeHTML(n)}</option>`).join("");
    if (nombres.includes(actual)) select.value = actual;
}

function actualizarServicios() {
    renderServicios();
    sincronizarSelectServicios();
}

/* Si el admin está abierto en otra pestaña, inicio se actualiza solo */
window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) actualizarServicios();
});

/* ---------- Widget del hero + botones "Reservar" ---------- */
document.addEventListener("DOMContentLoaded", () => {
    // Al cargar la página: recupera lo guardado en localStorage y lo pinta
    actualizarServicios();

    const searchWidget = document.querySelector(".inicio-search-widget");
    const servicioSelect = document.getElementById("hero-servicio");
    const sedeSelect = document.getElementById("hero-sede");

    if (!searchWidget || !servicioSelect) return;

    function setSelectValue(select, value) {
        if (!select || !value) return;

        const option = Array.from(select.options).find(
            (opt) => opt.value === value || opt.textContent.trim() === value
        );

        if (option) {
            select.value = option.value;
            select.dispatchEvent(new Event("change", { bubbles: true }));
        }
    }

    function highlightWidget() {
        searchWidget.classList.remove("is-highlighted");
        // Reinicia la animación si se hace clic varias veces seguidas.
        void searchWidget.offsetWidth;
        searchWidget.classList.add("is-highlighted");

        window.setTimeout(() => {
            searchWidget.classList.remove("is-highlighted");
        }, 1800);
    }

    document.addEventListener("click", (event) => {
        const button = event.target.closest("[data-servicio]");
        if (!button) return;

        event.preventDefault();

        setSelectValue(servicioSelect, button.dataset.servicio);
        setSelectValue(sedeSelect, button.dataset.sede);

        searchWidget.scrollIntoView({ behavior: "smooth", block: "center" });
        highlightWidget();
    });
});