// reservas.js
(function () {
    // ---- Selectores ----
    const form      = document.getElementById('reservaForm');
    const nombre    = document.getElementById('nombre');
    const apellido  = document.getElementById('apellido');
    const telefono  = document.getElementById('telefono');
    const fechaHora = document.getElementById('fechaHora');
    const invitados = document.getElementById('invitados');
    const btn       = document.getElementById('reservarBtn');
    const errorBox  = document.getElementById('formError');

    // Teléfono CO: opcional +57, luego 10 dígitos iniciando en 3 (móvil)
    const reTelefonoCO = /^(\+?57\s*)?3\d{9}$/;

    // --- Utils: localStorage ---
    function loadReservas() {
        try {
        const raw = localStorage.getItem('reserva');
        return raw ? JSON.parse(raw) : [];
        } catch {
        return [];
        }
    }
    function saveReservas(arr) {
        localStorage.setItem('reserva', JSON.stringify(arr));
    }

    // --- Límite mínimo para datetime-local (si NO usas flatpickr) ---
    function setMinDateTime () {
        const now = new Date();
        // Ajuste a zona local para yyyy-MM-ddTHH:mm
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        fechaHora.min = local.toISOString().slice(0, 16);
    }

    // --- Validación de fecha/hora ---
    // - No pasado
    // - Entre 08:00 y 18:00 (18:00 permitido, 18:01 no)
    function validaFechaHora () {
        const val = fechaHora.value;
        if (!val) return { ok: false, msg: 'Selecciona fecha y hora.' };

        const sel = new Date(val);
        const now = new Date();
        if (sel < now) return { ok: false, msg: 'La fecha/hora no puede ser anterior a la actual.' };

        const h = sel.getHours(), m = sel.getMinutes();
        const dentro = (h > 8 && h < 18) || (h === 8 && m >= 0) || (h === 18 && m === 0);
        if (!dentro) return { ok: false, msg: 'El horario válido es de 8:00 a 18:00.' };

        return { ok: true };
    }

    // --- UI de errores ---
    function showError (msg) {
        errorBox.textContent = msg;
        errorBox.hidden = false;
        // reflow para reiniciar animación
        // eslint-disable-next-line no-unused-expressions
        errorBox.offsetHeight;
        errorBox.classList.add('show');
        btn.disabled = true;
        return false;
    }
    function hideError () {
        errorBox.classList.remove('show');
        // espera el fin de la transición para ocultar
        setTimeout(() => {
        if (!errorBox.classList.contains('show')) errorBox.hidden = true;
        }, 300);
    }

    // --- Validación general ---
    function validar () {
        if (!nombre.value.trim())   return showError('Ingresa tu nombre.');
        if (!apellido.value.trim()) return showError('Ingresa tu apellido.');

        const tel = telefono.value.replace(/\s|-/g, '');
        if (!reTelefonoCO.test(tel)) return showError('Ingresa un celular colombiano válido (10 dígitos, inicia en 3).');

        const dt = validaFechaHora();
        if (!dt.ok) return showError(dt.msg);

        const nInv = Number(invitados.value);
        if (!Number.isInteger(nInv) || nInv < 1 || nInv > 6)
        return showError('El número de invitados debe ser entre 1 y 6.');

        hideError();
        btn.disabled = false;
        return true;
    }

    // --- Eventos de validación en vivo ---
    ['input','change','blur'].forEach(evt => {
        nombre.addEventListener(evt, validar);
        apellido.addEventListener(evt, validar);
        telefono.addEventListener(evt, validar);
        fechaHora.addEventListener(evt, validar);
        invitados.addEventListener(evt, validar);
    });

    // --- Flatpickr (opcional) ---
    if (window.flatpickr) {
        const fp = flatpickr(fechaHora, {
        locale: 'es',
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        time_24hr: true,
        minuteIncrement: 15,
        minDate: 'today',
        onReady: setLimits,
        onOpen: setLimits,
        onValueUpdate: enforceLimits
        });
        function setLimits(_, __, instance) {
        instance.set('minTime', '08:00');
        instance.set('maxTime', '18:00');
        }
        function enforceLimits(selectedDates) {
        if (selectedDates && selectedDates[0]) {
            const d = selectedDates[0];
            const h = d.getHours(), m = d.getMinutes();
            if (h < 8 || h > 18 || (h === 18 && m > 0)) {
            d.setHours(8, 0, 0, 0);
            fp.setDate(d, true);
            }
        }
        fechaHora.dispatchEvent(new Event('input', { bubbles: true }));
        }
    } else {
        // Si no usas flatpickr, al menos fija el min del input nativo
        setMinDateTime();
    }

    // --- Envío (sin recargar) + guardar en localStorage como lista ---
    form.addEventListener('submit', (e) => {
        e.preventDefault(); // evita reload
        if (!validar()) return;

        const data = {
        id: crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        nombre: nombre.value.trim(),
        apellido: apellido.value.trim(),
        telefono: telefono.value.trim(),
        fechaHora: fechaHora.value.trim(),
        invitados: Number(invitados.value),
        createdAt: new Date().toISOString()
        };

        const reservas = loadReservas();
        reservas.push(data);
        saveReservas(reservas);

        if (window.Swal) {
        Swal.fire({
            icon: 'success',
            title: '¡Reserva agendada!',
            text: `Te esperamos el ${data.fechaHora}`,
            timer: 2000,
            showConfirmButton: false
        });
        } else {
        alert('¡Reserva guardada con éxito!');
        }

        form.reset();
        btn.disabled = true;   // vuelve a desactivar hasta que pase validación
        validar();             // fuerza chequeo de nuevo estado
    });

    // --- Inicial ---
    validar();
})();
