const DESTINO = "tripsbarber@gmail.com";
const ENDPOINT = `https://formsubmit.co/ajax/${DESTINO}`;

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function updateOpenStatus() {
  const badge = document.getElementById("open-badge");
  const rows = document.querySelectorAll("#hours li");
  const now = new Date();
  const today = now.getDay();
  const current = now.getHours() * 60 + now.getMinutes();

  rows.forEach((row) => {
    const isToday = Number(row.dataset.day) === today;
    row.classList.toggle("today", isToday);

    if (isToday) {
      const open = current >= toMinutes(row.dataset.open) && current < toMinutes(row.dataset.close);
      badge.hidden = false;
      badge.classList.toggle("is-open", open);
      badge.textContent = open ? "Abierto ahora" : "Cerrado ahora";
    }
  });
}

const form = document.getElementById("contact-form");
const statusEl = document.getElementById("form-status");
const submitBtn = document.getElementById("submit-btn");

const rules = {
  nombre: (v) => (v.trim().length < 2 ? "Escribe tu nombre." : ""),
  email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Escribe un correo válido."),
  telefono: (v) => (v.replace(/\D/g, "").length < 7 ? "Escribe un teléfono válido." : ""),
  mensaje: (v) => (v.trim().length < 5 ? "Escribe tu mensaje." : ""),
};

function validateField(name) {
  const input = form.elements[name];
  const message = rules[name](input.value);
  form.querySelector(`.error[data-for="${name}"]`).textContent = message;
  input.classList.toggle("invalid", Boolean(message));
  return !message;
}

Object.keys(rules).forEach((name) => {
  const input = form.elements[name];
  input.addEventListener("blur", () => validateField(name));
  input.addEventListener("input", () => {
    if (input.classList.contains("invalid")) validateField(name);
  });
});

function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = type ? `form-note ${type}` : "form-note";
}

/* ----------  Envío al correo ---------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const allValid = Object.keys(rules).map(validateField).every(Boolean);
  if (!allValid) {
    setStatus("Revisa los campos marcados.", "bad");
    return;
  }

  if (form.elements._honey.value) {
    form.reset();
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando...";
  setStatus("", "");

  const payload = {
    "Nombre": form.elements.nombre.value.trim(),
    "Correo": form.elements.email.value.trim(),
    "Teléfono": form.elements.telefono.value.trim(),
    "Mensaje": form.elements.mensaje.value.trim(),
    email: form.elements.email.value.trim(), 
    _subject: `Nuevo mensaje de ${form.elements.nombre.value.trim()} - Barber Trips Club`,
    _template: "table",
    _captcha: "false",
  };

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok || String(data.success) !== "true") {
      throw new Error(data.message || "No se pudo enviar");
    }

    setStatus("¡Mensaje enviado! Te responderemos pronto.", "good");
    form.reset();
  } catch (err) {
    if (location.protocol === "file:") {
      setStatus("Abre la página con Live Server (clic derecho en index.html > Open with Live Server). Desde el doble clic el envío no funciona.", "bad");
    } else {
      setStatus(`No pudimos enviar: ${err.message}. Si dice "Activation", abre el correo de FormSubmit en ${DESTINO} y confirma.`, "bad");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar mensaje";
  }
});

updateOpenStatus();
setInterval(updateOpenStatus, 60 * 1000);