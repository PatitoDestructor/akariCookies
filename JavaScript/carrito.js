// carrito.js
let cart = [];

/* ---------- localStorage ---------- */
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCartFromStorage() {
    const stored = localStorage.getItem('cart');
    if (!stored) return;
    try {
        cart = JSON.parse(stored) || [];
    } catch (e) {
        cart = [];
    }
    // Normalizar propiedades por si vienen en formatos distintos
    cart = cart.map(item => ({
        title: item.title || 'Sin título',
        imgSrc: item.imgSrc || '',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1
    }));
}

/* ---------- funciones de manipulación ---------- */
function addToCart(product) {
  // buscar por título (si tienes un id único, úsalo mejor)
    const existing = cart.find(p => p.title === product.title);
    if (existing) {
        existing.quantity += 1;
    } else {
        product.quantity = product.quantity || 1;
        product.price = Number(product.price) || 0;
        cart.push(product);
    }
    saveCart();
    renderCart();
    // SweetAlert de confirmación (requerir SweetAlert2 en la página)
    if (window.Swal) {
        Swal.fire({
        icon: 'success',
        title: '¡Producto agregado!',
        text: `${product.title} fue añadido al carrito`,
        timer: 1300,
        showConfirmButton: false
        });
    }
}

function removeByTitle(title) {
    const idx = cart.findIndex(p => p.title === title);
    if (idx !== -1) {
        cart.splice(idx, 1);
        saveCart();
        renderCart();
    }
}

function changeQuantity(title, delta) {
    const item = cart.find(p => p.title === title);
    if (!item) return;
    item.quantity = Math.max(1, (item.quantity || 1) + delta);
    saveCart();
    renderCart();
}

/* ---------- renderizado ---------- */
function renderCart() {
    const cartContainer = document.getElementById('cart-items');
    const totalContainer = document.getElementById('cart-total');
    const counter = document.getElementById('cart-counter');

  // Si el HTML aún no existe, no hacemos nada (ya se ejecutará después)
    if (!cartContainer || !totalContainer || !counter) return;

    cartContainer.innerHTML = '';

    if (!cart.length) {
        cartContainer.innerHTML = `<p class="empty">Tu carrito está vacío</p>`;
        totalContainer.textContent = 'Total: $0';
        counter.textContent = '0';
        return;
    }

    let total = 0;
    let totalItems = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        totalItems += item.quantity;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
        <img src="${item.imgSrc}" alt="${escapeHtml(item.title)}" class="cart-img">
        <div class="cart-info">
            <h4>${escapeHtml(item.title)}</h4>
            <p>$${Number(item.price).toLocaleString()} x ${item.quantity}</p>
        </div>
        <div class="cart-actions">
            <button class="qty-minus" data-title="${escapeAttr(item.title)}">-</button>
            <button class="qty-plus" data-title="${escapeAttr(item.title)}">+</button>
            <button class="remove-btn" data-title="${escapeAttr(item.title)}">×</button>
        </div>
        `;
        cartContainer.appendChild(div);
    });

    totalContainer.textContent = `Total: $${total.toLocaleString()}`;
    counter.textContent = totalItems.toString();
}

/* ---------- event handlers (delegation) ---------- */
function setupCartDelegation() {
    const cartContainer = document.getElementById('cart-items');
    if (!cartContainer) return;

  // Delegación para botones dentro del carrito
    cartContainer.addEventListener('click', (e) => {
        const remove = e.target.closest('.remove-btn');
        if (remove) {
        const title = remove.dataset.title;
        removeByTitle(title);
        return;
        }

        const plus = e.target.closest('.qty-plus');
        if (plus) {
        const title = plus.dataset.title;
        changeQuantity(title, +1);
        return;
        }

        const minus = e.target.closest('.qty-minus');
        if (minus) {
        const title = minus.dataset.title;
        changeQuantity(title, -1);
        return;
        }
    });
}

/* ---------- conectar botones "Agregar" de productos (si existen) ---------- */
function setupProductButtons() {
  // Intentamos añadir listeners a botones .productos .btn (si existen)
    const productButtons = document.querySelectorAll('.productos .btn, .derecha .btn');
    if (!productButtons || productButtons.length === 0) return;

    productButtons.forEach(button => {
        button.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (!card) return;
        const titleEl = card.querySelector('.title');
        const priceEl = card.querySelector('.price .new');
        const imgEl = card.querySelector('.img img');

        const title = titleEl ? titleEl.textContent.trim() : 'Sin título';
        const priceStr = priceEl ? priceEl.textContent.replace(/\./g, '').replace(/[^0-9]/g, '') : '0';
        const price = Number(priceStr) || 0;
        const imgSrc = imgEl ? imgEl.src : '';

        addToCart({ title, price, imgSrc });
        });
    });
}

/* ---------- utilidades ---------- */
function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}
function escapeAttr(str) {
    return String(str).replace(/"/g, '&quot;');
}

/* ---------- Inicialización: esperar includes y luego arrancar ---------- */
(async function initApp() {
    try {
        // Esperar a que nav y footer estén insertados (importante porque el carrito está en nav o en footer)
        await incluirHTML('#nav', 'layouts/nav.html');
        await incluirHTML('#footer', 'layouts/footer.html');
    } catch (err) {
        console.warn('Error cargando includes:', err);
        // continuar de todas formas
    }

  // Ya con includes insertados, cargar carrito y arrancar listeners
    loadCartFromStorage();
    renderCart();
    setupCartDelegation();
    setupProductButtons();

  // Inicializar panel (si está dentro del nav incluido)
    const btn = document.getElementById('toggle-panel');
    const panel = document.getElementById('side-panel');
    const closeBtn = document.getElementById('close-panel');
    if (btn && panel && closeBtn) {
        btn.addEventListener('click', () => panel.classList.toggle('active'));
        closeBtn.addEventListener('click', () => panel.classList.remove('active'));
    }
})();


// --- Checkout Modal (Página de pago) ---
(function setupCheckoutModal(){
  // Espera a que el side-panel esté en el DOM (por si lo incluyes dinámicamente)
  const waitFor = (sel, cb) => {
    const el = document.querySelector(sel);
    if (el) return cb(el);
    const mo = new MutationObserver(() => {
      const el2 = document.querySelector(sel);
      if (el2) { mo.disconnect(); cb(el2); }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  };

  waitFor('#side-panel', () => {
    const payBtn = document.querySelector('.panel-footer .bubbles'); // tu botón existente
    const modal  = document.getElementById('checkoutModal');
    if (!payBtn || !modal) return;

    const backdrop = modal.querySelector('.pay-backdrop');
    const closeEls = modal.querySelectorAll('[data-close]');

    // Construir link de WhatsApp con total (si lo tienes en #cart-total) y productos (opcional)
    const waBtn = modal.querySelector('#waBtn');

    function getCartTotalText(){
      const totalEl = document.getElementById('cart-total');
      return totalEl ? totalEl.textContent.replace('Total: ','').trim() : '';
    }

    function buildWaURL(){
    // Cambia por tu número real en formato internacional sin "+"
    const numero = '573135198690';

    // 1) Total desde tu UI (ya lo pintas en #cart-total)
    const totalText = (() => {
        const totalEl = document.getElementById('cart-total');
        return totalEl ? totalEl.textContent.replace('Total:','').trim() : '';
    })();

    // 2) Intentamos leer los ítems desde localStorage (tu carrito se guarda en "cart")
    let items = [];
    try {
        const raw = localStorage.getItem('cart');
        if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            items = parsed;
        }
        }
    } catch (e) {
        console.warn('No se pudo leer cart de localStorage:', e);
    }

    // 3) Si no hay items en localStorage, intentamos leerlos desde el DOM del panel (fallback)
    if (items.length === 0) {
        const domItems = document.querySelectorAll('#cart-items .cart-item');
        items = Array.from(domItems).map(el => {
        const title = el.querySelector('h4')?.textContent?.trim() || 'Producto';
        const priceText = el.querySelector('.cart-info p')?.textContent?.trim() || '$0';
        // extrae número (COP sin separadores) p. ej. "$20.000" -> 20000
        const price = Number(String(priceText).replace(/[^\d]/g, '')) || 0;

        // si manejas cantidad en el DOM, intenta leerla:
        let qty = 1;
        const qtyEl = el.querySelector('.qty-value, .qty, [data-qty]');
        if (qtyEl) {
            const q = parseInt(qtyEl.textContent || qtyEl.value || qtyEl.getAttribute('data-qty'), 10);
            if (!isNaN(q) && q > 0) qty = q;
        }
        return { title, price, qty };
        });
    } else {
        // Normaliza por si en tu estructura no está qty (asume 1)
        items = items.map(it => ({
        title: it.title || 'Producto',
        price: Number(it.price) || 0,
        qty: Number(it.qty) > 0 ? Number(it.qty) : 1
        }));
    }

    // 4) Armamos el mensaje
    const lineas = items.map(it => {
        const subtotal = it.price * it.qty;
        return `• ${it.title}  x${it.qty}  —  $${subtotal.toLocaleString('es-CO')}`;
    });

    const encabezado = `Hola, quiero finalizar mi compra.\n`;
    const detalle = lineas.length ? `\nDetalle del pedido:\n${lineas.join('\n')}\n` : '';
    const totalLinea = totalText ? `\nTotal actual: ${totalText}` : '';

    const msg = `${encabezado}${detalle}${totalLinea}`.trim();

    // 5) URL de WhatsApp
    return `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
    }


    function openModal(){
      // actualizar link al abrir (por si el total cambió)
      if (waBtn) waBtn.href = buildWaURL();

      modal.classList.add('open');
      document.addEventListener('keydown', escHandler);
    }

    function closeModal(){
      modal.classList.remove('open');
      document.removeEventListener('keydown', escHandler);
    }

    function escHandler(e){
      if (e.key === 'Escape') closeModal();
    }

    payBtn.addEventListener('click', openModal);

    if (backdrop) backdrop.addEventListener('click', (e) => {
      if (e.target.dataset.close) closeModal();
    });

    closeEls.forEach(btn => btn.addEventListener('click', closeModal));
  });
})();
