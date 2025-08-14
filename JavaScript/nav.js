// javascript/nav.js
(function () {
    // ===== Utilidad: inyecta la modal 1 sola vez =====
    function injectModalIfNeeded() {
        if (document.getElementById("authBackdrop")) return;

        const wrapper = document.createElement("div");
        wrapper.innerHTML = `
        <div id="authBackdrop" class="auth-backdrop" hidden>
            <div id="authModal" class="auth-modal" role="dialog" aria-modal="true" aria-labelledby="authTitle">
            <button class="auth-close" aria-label="Cerrar modal">×</button>
            <div class="form-container">
                <p class="titleLogin" id="authTitle">Administrador</p>
                <form class="form" id="authForm" novalidate>
                <input type="email" class="inputLogin" placeholder="Correo:" id="authEmail" required>
                <input type="password" class="inputLogin" placeholder="Contraseña:" id="authPass" required>
                <button class="form-btn">Iniciar</button>
                </form>
                <p class="sign-up-label"></p>
            </div>
            </div>
        </div>
        `;
        document.body.appendChild(wrapper.firstElementChild);

        // Asegura que SweetAlert quede por encima si lo usas
        const style = document.createElement("style");
        style.textContent = `
        .auth-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.25); display: grid; place-items: center; opacity: 0; transition: opacity .22s ease; z-index: 10000; }
        .auth-backdrop.show { opacity: 1; }
        .auth-modal { transform: translateY(12px) scale(.98); opacity: 0; transition: transform .22s ease, opacity .22s ease; }
        .auth-modal.show { transform: translateY(0) scale(1); opacity: 1; }
        .auth-close { position:absolute; top: 8px; right: 12px; font-size: 22px; border: 0; background: transparent; cursor: pointer; }
        .swal2-container { z-index: 20000 !important; } /* por si SweetAlert quedaba detrás */
        `;
        document.head.appendChild(style);
    }

    // ===== Abrir/Cerrar =====
    function openModal() {
        const backdrop = document.getElementById("authBackdrop");
        const modal = document.getElementById("authModal");
        if (!backdrop || !modal) return;
        backdrop.hidden = false;
        // forzar reflow
        backdrop.offsetHeight;
        backdrop.classList.add("show");
        modal.classList.add("show");
        document.documentElement.style.overflow = "hidden";
    }

    function closeModal() {
        const backdrop = document.getElementById("authBackdrop");
        const modal = document.getElementById("authModal");
        if (!backdrop || !modal) return;
        modal.classList.remove("show");
        backdrop.classList.remove("show");
        setTimeout(() => {
        backdrop.hidden = true;
        document.documentElement.style.overflow = "";
        }, 220);
    }

    // ===== Wire events (idempotente) =====
    function wireModalEvents(userImg) {
        if (!userImg || userImg.dataset.bound === "1") return;
        injectModalIfNeeded();

        const backdrop = document.getElementById("authBackdrop");
        const modal = document.getElementById("authModal");
        const closeBtn = modal.querySelector(".auth-close");
        const form = modal.querySelector("#authForm");

        // abrir desde el icono user
        userImg.addEventListener("click", (e) => {
        e.preventDefault();
        openModal();
        });

        // cerrar con X
        closeBtn.addEventListener("click", closeModal);

        // cerrar clic fuera
        backdrop.addEventListener("click", (e) => {
        if (!e.target.closest(".auth-modal")) closeModal();
        });

        // cerrar con ESC
        document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !backdrop.hidden) closeModal();
        });

        // login demo -> dashboard protegido
        form.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = modal.querySelector("#authEmail").value.trim();
        const pass  = modal.querySelector("#authPass").value.trim();

        if (email === "akariCookiesAdmin@gmail.com" && pass === "akari12345") {
            if (window.Swal) {
            Swal.fire({
                icon: "success",
                title: "Bienvenido",
                text: "Has ingresado correctamente",
                timer: 1200,
                showConfirmButton: false
            }).then(() => {
                sessionStorage.setItem("authDashboard", "true");
                window.location.href = "dashboard.html";
            });
            } else {
            sessionStorage.setItem("authDashboard", "true");
            window.location.href = "dashboard.html";
            }
        } else {
            if (window.Swal) {
            Swal.fire({
                icon: "error",
                title: "Credenciales incorrectas",
                text: "Verifica tu correo y contraseña"
            });
            } else {
            alert("Credenciales incorrectas");
            }
        }
        });

        // marcar como enlazado para no duplicar
        userImg.dataset.bound = "1";
    }

    // ===== Esperar a que el nav (y .user) exista aunque llegue por incluirHTML =====
    document.addEventListener("DOMContentLoaded", () => {
        const observer = new MutationObserver(() => {
        const userImg = document.querySelector(".user");
        if (userImg) {
            wireModalEvents(userImg);
        }
        });

        // Observar todo el body porque #nav se rellena asíncronamente
        observer.observe(document.body, { childList: true, subtree: true });

        // Por si ya estuviera disponible
        const userImgNow = document.querySelector(".user");
        if (userImgNow) wireModalEvents(userImgNow);
    });
})();
