function incluirHTML(selector, url) {
    return fetch(url)
    .then(res => {
        if (!res.ok) throw new Error(`Error cargando ${url}: ${res.status}`);
        return res.text();
    })
    .then(html => {
        const el = document.querySelector(selector);
        if (!el) throw new Error(`Selector ${selector} no encontrado`);
        el.innerHTML = html;
        return el;
    });
}