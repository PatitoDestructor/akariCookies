// buscador.js (estable con includeHTML y sin dobles bindings)
(function () {
  // --- Utils de precio ---
  function formatPrice(num) {
    if (isNaN(num)) return '';
    return '$' + Number(num).toLocaleString('es-AR'); // sin decimales
  }

  function parsePrice(text) {
    if (!text && text !== 0) return 0;
    const cleaned = String(text).replace(/[^\d,.\-]/g, '').replace(/\.(?=.*\.)/g, '');
    const normalized = cleaned.replace(',', '.');
    const n = Number(normalized);
    return isNaN(n) ? 0 : n;
  }

  // --- Leer productos del DOM (index, tienda, etc) ---
  function getProductsFromDOM() {
    const cards = document.querySelectorAll(
      '.productoscontainer .card, .productos .card, .derecha .card, .contendorProductos .card'
    );
    return Array.from(cards).map((card, i) => {
      const titleEl = card.querySelector('.title');
      const priceEl = card.querySelector('.price .new');
      const imgEl = card.querySelector('.img img');
      const descEl = card.querySelector('.descripcion, .descripcionTitulo, .meta, .feats') || null;

      const rawPriceText = priceEl ? priceEl.textContent.trim() : '';
      const priceNum = parsePrice(rawPriceText);

      return {
        id: card.dataset.id || `prod-${i}`,
        title: titleEl ? titleEl.textContent.trim() : `Producto ${i + 1}`,
        desc: descEl ? descEl.textContent.trim().slice(0, 120) : '',
        img: imgEl ? imgEl.src : '',
        price: priceNum,
        _cardEl: card
      };
    });
  }

  // --- Contenedor de resultados (único) ---
  function ensureResultsContainer() {
    let container = document.getElementById('searchResults');
    if (!container) {
      const searchParent = document.querySelector('.search');
      container = document.createElement('div');
      container.id = 'searchResults';
      container.className = 'search-results';
      Object.assign(container.style, {
        position: 'absolute',
        background: '#fff',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
        width: '320px',
        maxHeight: '320px',
        overflowY: 'auto',
        display: 'none',
        zIndex: 1500
      });
      if (searchParent) searchParent.appendChild(container);
      else document.body.appendChild(container);
    }
    return container;
  }

  // --- Pintar resultados ---
  function renderResults(results, inputEl, container) {
    try {
      container.innerHTML = '';
      if (!results || results.length === 0) {
        container.innerHTML = `<div style="padding:12px;color:#666">No se encontraron resultados.</div>`;
      } else {
        results.forEach((p) => {
          const item = document.createElement('div');
          item.className = 'result-item';
          Object.assign(item.style, {
            display: 'flex',
            gap: '10px',
            padding: '8px',
            cursor: 'pointer',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0'
          });

          const img = document.createElement('img');
          img.src = p.img || '';
          Object.assign(img.style, {
            width: '56px',
            height: '56px',
            objectFit: 'cover',
            borderRadius: '6px',
            flex: '0 0 56px'
          });

          const info = document.createElement('div');
          info.innerHTML = `
            <div style="font-weight:600;font-size:14px;color:#222">${escapeHtml(p.title)}</div>
            <div style="font-size:13px;color:#666;margin-top:4px">${escapeHtml(p.desc || '')}</div>
            <div style="font-size:13px;color:#111;margin-top:6px">${formatPrice(p.price)}</div>
          `;

          item.appendChild(img);
          item.appendChild(info);

          // Al hacer click: abre la modal existente o rellena fallback
          item.addEventListener('click', () => {
            if (p._cardEl) {
              const imgOriginal = p._cardEl.querySelector('.img img');
              if (imgOriginal) {
                imgOriginal.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                container.style.display = 'none';
                inputEl.value = '';
                return;
              }
            }

            const modal = document.getElementById('productModal');
            if (!modal) return;
            const modalImage = document.getElementById('modalImage');
            const modalTitle = document.getElementById('modalTitle');
            const modalPrice = document.getElementById('modalPrice');
            const modalQty = document.getElementById('modalQty');

            if (modalImage) modalImage.src = p.img || '';
            if (modalTitle) modalTitle.textContent = p.title;
            if (modalPrice) modalPrice.textContent = formatPrice(p.price);
            if (modalQty) modalQty.value = 1;

            const addCartBtn = document.querySelector('#productModal .add-cart');
            if (addCartBtn) {
              addCartBtn.dataset.id = p.id;
              addCartBtn.dataset.title = p.title;
              addCartBtn.dataset.price = p.price;
              addCartBtn.dataset.img = p.img;
            }

            modal.classList.add('show');
            container.style.display = 'none';
            inputEl.value = '';
          });

          container.appendChild(item);
        });
      }

      const rect = inputEl.getBoundingClientRect();
      container.style.top = `${rect.bottom + window.scrollY + 6}px`;
      container.style.left = `${rect.left + window.scrollX}px`;
      container.style.display = 'block';
    } catch (err) {
      console.error('Error renderResults:', err);
      container.style.display = 'none';
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  // --- Inicialización robusta y sin duplicados ---
  function initSearchOnce() {
    // Evita doble init global (por si el archivo se carga más de una vez)
    if (window.__akariSearchInit) return;
    window.__akariSearchInit = true;

    // Observa #nav, que es donde inyectas el nav.html
    const navEl = document.getElementById('nav') || document.body;
    const obs = new MutationObserver(() => {
      const searchInput = document.querySelector('.search__input');
      if (!searchInput) return;

      // Evita re-bind si ya se hizo (marca en el input)
      if (searchInput.dataset.bound === '1') return;
      searchInput.dataset.bound = '1';

      const container = ensureResultsContainer();

      searchInput.addEventListener('input', (e) => {
        const term = String(e.target.value || '').trim().toLowerCase();
        if (!term) {
          container.style.display = 'none';
          return;
        }
        const products = getProductsFromDOM();
        const filtered = products.filter(
          (p) =>
            (p.title || '').toLowerCase().includes(term) ||
            (p.desc || '').toLowerCase().includes(term)
        );
        renderResults(filtered, searchInput, container);
      });

      // Ocultar al click fuera
      document.addEventListener('click', (ev) => {
        if (!ev.target.closest('.search') && !ev.target.closest('#searchResults')) {
          container.style.display = 'none';
        }
      });
    });

    obs.observe(navEl, { childList: true, subtree: true });

    // Fallback: si ya está el input cuando carga el script
    const readyInput = document.querySelector('.search__input');
    if (readyInput && readyInput.dataset.bound !== '1') {
      readyInput.dataset.bound = '1';
      const container = ensureResultsContainer();
      readyInput.addEventListener('input', (e) => {
        const term = String(e.target.value || '').trim().toLowerCase();
        if (!term) {
          container.style.display = 'none';
          return;
        }
        const products = getProductsFromDOM();
        const filtered = products.filter(
          (p) =>
            (p.title || '').toLowerCase().includes(term) ||
            (p.desc || '').toLowerCase().includes(term)
        );
        renderResults(filtered, readyInput, container);
      });
      document.addEventListener('click', (ev) => {
        if (!ev.target.closest('.search') && !ev.target.closest('#searchResults')) {
          container.style.display = 'none';
        }
      });
    }
  }

  // Arranque seguro
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearchOnce);
  } else {
    initSearchOnce();
  }
})();
