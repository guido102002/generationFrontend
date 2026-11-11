(() => {
    "use strict";

    const CARRITO_KEY = "tbc_carrito";
    const SERVICIOS_KEY = "tbc_servicios";
    const WHATSAPP_NUMERO = "573015047928";

    function escapeHTML(texto) {
        return String(texto).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        }[c]));
    }

    function leerCarrito() {
        try {
            const guardado = localStorage.getItem(CARRITO_KEY);
            if (!guardado) return {};
            const datos = JSON.parse(guardado);
            return datos && typeof datos === "object" ? datos : {};
        } catch (err) {
            console.error("No se pudo leer el carrito:", err);
            return {};
        }
    }

    function guardarCarrito(cambios) {
        const nuevo = { ...leerCarrito(), ...cambios };
        try {
            localStorage.setItem(CARRITO_KEY, JSON.stringify(nuevo));
        } catch (err) {
            console.error("No se pudo guardar el carrito:", err);
        }
        return nuevo;
    }

    function leerServicios() {
        try {
            const guardado = localStorage.getItem(SERVICIOS_KEY);
            if (!guardado) return [];
            const datos = JSON.parse(guardado);
            return Array.isArray(datos) ? datos : [];
        } catch (err) {
            console.error("No se pudieron leer los servicios:", err);
            return [];
        }
    }

    function formatearFecha(valor) {
        if (!valor) return "Por definir";
        const fecha = new Date(valor + "T00:00:00");
        if (Number.isNaN(fecha.getTime())) return valor;

        const texto = fecha.toLocaleDateString("es-CO", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
        });

        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    function esDomingo(valor) {
        if (!valor) return false;
        const fecha = new Date(valor + "T00:00:00");
        return !Number.isNaN(fecha.getTime()) && fecha.getDay() === 0;
    }

    function formatearHora(hhmm) {
        const [h, m] = hhmm.split(":").map(Number);
        const sufijo = h >= 12 ? "pm" : "am";
        const hora12 = h % 12 === 0 ? 12 : h % 12;
        return `${hora12}:${String(m).padStart(2, "0")} ${sufijo}`;
    }

    /* Horario: Lun-Sáb 9:00 am - 8:00 pm / Dom 10:00 am - 4:00 pm */
    function generarHoras(fecha) {
        const domingo = esDomingo(fecha);
        const inicio = domingo ? 10 : 9;
        const fin = domingo ? 16 : 20;
        const horas = [];

        for (let h = inicio; h < fin; h++) {
            horas.push(`${String(h).padStart(2, "0")}:00`);
            horas.push(`${String(h).padStart(2, "0")}:30`);
        }
        horas.push(`${String(fin).padStart(2, "0")}:00`);

        return horas;
    }

    /*index.html: guardar la selección del widget*/
    function initWidget() {
        const widget = document.querySelector(".inicio-search-widget");
        const servicio = document.getElementById("hero-servicio");

        if (!widget || !servicio) return;

        const campos = {
            fecha: document.getElementById("hero-fecha"),
            servicio,
            sede: document.getElementById("hero-sede"),
            barbero: document.getElementById("hero-barbero"),
        };

        function guardarSeleccion() {
            const datos = {};
            Object.entries(campos).forEach(([clave, el]) => {
                if (el) datos[clave] = el.value;
            });
            guardarCarrito(datos);
        }

        Object.values(campos).forEach((el) => {
            if (el) el.addEventListener("change", guardarSeleccion);
        });

        widget.addEventListener("submit", (event) => {
            event.preventDefault();
            event.stopPropagation();

            /* Fecha y sede son obligatorias para continuar */
            if (!widget.checkValidity()) {
                widget.classList.add("was-validated");
                const invalido = widget.querySelector(":invalid");
                if (invalido) invalido.focus();
                return;
            }

            guardarSeleccion();
            window.location.assign("./Pages/servicios.html?carrito=1");
        });
    }

    /* 2) Pages/servicios.html: carrito (Offcanvas de Bootstrap) */
    function initCarrito() {
        const offcanvasEl = document.getElementById("carritoOffcanvas");
        if (!offcanvasEl) return;

        if (typeof bootstrap === "undefined" || !bootstrap.Offcanvas) return;

        const els = {
            offcanvas: offcanvasEl,
            form: document.getElementById("carrito-form"),
            fecha: document.getElementById("carrito-fecha-input"),
            servicio: document.getElementById("carrito-servicio-select"),
            sede: document.getElementById("carrito-sede-select"),
            barbero: document.getElementById("carrito-barbero-select"),
            nombre: document.getElementById("carrito-nombre"),
            correo: document.getElementById("carrito-correo"),
            hora: document.getElementById("carrito-hora"),
            exito: document.getElementById("carrito-exito"),
            badge: document.getElementById("carrito-badge"),
        };

        const params = new URLSearchParams(window.location.search);

        /* Respaldo: si el formulario se envió sin JS, los datos vienen en la URL */
        const desdeURL = {};
        ["fecha", "servicio", "sede", "barbero"].forEach((clave) => {
            if (params.get(clave)) desdeURL[clave] = params.get(clave);
        });
        if (Object.keys(desdeURL).length > 0) guardarCarrito(desdeURL);

        const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);

        function nombresServicios() {
            const servicios = leerServicios();
            const nombres = [
                ...new Set(servicios.map((s) => s && s.nombre).filter(Boolean)),
            ];

            if (nombres.length > 0) return nombres;

            /* Respaldo: nombres visibles en el catálogo */
            const delCatalogo = Array.from(
                document.querySelectorAll("#catalogo-grid .service-name")
            )
                .map((el) => el.textContent.trim())
                .filter(Boolean);

            return [...new Set(delCatalogo)];
        }

        function poblarServicios(seleccionado) {
            if (!els.servicio) return;

            const nombres = nombresServicios();
            const opciones = [
                '<option value="" selected disabled>Selecciona un servicio</option>',
            ];

            nombres.forEach((nombre) => {
                opciones.push(
                    `<option value="${escapeHTML(nombre)}">${escapeHTML(nombre)}</option>`
                );
            });

            els.servicio.innerHTML = opciones.join("");

            if (!seleccionado) return;

            if (!nombres.includes(seleccionado)) {
                els.servicio.insertAdjacentHTML(
                    "beforeend",
                    `<option value="${escapeHTML(seleccionado)}">${escapeHTML(seleccionado)}</option>`
                );
            }
            els.servicio.value = seleccionado;
        }

        function actualizarBadge(carrito = leerCarrito()) {
            if (!els.badge) return;
            const tiene = Boolean(carrito.servicio);
            els.badge.textContent = tiene ? "1" : "0";
            els.badge.classList.toggle("d-none", !tiene);
        }

        function renderHoras(fecha, seleccionada) {
            if (!els.hora) return;

            const horas = generarHoras(fecha);
            els.hora.innerHTML =
                '<option value="" selected disabled>Selecciona una hora</option>' +
                horas.map((h) => `<option value="${h}">${formatearHora(h)}</option>`).join("");

            if (seleccionada && horas.includes(seleccionada)) {
                els.hora.value = seleccionada;
            }
        }

        function renderFormulario() {
            const carrito = leerCarrito();

            poblarServicios(carrito.servicio || "");

            if (els.fecha) els.fecha.value = carrito.fecha || "";
            if (els.sede) els.sede.value = carrito.sede || "";
            if (els.barbero) els.barbero.value = carrito.barbero || "Cualquiera";
            if (els.nombre) els.nombre.value = carrito.nombre || "";
            if (els.correo) els.correo.value = carrito.correo || "";

            renderHoras(carrito.fecha, carrito.hora || "");
            actualizarBadge(carrito);

            if (els.form) els.form.classList.remove("was-validated");
            if (els.exito) els.exito.classList.add("d-none");
        }

        function abrir() {
            renderFormulario();
            offcanvas.show();
        }

        /* Guardar los campos mientras el usuario los edita */
        function guardarCampo(clave, el) {
            if (!el) return;
            guardarCarrito({ [clave]: el.value });
            actualizarBadge();
        }

        if (els.fecha) {
            els.fecha.addEventListener("change", () => {
                const fecha = els.fecha.value;
                const carrito = leerCarrito();
                const horas = generarHoras(fecha);
                const horaValida = horas.includes(carrito.hora) ? carrito.hora : "";

                guardarCarrito({ fecha, hora: horaValida });
                renderHoras(fecha, horaValida);
                actualizarBadge();
            });
        }

        if (els.servicio) {
            els.servicio.addEventListener("change", () => {
                guardarCarrito({ servicio: els.servicio.value });

                /* Si la sede está vacía, se autocompleta con la sede del servicio */
                if (els.sede && !els.sede.value) {
                    const servicio = leerServicios().find(
                        (s) => s && s.nombre === els.servicio.value
                    );

                    let sede = servicio && servicio.sede ? servicio.sede : "";

                    if (!sede) {
                        const card = Array.from(
                            document.querySelectorAll("#catalogo-grid .service-card")
                        ).find(
                            (c) =>
                                c.querySelector(".service-name")?.textContent.trim() ===
                                els.servicio.value
                        );
                        const meta =
                            card?.querySelector(".service-meta")?.textContent.trim() || "";
                        sede = meta.split("·")[1]?.trim() || "";
                    }

                    if (sede) {
                        els.sede.value = sede;
                        guardarCarrito({ sede });
                    }
                }

                actualizarBadge();
            });
        }

        if (els.sede) {
            els.sede.addEventListener("change", () => guardarCampo("sede", els.sede));
        }
        if (els.barbero) {
            els.barbero.addEventListener("change", () => guardarCampo("barbero", els.barbero));
        }
        if (els.nombre) {
            els.nombre.addEventListener("input", () => guardarCampo("nombre", els.nombre));
        }
        if (els.correo) {
            els.correo.addEventListener("input", () => guardarCampo("correo", els.correo));
        }
        if (els.hora) {
            els.hora.addEventListener("change", () => guardarCampo("hora", els.hora));
        }

        /* Botones "Reservar" del catálogo: siempre abren el carrito */
        document.addEventListener("click", (event) => {
            const boton = event.target.closest("#catalogo-grid .service-card .btn");
            if (!boton) return;

            const card = boton.closest(".service-card");
            if (!card) return;

            event.preventDefault();

            const nombre = card.querySelector(".service-name")?.textContent.trim() || "";
            const meta = card.querySelector(".service-meta")?.textContent.trim() || "";
            const sede = meta.split("·")[1]?.trim() || "";

            guardarCarrito({ servicio: nombre, sede });
            abrir();
        });

        /* Confirmar reserva */
        if (els.form) {
            els.form.addEventListener("submit", (event) => {
                event.preventDefault();
                event.stopPropagation();

                if (!els.form.checkValidity()) {
                    els.form.classList.add("was-validated");
                    const invalido = els.form.querySelector(":invalid");
                    if (invalido) invalido.focus();
                    return;
                }

                const datos = {
                    fecha: els.fecha ? els.fecha.value : "",
                    servicio: els.servicio ? els.servicio.value : "",
                    sede: els.sede ? els.sede.value : "",
                    barbero: els.barbero ? els.barbero.value : "",
                    nombre: els.nombre ? els.nombre.value.trim() : "",
                    correo: els.correo ? els.correo.value.trim() : "",
                    hora: els.hora ? els.hora.value : "",
                };
                guardarCarrito(datos);
                actualizarBadge();

                const horaTexto =
                    els.hora && els.hora.selectedIndex >= 0
                        ? els.hora.options[els.hora.selectedIndex].textContent
                        : datos.hora;

                const texto = [
                    "Hola, quiero confirmar mi reserva:",
                    `Servicio: ${datos.servicio || "—"}`,
                    `Sede: ${datos.sede || "—"}`,
                    `Fecha: ${formatearFecha(datos.fecha)}`,
                    `Hora: ${horaTexto}`,
                    `Barbero: ${datos.barbero || "Cualquiera"}`,
                    `Nombre: ${datos.nombre}`,
                    `Correo: ${datos.correo}`,
                ].join("\n");

                if (els.exito) {
                    els.exito.classList.remove("d-none");
                    els.exito.innerHTML = `
                        <strong>¡Reserva registrada!</strong><br>
                        ${escapeHTML(datos.servicio || "Servicio")} · ${escapeHTML(formatearFecha(datos.fecha))} · ${escapeHTML(horaTexto)}<br>
                        Te contactaremos a <strong>${escapeHTML(datos.correo)}</strong>.
                        <a class="btn btn-gold btn-sm w-100 mt-3" target="_blank" rel="noopener"
                           href="https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(texto)}">
                            <i class="bi bi-whatsapp me-2"></i>Enviar por WhatsApp
                        </a>`;
                    els.exito.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            });
        }

        /* Abrir automáticamente al llegar desde "Buscar" */
        const debeAbrir =
            params.get("carrito") === "1" || window.location.hash === "#carrito";

        if (debeAbrir) {
            abrir();

            /* Limpia la URL para que no se reabra al recargar */
            const url = new URL(window.location.href);
            url.searchParams.delete("carrito");
            ["fecha", "servicio", "sede", "barbero"].forEach((k) => url.searchParams.delete(k));
            if (url.hash === "#carrito") url.hash = "";
            window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        } else {
            renderFormulario();
        }

        offcanvasEl.addEventListener("show.bs.offcanvas", renderFormulario);
    }

    document.addEventListener("DOMContentLoaded", () => {
        initWidget();
        initCarrito();
    });
})();
