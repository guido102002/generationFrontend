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

    function formatoPrecio(valor) {
        return "$" + new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(Number(valor) || 0);
    }

    /* Normaliza el carrito y migra el formato antiguo ({ servicio }) a una lista */
    function normalizarCarrito(carrito) {
        const datos = carrito && typeof carrito === "object" ? { ...carrito } : {};

        if (!Array.isArray(datos.servicios)) {
            datos.servicios = datos.servicio ? [{ nombre: datos.servicio }] : [];
        }

        datos.servicios = datos.servicios
            .map((s) => (typeof s === "string" ? { nombre: s } : s))
            .filter((s) => s && s.nombre)
            .map((s) => ({
                nombre: s.nombre,
                sede: s.sede || "",
                precio: Number(s.precio) || 0,
                duracion: Number(s.duracion) || 0,
            }));

        return datos;
    }

    function leerCarrito() {
        try {
            const guardado = localStorage.getItem(CARRITO_KEY);
            if (!guardado) return normalizarCarrito({});
            return normalizarCarrito(JSON.parse(guardado));
        } catch (err) {
            console.error("No se pudo leer el carrito:", err);
            return normalizarCarrito({});
        }
    }

    function guardarCarrito(cambios) {
        const nuevo = normalizarCarrito({ ...leerCarrito(), ...cambios });
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

    /* Busca precio, duración y sede de un servicio en los datos o en el catálogo visible */
    function datosServicio(nombre) {
        if (!nombre) return { nombre: "", sede: "", precio: 0, duracion: 0 };

        const servicio = leerServicios().find((s) => s && s.nombre === nombre);
        if (servicio) {
            return {
                nombre: servicio.nombre,
                sede: servicio.sede || "",
                precio: Number(servicio.precio) || 0,
                duracion: Number(servicio.duracion) || 0,
            };
        }

        const card = Array.from(
            document.querySelectorAll(
                "#catalogo-grid .service-card, #servicios-populares-grid .service-card"
            )
        ).find(
            (c) => c.querySelector(".service-name")?.textContent.trim() === nombre
        );

        if (!card) return { nombre, sede: "", precio: 0, duracion: 0 };

        const meta = card.querySelector(".service-meta")?.textContent.trim() || "";
        const partes = meta.split("·").map((p) => p.trim());
        const precioTexto = card.querySelector(".service-price")?.textContent || "";

        return {
            nombre,
            sede: partes[1] || "",
            precio: Number(precioTexto.replace(/[^\d]/g, "")) || 0,
            duracion: parseInt(partes[0], 10) || 0,
        };
    }

    /* Agrega un servicio a la lista evitando duplicados */
    function agregarServicio(carrito, nombre) {
        if (!nombre) return { carrito, agregado: false };

        if (carrito.servicios.some((s) => s.nombre === nombre)) {
            return { carrito, agregado: false };
        }

        const datos = datosServicio(nombre);
        carrito.servicios.push(datos);

        if (!carrito.sede && datos.sede) carrito.sede = datos.sede;

        return { carrito, agregado: true };
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

    /* index.html: guardar la selección del widget */
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

            const carrito = leerCarrito();
            agregarServicio(carrito, servicio.value);

            guardarCarrito({
                fecha: campos.fecha ? campos.fecha.value : "",
                servicio: servicio.value,
                sede: campos.sede ? campos.sede.value : "",
                barbero: campos.barbero ? campos.barbero.value : "",
                servicios: carrito.servicios,
            });

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
            sede: document.getElementById("carrito-sede-select"),
            barbero: document.getElementById("carrito-barbero-select"),
            servicio: document.getElementById("carrito-servicio-select"),
            agregar: document.getElementById("carrito-agregar-servicio"),
            lista: document.getElementById("carrito-servicios-lista"),
            sinServicios: document.getElementById("carrito-sin-servicios"),
            aviso: document.getElementById("carrito-servicios-aviso"),
            serviciosError: document.getElementById("carrito-servicios-error"),
            total: document.getElementById("carrito-total"),
            totalValor: document.getElementById("carrito-total-valor"),
            nombre: document.getElementById("carrito-nombre"),
            correo: document.getElementById("carrito-correo"),
            hora: document.getElementById("carrito-hora"),
            observacion: document.getElementById("carrito-observacion"),
            exito: document.getElementById("carrito-exito"),
            badge: document.getElementById("carrito-badge"),
        };

        const params = new URLSearchParams(window.location.search);

        /* Respaldo: si el formulario se envió sin JS, los datos vienen en la URL */
        const desdeURL = {};
        ["fecha", "servicio", "sede", "barbero"].forEach((clave) => {
            if (params.get(clave)) desdeURL[clave] = params.get(clave);
        });
        if (Object.keys(desdeURL).length > 0) {
            const carrito = leerCarrito();
            if (desdeURL.servicio) agregarServicio(carrito, desdeURL.servicio);
            guardarCarrito({
                ...desdeURL,
                servicios: carrito.servicios,
                sede: desdeURL.sede || carrito.sede,
            });
        }

        const offcanvas = bootstrap.Offcanvas.getOrCreateInstance(offcanvasEl);

        let avisoTimer = null;

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

        function poblarServicios() {
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
        }

        function actualizarBadge(carrito = leerCarrito()) {
            if (!els.badge) return;
            const cantidad = (carrito.servicios || []).length;
            els.badge.textContent = String(cantidad);
            els.badge.classList.toggle("d-none", cantidad === 0);
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

        /* Completa precio/duración que falten en servicios guardados con el formato antiguo */
        function serviciosEnriquecidos(carrito) {
            return (carrito.servicios || []).map((s) => {
                const datos = datosServicio(s.nombre);
                return {
                    nombre: s.nombre,
                    sede: s.sede || datos.sede,
                    precio: Number(s.precio) || datos.precio || 0,
                    duracion: Number(s.duracion) || datos.duracion || 0,
                };
            });
        }

        function renderTotal(servicios) {
            if (!els.total || !els.totalValor) return;

            const total = servicios.reduce((suma, s) => suma + (Number(s.precio) || 0), 0);

            if (total > 0) {
                els.total.classList.remove("d-none");
                els.totalValor.textContent = formatoPrecio(total);
            } else {
                els.total.classList.add("d-none");
            }
        }

        function renderServicios(carrito) {
            if (!els.lista) return;

            const servicios = serviciosEnriquecidos(carrito);

            els.lista.innerHTML = servicios
                .map((s, index) => {
                    const meta = [];
                    if (s.duracion) meta.push(`${s.duracion} min`);
                    if (s.precio) meta.push(formatoPrecio(s.precio));

                    return `
                        <li class="list-group-item carrito-servicio-item">
                            <div class="carrito-servicio-info">
                                <span class="carrito-servicio-nombre">${escapeHTML(s.nombre)}</span>
                                ${
                                    meta.length
                                        ? `<small class="carrito-servicio-meta">${escapeHTML(
                                              meta.join(" · ")
                                          )}</small>`
                                        : ""
                                }
                            </div>
                            <button type="button" class="carrito-quitar" data-index="${index}"
                                    aria-label="Quitar ${escapeHTML(s.nombre)}">
                                <i class="bi bi-x-lg"></i>
                            </button>
                        </li>`;
                })
                .join("");

            if (els.sinServicios) {
                els.sinServicios.classList.toggle("d-none", servicios.length > 0);
            }
            if (els.serviciosError) els.serviciosError.classList.add("d-none");

            renderTotal(servicios);
        }

        function mostrarAviso(mensaje, tipo = "success") {
            if (!els.aviso) return;

            els.aviso.textContent = mensaje;
            els.aviso.classList.remove("d-none", "text-success", "text-warning");
            els.aviso.classList.add(tipo === "warning" ? "text-warning" : "text-success");

            if (avisoTimer) clearTimeout(avisoTimer);
            avisoTimer = window.setTimeout(() => {
                els.aviso.classList.add("d-none");
            }, 2500);
        }

        function ocultarExito() {
            if (els.exito) els.exito.classList.add("d-none");
        }

        function agregarServicioDesdeUI() {
            const nombre = els.servicio ? els.servicio.value : "";

            if (!nombre) {
                mostrarAviso("Selecciona un servicio primero.", "warning");
                if (els.servicio) els.servicio.focus();
                return;
            }

            ocultarExito();

            const carrito = leerCarrito();
            const resultado = agregarServicio(carrito, nombre);

            if (!resultado.agregado) {
                mostrarAviso("Ese servicio ya está en tu reserva.", "warning");
                return;
            }

            const actualizado = guardarCarrito({
                servicios: resultado.carrito.servicios,
                sede: resultado.carrito.sede,
            });

            if (els.sede) els.sede.value = actualizado.sede || "";
            if (els.servicio) els.servicio.value = "";

            renderServicios(actualizado);
            actualizarBadge(actualizado);
            mostrarAviso("Servicio agregado.", "success");
        }

        function quitarServicio(index) {
            const carrito = leerCarrito();

            if (!Number.isInteger(index) || index < 0 || index >= carrito.servicios.length) {
                return;
            }

            ocultarExito();
            carrito.servicios.splice(index, 1);

            const actualizado = guardarCarrito({ servicios: carrito.servicios });
            renderServicios(actualizado);
            actualizarBadge(actualizado);
            if (els.serviciosError) els.serviciosError.classList.add("d-none");
        }

        function renderFormulario() {
            const carrito = leerCarrito();

            poblarServicios();

            if (els.fecha) els.fecha.value = carrito.fecha || "";
            if (els.sede) els.sede.value = carrito.sede || "";
            if (els.barbero) els.barbero.value = carrito.barbero || "Cualquiera";
            if (els.nombre) els.nombre.value = carrito.nombre || "";
            if (els.correo) els.correo.value = carrito.correo || "";
            if (els.observacion) els.observacion.value = carrito.observacion || "";
            if (els.aviso) els.aviso.classList.add("d-none");

            renderHoras(carrito.fecha, carrito.hora || "");
            renderServicios(carrito);
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
            ocultarExito();
            guardarCarrito({ [clave]: el.value });
            actualizarBadge();
        }

        if (els.fecha) {
            els.fecha.addEventListener("change", () => {
                ocultarExito();
                const fecha = els.fecha.value;
                const carrito = leerCarrito();
                const horas = generarHoras(fecha);
                const horaValida = horas.includes(carrito.hora) ? carrito.hora : "";

                guardarCarrito({ fecha, hora: horaValida });
                renderHoras(fecha, horaValida);
                actualizarBadge();
            });
        }

        if (els.agregar) {
            els.agregar.addEventListener("click", agregarServicioDesdeUI);
        }

        if (els.lista) {
            els.lista.addEventListener("click", (event) => {
                const boton = event.target.closest(".carrito-quitar");
                if (!boton) return;
                quitarServicio(Number(boton.dataset.index));
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
        if (els.observacion) {
            els.observacion.addEventListener("input", () =>
                guardarCampo("observacion", els.observacion)
            );
        }

        /* Botones "Reservar" del catálogo: agregan el servicio y abren el carrito */
        document.addEventListener("click", (event) => {
            const boton = event.target.closest("#catalogo-grid .service-card .btn");
            if (!boton) return;

            const card = boton.closest(".service-card");
            if (!card) return;

            event.preventDefault();

            const nombre = card.querySelector(".service-name")?.textContent.trim() || "";
            if (!nombre) return;

            const carrito = leerCarrito();
            const resultado = agregarServicio(carrito, nombre);

            if (resultado.agregado) {
                guardarCarrito({
                    servicios: resultado.carrito.servicios,
                    sede: resultado.carrito.sede,
                });
            }

            abrir();
        });

        /* Confirmar reserva */
        if (els.form) {
            els.form.addEventListener("submit", (event) => {
                event.preventDefault();
                event.stopPropagation();

                const carrito = leerCarrito();

                if (carrito.servicios.length === 0) {
                    els.form.classList.add("was-validated");
                    if (els.serviciosError) els.serviciosError.classList.remove("d-none");
                    if (els.servicio) els.servicio.focus();
                    return;
                }

                if (!els.form.checkValidity()) {
                    els.form.classList.add("was-validated");
                    const invalido = els.form.querySelector(":invalid");
                    if (invalido) invalido.focus();
                    return;
                }

                const datos = {
                    fecha: els.fecha ? els.fecha.value : "",
                    sede: els.sede ? els.sede.value : "",
                    barbero: els.barbero ? els.barbero.value : "",
                    nombre: els.nombre ? els.nombre.value.trim() : "",
                    correo: els.correo ? els.correo.value.trim() : "",
                    hora: els.hora ? els.hora.value : "",
                    observacion: els.observacion ? els.observacion.value.trim() : "",
                    servicios: carrito.servicios,
                    servicio: carrito.servicios[0]?.nombre || "",
                };
                guardarCarrito(datos);
                actualizarBadge();

                const horaTexto =
                    els.hora && els.hora.selectedIndex >= 0
                        ? els.hora.options[els.hora.selectedIndex].textContent
                        : datos.hora;

                const nombresTexto = carrito.servicios.map((s) => s.nombre).join(", ");

                const texto = [
                    "Hola, quiero confirmar mi reserva:",
                    `Servicios: ${nombresTexto || "—"}`,
                    `Sede: ${datos.sede || "—"}`,
                    `Fecha: ${formatearFecha(datos.fecha)}`,
                    `Hora: ${horaTexto}`,
                    `Barbero: ${datos.barbero || "Cualquiera"}`,
                    `Nombre: ${datos.nombre}`,
                    `Correo: ${datos.correo}`,
                    `Observaciones: ${datos.observacion || "Ninguna"}`,
                ].join("\n");

                if (els.exito) {
                    els.exito.classList.remove("d-none");
                    els.exito.innerHTML = `
                        <strong>¡Reserva registrada!</strong><br>
                        ${escapeHTML(nombresTexto || "Servicio")} · ${escapeHTML(
                        formatearFecha(datos.fecha)
                    )} · ${escapeHTML(horaTexto)}<br>
                        Te contactaremos a <strong>${escapeHTML(datos.correo)}</strong>.
                        ${
                            datos.observacion
                                ? `<br><small>Observaciones: ${escapeHTML(
                                      datos.observacion
                                  )}</small>`
                                : ""
                        }
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
            ["fecha", "servicio", "sede", "barbero"].forEach((k) =>
                url.searchParams.delete(k)
            );
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
