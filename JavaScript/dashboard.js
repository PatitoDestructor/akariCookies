// dashboard.js (corregido)
// --- Validar acceso al dashboard ---
(function(){
    const isAuth = sessionStorage.getItem("authDashboard");
    if (!isAuth) {
        // Si no hay autorización, redirigir
        Swal.fire({
            icon: "error",
            title: "Acceso denegado",
            text: "Debes iniciar sesión para entrar al dashboard"
        }).then(() => {
            window.location.href = "index.html"; // o donde tengas el login
        });
    }
})();

(function () {
    // Utils
    const $ = (sel) => document.querySelector(sel);

    function safeJSON(key, def) {
        try {
        const raw = localStorage.getItem(key);
        if (!raw) return def;
        const val = JSON.parse(raw);
        return val ?? def;
        } catch {
        return def;
        }
    }

    function formatDateTime(isoOrStr) {
        if (!isoOrStr) return '';
        const d = new Date(isoOrStr);
        if (isNaN(d.getTime())) return String(isoOrStr);
        return d.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
    }

    function toCSV(rows, headers) {
        const escape = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`;
        const head = headers.map(escape).join(',');
        const body = rows.map((r) => r.map(escape).join(',')).join('\n');
        return head + '\n' + body;
    }

    function download(filename, content, mime = 'text/csv;charset=utf-8;') {
        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        a.remove();
    }

    // ---------- Carga/normalización de datos ----------
    function leerReservas() {
        // Tu código guarda bajo "reserva" un único objeto (no array):
        // localStorage.setItem('reserva', JSON.stringify(reservaData))
        // Hacemos compatible también con "reservas" (array), por si migras.
        const uno = safeJSON('reserva', null);
        const arr = safeJSON('reservas', null);

        let out = [];
        if (Array.isArray(uno)) out = uno;
        else if (uno && typeof uno === 'object') out = [uno];
        else if (Array.isArray(arr)) out = arr;

        // Normaliza campos y agrega createdAt si falta
        return out.map((r) => ({
        nombre: r.nombre || '',
        apellido: r.apellido || '',
        telefono: r.telefono || '',
        fechaHora: r.fechaHora || '',
        invitados: r.invitados || '',
        createdAt: r.createdAt || r.fechaHora || ''
        }));
    }

    function leerTalleresPlano() {
        // Estructura esperada:
        // "Talleres": { "NombreDelTaller": [ {nombre, apellido, telefono, email, createdAt?}, ... ] }
        const obj = safeJSON('Talleres', {});
        return Object.entries(obj).flatMap(([taller, arr]) =>
        (Array.isArray(arr) ? arr : []).map((item) => ({
            taller,
            nombre: item.nombre || '',
            apellido: item.apellido || '',
            telefono: item.telefono || '',
            email: item.email || '',
            createdAt: item.createdAt || ''
        }))
        );
    }

    let reservas = leerReservas();
    let talleresPlano = leerTalleresPlano();
    const talleresObj = safeJSON('Talleres', {});

    // KPIs
    $('#kpiReservas') && ($('#kpiReservas').textContent = reservas.length);
    $('#kpiInscritos') && ($('#kpiInscritos').textContent = talleresPlano.length);
    $('#kpiTalleres') && ($('#kpiTalleres').textContent = Object.keys(talleresObj).length);

    // ---------- Render tablas ----------
    // Reservas
    const tbodyRes = $('#tablaReservas tbody');
    function renderReservas(filtro = '') {
        if (!tbodyRes) return;
        const term = filtro.trim().toLowerCase();
        let data = reservas.slice();
        if (term) {
        data = data.filter(
            (r) =>
            (r.nombre || '').toLowerCase().includes(term) ||
            (r.apellido || '').toLowerCase().includes(term) ||
            (r.telefono || '').toLowerCase().includes(term) ||
            (r.fechaHora || '').toLowerCase().includes(term)
        );
        }
        if (!data.length) {
        tbodyRes.innerHTML = `<tr><td class="empty" colspan="6">Sin datos</td></tr>`;
        return;
        }
        tbodyRes.innerHTML = data
        .map(
            (r) => `
            <tr>
            <td>${r.nombre}</td>
            <td>${r.apellido}</td>
            <td><span class="pill">${r.telefono}</span></td>
            <td>${formatDateTime(r.fechaHora)}</td>
            <td>${r.invitados}</td>
            <td>${formatDateTime(r.createdAt)}</td>
            </tr>`
        )
        .join('');
    }
    renderReservas();

    $('#searchReservas') &&
        $('#searchReservas').addEventListener('input', (e) => {
        renderReservas(e.target.value || '');
        });

    $('#exportReservas') &&
        $('#exportReservas').addEventListener('click', () => {
        if (!reservas.length) {
            return Swal && Swal.fire({ icon: 'info', title: 'No hay reservas para exportar' });
        }
        const headers = ['Nombre', 'Apellido', 'Teléfono', 'Fecha/Hora', 'Invitados', 'Creado'];
        const rows = reservas.map((r) => [
            r.nombre,
            r.apellido,
            r.telefono,
            formatDateTime(r.fechaHora),
            r.invitados,
            formatDateTime(r.createdAt)
        ]);
        const csv = toCSV(rows, headers);
        download('reservas.csv', csv);
        });

    // Talleres
    const tbodyTal = $('#tablaTalleres tbody');
    function renderTalleres(filtro = '') {
        if (!tbodyTal) return;
        const term = filtro.trim().toLowerCase();
        let data = talleresPlano.slice();
        if (term) {
        data = data.filter(
            (t) =>
            (t.taller || '').toLowerCase().includes(term) ||
            (t.nombre || '').toLowerCase().includes(term) ||
            (t.apellido || '').toLowerCase().includes(term) ||
            (t.email || '').toLowerCase().includes(term)
        );
        }
        if (!data.length) {
        tbodyTal.innerHTML = `<tr><td class="empty" colspan="6">Sin datos</td></tr>`;
        return;
        }
        tbodyTal.innerHTML = data
        .map(
            (t) => `
            <tr>
            <td class="taller">${t.taller}</td>
            <td>${t.nombre}</td>
            <td>${t.apellido}</td>
            <td><span class="pill">${t.telefono}</span></td>
            <td>${t.email}</td>
            <td>${formatDateTime(t.createdAt)}</td>
            </tr>`
        )
        .join('');
    }
    renderTalleres();

    $('#searchTalleres') &&
        $('#searchTalleres').addEventListener('input', (e) => {
        renderTalleres(e.target.value || '');
        });

    $('#exportTalleres') &&
        $('#exportTalleres').addEventListener('click', () => {
        if (!talleresPlano.length) {
            return Swal && Swal.fire({ icon: 'info', title: 'No hay inscripciones para exportar' });
        }
        const headers = ['Taller', 'Nombre', 'Apellido', 'Teléfono', 'Email', 'Creado'];
        const rows = talleresPlano.map((t) => [
            t.taller,
            t.nombre,
            t.apellido,
            t.telefono,
            t.email,
            formatDateTime(t.createdAt)
        ]);
        const csv = toCSV(rows, headers);
        download('talleres.csv', csv);
        });

    // Reaccionar a cambios de localStorage (si se graba desde otra pestaña/página)
    window.addEventListener('storage', (e) => {
        if (['reserva', 'reservas', 'Talleres'].includes(e.key)) {
        reservas = leerReservas();
        talleresPlano = leerTalleresPlano();
        // KPIs
        $('#kpiReservas') && ($('#kpiReservas').textContent = reservas.length);
        $('#kpiInscritos') && ($('#kpiInscritos').textContent = talleresPlano.length);
        $('#kpiTalleres') && ($('#kpiTalleres').textContent = Object.keys(safeJSON('Talleres', {})).length);
        // Tablas
        renderReservas($('#searchReservas')?.value || '');
        renderTalleres($('#searchTalleres')?.value || '');
        }
    });
})();

// --- Botón Volver ---
(function () {
    const backBtn = document.getElementById('btnBack');

    // Guarda la referrer (si existe) como respaldo para la vuelta
    try {
        if (document.referrer) {
        sessionStorage.setItem('prevUrl', document.referrer);
        }
    } catch (e) { /* noop */ }

    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
        e.preventDefault();

        // 1) Si hay referrer del mismo origen, usa history.back()
        try {
            if (document.referrer) {
            const ref = new URL(document.referrer);
            if (ref.origin === location.origin) {
                history.back();
                return;
            }
            }
        } catch (e) { /* noop */ }

        // 2) Si guardamos prevUrl, usarlo
        const prev = sessionStorage.getItem('prevUrl');
        if (prev) {
            location.href = prev;
            return;
        }

        // 3) Fallback a home
        location.href = 'index.html';
        });
    }
})();

