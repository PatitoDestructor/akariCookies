document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("productModal");
    const modalImage = document.getElementById("modalImage");
    const modalTitle = document.getElementById("modalTitle");
    const modalPrice = document.getElementById("modalPrice");
    const closeBtn = document.querySelector(".modal .close");
    const qtyInput = document.getElementById("modalQty");
    const btnPlus = document.getElementById("modalPlus");
    const btnMinus = document.getElementById("modalMinus");

    // Abrir modal al presionar solo la imagen
    document.querySelectorAll(".card .img img").forEach(img => {
        img.addEventListener("click", (e) => {
            e.stopPropagation();
            const card = img.closest(".card");

            modalImage.src = img.src;
            modalTitle.textContent = card.querySelector(".title").textContent;
            modalPrice.textContent = card.querySelector(".price .new").textContent;
            qtyInput.value = 1;

            modal.classList.add("show");
        });
    });

    // Cerrar modal
    closeBtn.addEventListener("click", () => modal.classList.remove("show"));
    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.classList.remove("show");
        }
    });

    // Control de cantidad
    btnPlus.addEventListener("click", () => qtyInput.value = parseInt(qtyInput.value) + 1);
    btnMinus.addEventListener("click", () => {
        if (qtyInput.value > 1) qtyInput.value = parseInt(qtyInput.value) - 1;
    });
});


document.addEventListener("DOMContentLoaded", () => {
    const addCartModalBtn = document.querySelector(".btnModal.add-cart");
    if (!addCartModalBtn) return;

    addCartModalBtn.addEventListener("click", () => {
        const title = document.getElementById("modalTitle").textContent.trim();
        const priceText = document.getElementById("modalPrice").textContent || "";
        // Extrae sólo números del precio (por ejemplo "$3.000" -> 3000)
        const price = Number(priceText.replace(/[^0-9]/g, "")) || 0;
        const imgSrc = document.getElementById("modalImage").src || "";
        const qtyInput = document.getElementById("modalQty");
        const quantity = Math.max(1, parseInt(qtyInput.value, 10) || 1);

    // --- Usar la variable global `cart` si existe, si no usar localStorage ---
        if (typeof cart !== "undefined" && Array.isArray(cart)) {
        // buscar por título (si tienes id único, úsalo en su lugar)
        const existing = cart.find(item => item.title === title);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + quantity;
        } else {
            cart.push({ title, price, imgSrc, quantity });
        }

      // guardar usando la función saveCart() si existe, si no usar localStorage directo
        if (typeof saveCart === "function") {
            saveCart();
        } else {
            localStorage.setItem("cart", JSON.stringify(cart));
        }

        // renderizar si existe la función
        if (typeof renderCart === "function") renderCart();
        } else {
        // fallback: manipular localStorage con la clave "cart"
        const stored = JSON.parse(localStorage.getItem("cart") || "[]");
        const existing = stored.find(item => item.title === title);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + quantity;
        } else {
            stored.push({ title, price, imgSrc, quantity });
        }
        localStorage.setItem("cart", JSON.stringify(stored));
        if (typeof renderCart === "function") renderCart();
        }

    // Actualizar contador visual (id esperado "cart-counter")
    const counterEl = document.getElementById("cart-counter") || document.getElementById("cart-count");
    if (counterEl) {
      // recalcular total items desde la fuente actual
        const sourceCart = (typeof cart !== "undefined" && Array.isArray(cart)) ? cart :
                        JSON.parse(localStorage.getItem("cart") || "[]");
        const totalItems = sourceCart.reduce((sum, it) => sum + (Number(it.quantity) || 1), 0);
        counterEl.textContent = totalItems;
    }

    // Cerrar modal (clase .show usada en tus estilos)
    const modal = document.getElementById("productModal");
    if (modal) modal.classList.remove("show");

    // Notificación (si SweetAlert2 está cargado)
    if (window.Swal) {
        Swal.fire({
            icon: "success",
            title: "Producto agregado",
            text: `${quantity} × ${title} agregado(s)`,
            timer: 1400,
            showConfirmButton: false
        });
    }
    });
});

//Filtrar precio
document.addEventListener("DOMContentLoaded", () => {
    const priceRange = document.getElementById("priceRange");
    const priceValue = document.getElementById("priceValue");
    const productCount = document.getElementById("productCount");
    const resetPrice = document.getElementById("resetPrice");
    const cards = document.querySelectorAll(".card");

    const MAX_PRICE = parseInt(priceRange.max);

    function filtrarPorPrecio(maxPrice) {
        let contador = 0;
        cards.forEach(card => {
            const priceText = card.querySelector(".price .new").textContent
                .replace("$", "")
                .replace(".", "")
                .trim();
            const price = parseInt(priceText);
            if (price <= maxPrice) {
                card.style.display = "block";
                contador++;
            } else {
                card.style.display = "none";
            }
        });
        actualizarContadorAnimado(contador);
    }

    function actualizarBotonReset(valor) {
        if (valor < MAX_PRICE) {
            resetPrice.classList.add("show");
        } else {
            resetPrice.classList.remove("show");
        }
    }

    priceRange.addEventListener("input", () => {
        const valor = parseInt(priceRange.value);
        priceValue.textContent = valor.toLocaleString("es-CO");
        filtrarPorPrecio(valor);
        actualizarBotonReset(valor);
    });

    resetPrice.addEventListener("click", () => {
        priceRange.value = MAX_PRICE;
        priceValue.textContent = MAX_PRICE.toLocaleString("es-CO");
        filtrarPorPrecio(MAX_PRICE);
        actualizarBotonReset(MAX_PRICE);
    });

    // Inicializa con el valor máximo
    filtrarPorPrecio(MAX_PRICE);
    actualizarBotonReset(MAX_PRICE);
});



function actualizarContadorAnimado(nuevoValor) {
    let elemento = document.getElementById("productosCount");
    let valorActual = parseInt(elemento.textContent.replace(/\D/g, "")) || 0; // leer valor real visible
    if (valorActual === nuevoValor) return; // si no cambia, no animar

    let duracion = 400; // milisegundos
    let inicio = null;

    function animarContador(timestamp) {
        if (!inicio) inicio = timestamp;
        let progreso = Math.min((timestamp - inicio) / duracion, 1);
        let valorInterpolado = Math.floor(valorActual + (nuevoValor - valorActual) * progreso);
        elemento.textContent = `Mostrando ${valorInterpolado} producto${valorInterpolado !== 1 ? 's' : ''}`;

        if (progreso < 1) {
            requestAnimationFrame(animarContador);
        }
    }

    elemento.classList.add("animate");
    setTimeout(() => elemento.classList.remove("animate"), 300);
    requestAnimationFrame(animarContador);
}



