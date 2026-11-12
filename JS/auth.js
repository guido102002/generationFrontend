/* =========================================================
 
 validaciones de formulario 
 Al validar, se crea un objeto JSON con los datos del usuario
 Usuarios y sesión se guardan en localStorage
  Muestra el menú de usuario en la navbar cuando hay sesión

   ========================================================= */
(() => {
    "use strict";

    const USUARIOS_KEY = "tbc_usuarios"; // lista de usuarios registrados
    const SESION_KEY = "tbc_sesion"; // correo del usuario con sesión activa

    /*localStorage*/
    function leerUsuarios() {
        try {
            const guardado = localStorage.getItem(USUARIOS_KEY);
            const datos = guardado ? JSON.parse(guardado) : [];
            return Array.isArray(datos) ? datos : [];
        } catch (err) {
            console.error("No se pudieron leer los usuarios:", err);
            return [];
        }
    }

    function guardarUsuarios(lista) {
        try {
            localStorage.setItem(USUARIOS_KEY, JSON.stringify(lista));
            return true;
        } catch (err) {
            console.error("No se pudieron guardar los usuarios:", err);
            return false;
        }
    }

    function usuarioActivo() {
        try {
            const correo = localStorage.getItem(SESION_KEY);
            if (!correo) return null;
            return leerUsuarios().find((u) => u.email === correo) || null;
        } catch (err) {
            return null;
        }
    }

    function haySesion() {
        return usuarioActivo() !== null;
    }

    /* ---------- Validaciones*/
    const REGEX_NOMBRE = /^\p{L}[\p{L}'’.-]*(\s+\p{L}[\p{L}'’.-]*)+$/u;
    const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    /* Deja solo los 10 dígitos del celular (acepta +57, espacios y guiones) */
    function normalizarTelefono(valor) {
        let digitos = String(valor).replace(/\D/g, "");
        if (digitos.length === 12 && digitos.startsWith("57")) digitos = digitos.slice(2);
        return digitos;
    }

    function reglasPassword(valor) {
        return {
            longitud: valor.length >= 8,
            mayuscula: /[A-Z]/.test(valor),
            especial: /[^A-Za-z0-9\s]/.test(valor),
        };
    }

    const validar = {
        nombre(valor) {
            const v = valor.trim().replace(/\s+/g, " ");
            if (!v) return "Escribe tu nombre completo.";
            if (!REGEX_NOMBRE.test(v)) return "Escribe tu nombre y apellido (solo letras).";
            if (v.length < 5) return "El nombre es demasiado corto.";
            return "";
        },
        telefono(valor) {
            if (!valor.trim()) return "Escribe tu número de teléfono.";
            if (!/^3\d{9}$/.test(normalizarTelefono(valor))) {
                return "Ingresa un celular colombiano válido de 10 dígitos (ej. 3015047928).";
            }
            return "";
        },
        email(valor) {
            const v = valor.trim();
            if (!v) return "Escribe tu correo electrónico.";
            if (!REGEX_EMAIL.test(v)) return "Escribe un correo válido (ej. nombre@correo.com).";
            return "";
        },
        emailNuevo(valor) {
            const base = validar.email(valor);
            if (base) return base;
            const existe = leerUsuarios().some((u) => u.email === valor.trim().toLowerCase());
            return existe ? "Este correo ya está registrado. Inicia sesión." : "";
        },
        password(valor) {
            if (!valor) return "Escribe una contraseña.";
            const r = reglasPassword(valor);
            if (!r.longitud) return "Debe tener mínimo 8 caracteres.";
            if (!r.mayuscula) return "Debe incluir al menos una letra mayúscula.";
            if (!r.especial) return "Debe incluir al menos un carácter especial (ej. ! @ # $ %).";
            return "";
        },
        passwordLogin(valor) {
            return valor ? "" : "Escribe tu contraseña.";
        },
    };

    /* ---------- HTML del modal */
    const MODAL_HTML = `
    <div class="modal fade tbc-auth-modal" id="authModal" data-bs-theme="dark" tabindex="-1"
         aria-labelledby="authModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title" id="authModalLabel">
                        <i class="bi bi-person-circle me-2"></i>Tu cuenta
                    </h2>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">

                    <div class="tbc-auth-tabs" role="tablist">
                        <button type="button" class="tbc-auth-tab active" id="auth-tab-login" data-tab="login"
                                role="tab" aria-selected="true">Iniciar sesión</button>
                        <button type="button" class="tbc-auth-tab" id="auth-tab-registro" data-tab="registro"
                                role="tab" aria-selected="false">Registrarme</button>
                    </div>

                    <div id="auth-mensaje" class="tbc-auth-mensaje d-none" role="status"></div>

                    <!-- INICIAR SESIÓN -->
                    <form id="auth-login-form" class="tbc-auth-panel" novalidate>
                        <div class="mb-3 tbc-campo">
                            <label for="log-email" class="form-label">Correo electrónico</label>
                            <input type="email" class="form-control" id="log-email" autocomplete="email"
                                   placeholder="tucorreo@ejemplo.com">
                            <div class="invalid-feedback"></div>
                        </div>
                        <div class="mb-4 tbc-campo">
                            <label for="log-password" class="form-label">Contraseña</label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="log-password"
                                       autocomplete="current-password" placeholder="Tu contraseña">
                                <button type="button" class="tbc-ver-pass" data-target="log-password"
                                        aria-label="Mostrar contraseña"><i class="bi bi-eye"></i></button>
                            </div>
                            <div class="invalid-feedback"></div>
                        </div>
                        <button type="submit" class="btn btn-gold w-100">
                            <i class="bi bi-box-arrow-in-right me-2"></i>Iniciar sesión
                        </button>
                        <p class="tbc-auth-cambio">¿No tienes cuenta?
                            <button type="button" class="tbc-auth-link" data-tab="registro">Regístrate</button>
                        </p>
                    </form>

                    <!-- REGISTRO -->
                    <form id="auth-registro-form" class="tbc-auth-panel d-none" novalidate>
                        <div class="mb-3 tbc-campo">
                            <label for="reg-nombre" class="form-label">Nombre completo</label>
                            <input type="text" class="form-control" id="reg-nombre" autocomplete="name"
                                   placeholder="Ej. Maria Becerra">
                            <div class="invalid-feedback"></div>
                        </div>
                        <div class="mb-3 tbc-campo">
                            <label for="reg-telefono" class="form-label">Número de teléfono</label>
                            <input type="tel" class="form-control" id="reg-telefono" autocomplete="tel"
                                   inputmode="numeric" placeholder="Ej. 3202424310">
                            <div class="invalid-feedback"></div>
                        </div>
                        <div class="mb-3 tbc-campo">
                            <label for="reg-email" class="form-label">Correo electrónico (tu usuario)</label>
                            <input type="email" class="form-control" id="reg-email" autocomplete="email"
                                   placeholder="tucorreo@ejemplo.com">
                            <div class="invalid-feedback"></div>
                        </div>
                        <div class="mb-3 tbc-campo">
                            <label for="reg-password" class="form-label">Contraseña</label>
                            <div class="input-group">
                                <input type="password" class="form-control" id="reg-password"
                                       autocomplete="new-password" placeholder="Crea una contraseña">
                                <button type="button" class="tbc-ver-pass" data-target="reg-password"
                                        aria-label="Mostrar contraseña"><i class="bi bi-eye"></i></button>
                            </div>
                            <div class="invalid-feedback"></div>
                            <ul class="tbc-pass-reglas" id="reg-reglas">
                                <li data-regla="longitud"><i class="bi bi-circle"></i> Mínimo 8 caracteres</li>
                                <li data-regla="mayuscula"><i class="bi bi-circle"></i> Una letra mayúscula</li>
                                <li data-regla="especial"><i class="bi bi-circle"></i> Un carácter especial (! @ # $ %)</li>
                            </ul>
                        </div>
                        <div class="mb-4 tbc-campo">
                            <label for="reg-password2" class="form-label">Confirmar contraseña</label>
                            <input type="password" class="form-control" id="reg-password2"
                                   autocomplete="new-password" placeholder="Repite la contraseña">
                            <div class="invalid-feedback"></div>
                        </div>
                        <button type="submit" class="btn btn-gold w-100">
                            <i class="bi bi-person-plus me-2"></i>Crear cuenta
                        </button>
                        <p class="tbc-auth-cambio">¿Ya tienes cuenta?
                            <button type="button" class="tbc-auth-link" data-tab="login">Inicia sesión</button>
                        </p>
                    </form>

                </div>
            </div>
        </div>
    </div>`;

    /* ---------- Controlador del modal*/
    let modal = null;
    let els = {};
    let estado = { autenticado: false, alAutenticar: null, alCancelar: null };

    function marcar(input, mensaje) {
        const grupo = input.closest(".tbc-campo");
        const feedback = grupo ? grupo.querySelector(".invalid-feedback") : null;
        input.classList.toggle("is-invalid", Boolean(mensaje));
        if (feedback) {
            feedback.textContent = mensaje || "";
            feedback.classList.toggle("d-block", Boolean(mensaje));
        }
    }

    function limpiarFormulario(form) {
        form.reset();
        form.querySelectorAll(".is-invalid").forEach((i) => marcar(i, ""));
    }

    function mostrarMensaje(texto, tipo = "info") {
        if (!els.mensaje) return;
        if (!texto) {
            els.mensaje.classList.add("d-none");
            els.mensaje.textContent = "";
            return;
        }
        els.mensaje.textContent = texto;
        els.mensaje.dataset.tipo = tipo;
        els.mensaje.classList.remove("d-none");
    }

    function mostrarPestana(nombre) {
        const esLogin = nombre === "login";
        els.loginForm.classList.toggle("d-none", !esLogin);
        els.registroForm.classList.toggle("d-none", esLogin);
        els.tabLogin.classList.toggle("active", esLogin);
        els.tabRegistro.classList.toggle("active", !esLogin);
        els.tabLogin.setAttribute("aria-selected", String(esLogin));
        els.tabRegistro.setAttribute("aria-selected", String(!esLogin));
    }

    function actualizarReglasPassword() {
        const r = reglasPassword(els.regPassword.value);
        els.reglas.querySelectorAll("li").forEach((li) => {
            const cumple = r[li.dataset.regla];
            li.classList.toggle("ok", cumple);
            const icono = li.querySelector("i");
            icono.className = cumple ? "bi bi-check-circle-fill" : "bi bi-circle";
        });
    }

    /* en el registro valida, crea el objeto JSON del usuario y lo guarda */
    function enviarRegistro(event) {
        event.preventDefault();

        const campos = [
            [els.regNombre, validar.nombre],
            [els.regTelefono, validar.telefono],
            [els.regEmail, validar.emailNuevo],
            [els.regPassword, validar.password],
        ];

        let primerError = null;
        campos.forEach(([input, fn]) => {
            const mensaje = fn(input.value);
            marcar(input, mensaje);
            if (mensaje && !primerError) primerError = input;
        });

        const coincide = els.regPassword2.value === els.regPassword.value && els.regPassword2.value !== "";
        marcar(els.regPassword2, coincide ? "" : "Las contraseñas no coinciden.");
        if (!coincide && !primerError) primerError = els.regPassword2;

        if (primerError) {
            primerError.focus();
            return;
        }

        /* objeto JSON con los campos del usuario */
        const usuario = {
            id: Date.now(),
            nombre: els.regNombre.value.trim().replace(/\s+/g, " "),
            telefono: normalizarTelefono(els.regTelefono.value),
            email: els.regEmail.value.trim().toLowerCase(),
            password: els.regPassword.value,
            fechaRegistro: new Date().toISOString(),
        };

        const usuarios = leerUsuarios();
        usuarios.push(usuario);

        if (!guardarUsuarios(usuarios)) {
            mostrarMensaje("No se pudo guardar tu cuenta. Revisa que el navegador permita almacenamiento.", "error");
            return;
        }

        limpiarFormulario(els.registroForm);
        actualizarReglasPassword();
        mostrarPestana("login");
        els.logEmail.value = usuario.email;
        mostrarMensaje("¡Cuenta creada! Ahora inicia sesión con tu correo y contraseña.", "ok");
        els.logPassword.focus();
    }

    /* Inicio de sesión */
    function enviarLogin(event) {
        event.preventDefault();

        const mEmail = validar.email(els.logEmail.value);
        const mPass = validar.passwordLogin(els.logPassword.value);
        marcar(els.logEmail, mEmail);
        marcar(els.logPassword, mPass);

        if (mEmail || mPass) {
            (mEmail ? els.logEmail : els.logPassword).focus();
            return;
        }

        const correo = els.logEmail.value.trim().toLowerCase();
        const usuario = leerUsuarios().find((u) => u.email === correo);

        if (!usuario || usuario.password !== els.logPassword.value) {
            mostrarMensaje("Correo o contraseña incorrectos.", "error");
            return;
        }

        try {
            localStorage.setItem(SESION_KEY, usuario.email);
        } catch (err) {
            mostrarMensaje("No se pudo iniciar la sesión. Revisa que el navegador permita almacenamiento.", "error");
            return;
        }

        estado.autenticado = true;
        renderNavbar();
        modal.hide();
    }

    function construirModal() {
        if (modal) return true;
        if (typeof bootstrap === "undefined" || !bootstrap.Modal) return false;

        document.body.insertAdjacentHTML("beforeend", MODAL_HTML);
        const raiz = document.getElementById("authModal");

        els = {
            raiz,
            mensaje: document.getElementById("auth-mensaje"),
            tabLogin: document.getElementById("auth-tab-login"),
            tabRegistro: document.getElementById("auth-tab-registro"),
            loginForm: document.getElementById("auth-login-form"),
            registroForm: document.getElementById("auth-registro-form"),
            logEmail: document.getElementById("log-email"),
            logPassword: document.getElementById("log-password"),
            regNombre: document.getElementById("reg-nombre"),
            regTelefono: document.getElementById("reg-telefono"),
            regEmail: document.getElementById("reg-email"),
            regPassword: document.getElementById("reg-password"),
            regPassword2: document.getElementById("reg-password2"),
            reglas: document.getElementById("reg-reglas"),
        };

        modal = bootstrap.Modal.getOrCreateInstance(raiz);

        /* Cambiar entre "Iniciar sesión" y "Registrarme" */
        raiz.addEventListener("click", (event) => {
            const boton = event.target.closest("[data-tab]");
            if (!boton) return;
            mostrarMensaje("");
            mostrarPestana(boton.dataset.tab);
        });

        /* Mostrar, ocultar contraseña */
        raiz.addEventListener("click", (event) => {
            const boton = event.target.closest(".tbc-ver-pass");
            if (!boton) return;
            const input = document.getElementById(boton.dataset.target);
            const visible = input.type === "text";
            input.type = visible ? "password" : "text";
            boton.querySelector("i").className = visible ? "bi bi-eye" : "bi bi-eye-slash";
            boton.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
        });

        els.loginForm.addEventListener("submit", enviarLogin);
        els.registroForm.addEventListener("submit", enviarRegistro);

        /* Validación en vivo: se revalida al salir del campo o al corregirlo */
        const enVivo = [
            [els.logEmail, validar.email],
            [els.logPassword, validar.passwordLogin],
            [els.regNombre, validar.nombre],
            [els.regTelefono, validar.telefono],
            [els.regEmail, validar.emailNuevo],
            [els.regPassword, validar.password],
        ];
        enVivo.forEach(([input, fn]) => {
            input.addEventListener("blur", () => {
                if (input.value !== "") marcar(input, fn(input.value));
            });
            input.addEventListener("input", () => {
                if (input.classList.contains("is-invalid")) marcar(input, fn(input.value));
            });
        });

        els.regPassword.addEventListener("input", () => {
            actualizarReglasPassword();
            if (els.regPassword2.value) {
                marcar(
                    els.regPassword2,
                    els.regPassword2.value === els.regPassword.value ? "" : "Las contraseñas no coinciden."
                );
            }
        });
        els.regPassword2.addEventListener("input", () => {
            if (els.regPassword2.value === "" && !els.regPassword2.classList.contains("is-invalid")) return;
            marcar(
                els.regPassword2,
                els.regPassword2.value === els.regPassword.value ? "" : "Las contraseñas no coinciden."
            );
        });

        raiz.addEventListener("shown.bs.modal", () => {
            const form = els.loginForm.classList.contains("d-none") ? els.registroForm : els.loginForm;
            const primero = form.querySelector("input");
            if (primero) primero.focus();
        });

        /* al cerrarse, continúa el flujo de reserva o cancela */
        raiz.addEventListener("hidden.bs.modal", () => {
            const { autenticado, alAutenticar, alCancelar } = estado;
            estado = { autenticado: false, alAutenticar: null, alCancelar: null };
            const siguiente = autenticado ? alAutenticar : alCancelar;
            if (typeof siguiente === "function") siguiente();
        });

        return true;
    }

    /* API pública: abre el modal de login/registro */
    function abrirLogin(opciones = {}) {
        if (!construirModal()) return;

        estado = {
            autenticado: false,
            alAutenticar: opciones.alAutenticar || null,
            alCancelar: opciones.alCancelar || null,
        };

        limpiarFormulario(els.loginForm);
        limpiarFormulario(els.registroForm);
        actualizarReglasPassword();
        mostrarPestana(opciones.pestana === "registro" ? "registro" : "login");
        mostrarMensaje(opciones.mensaje || "", "info");
        modal.show();
    }

    /* ---------- Menú de usuario en la navbar */
    function cerrarSesion() {
        try {
            localStorage.removeItem(SESION_KEY);
        } catch (err) {
            console.error("No se pudo cerrar la sesión:", err);
        }
        renderNavbar();
    }

    function renderNavbar() {
        const anterior = document.getElementById("tbc-user-item");
        if (anterior) anterior.remove();

        const lista = document.querySelector(".custom-navbar .navbar-nav");
        const usuario = usuarioActivo();
        if (!lista || !usuario) return;

        const item = document.createElement("li");
        item.className = "nav-item dropdown tbc-user";
        item.id = "tbc-user-item";
        item.innerHTML = `
            <button type="button" class="tbc-user-btn" data-bs-toggle="dropdown"
                    data-bs-auto-close="true" aria-expanded="false" aria-label="Mi cuenta">
                <i class="bi bi-person-circle"></i>
            </button>
            <div class="dropdown-menu dropdown-menu-end tbc-user-menu" data-bs-theme="dark">
                <div class="tbc-user-info">
                    <i class="bi bi-person-circle tbc-user-avatar"></i>
                    <div class="tbc-user-datos">
                        <strong class="tbc-user-nombre"></strong>
                        <span class="tbc-user-correo"></span>
                    </div>
                </div>
                <hr class="dropdown-divider">
                <button type="button" class="dropdown-item tbc-user-salir">
                    <i class="bi bi-box-arrow-right me-2"></i>Cerrar sesión
                </button>
            </div>`;

        /* textContent evita inyectar HTML con datos del usuario */
        item.querySelector(".tbc-user-nombre").textContent = usuario.nombre;
        item.querySelector(".tbc-user-correo").textContent = usuario.email;
        item.querySelector(".tbc-user-salir").addEventListener("click", cerrarSesion);

        lista.appendChild(item);
    }

    /* Si la sesión cambia en otra pestaña, la navbar se actualiza */
    window.addEventListener("storage", (event) => {
        if (event.key === SESION_KEY || event.key === USUARIOS_KEY) renderNavbar();
    });

    window.TBCAuth = { abrirLogin, haySesion, usuarioActivo, cerrarSesion };

    document.addEventListener("DOMContentLoaded", renderNavbar);
})();
