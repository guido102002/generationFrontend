/* Conecta los botones "Reservar" de los servicios con el widget del hero. */
document.addEventListener("DOMContentLoaded", () => {
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

    document.querySelectorAll("[data-servicio]").forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();

            setSelectValue(servicioSelect, button.dataset.servicio);
            setSelectValue(sedeSelect, button.dataset.sede);

            searchWidget.scrollIntoView({ behavior: "smooth", block: "center" });
            highlightWidget();
        });
    });
});
