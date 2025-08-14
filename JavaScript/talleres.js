// talleres.js — modal + validación + guardado en localStorage (Talleres/{tallerTitulo}/[inscripciones])
(function () {
    // Selectores
    const openers = document.querySelectorAll('.icon-box');   // botón "Inscríbirme"
    const modal   = document.getElementById('tallerModal');
    const dialog  = modal?.querySelector('.t-dialog');
    const closes  = modal?.querySelectorAll('[data-close]');
    const form    = document.getElementById('tallerForm');
    const nombre  = document.getElementById('tNombre');
    const apellido= document.getElementById('tApellido');
    const telefono= document.getElementById('tTelefono');
    const email   = document.getElementById('tEmail');
    const enviar  = document.getElementById('tEnviar');
    const errorBox= document.getElementById('tFormError');

    // Regex
    const reTelefonoCO = /^(\+?57\s*)?3\d{9}$/;        // +57 opcional, 10 dígitos iniciando en 3
    const reEmail      = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // email básico

    // Para saber a qué taller pertenece la inscripción actual
    let tallerActual = '';

    // Abrir modal (detecta el título del taller desde la card)
    function openModal(e){
        if (!modal) return;

        // Encuentra la card del taller y toma su título (".text .h3")
        const card = e.currentTarget.closest('.cardTaller');
        const titulo = card?.querySelector('.text .h3')?.textContent?.trim();
        tallerActual = titulo || 'Taller sin título';

        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        if (nombre) nombre.focus();
        hideError();
        if (enviar) enviar.disabled = true;
        form?.reset();
    }

    // Cerrar modal
    function closeModal(){
        if (!modal) return;
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
        hideError();
    }

    // Mostrar/Hover error
    function showError(msg){
        if (!errorBox) return;
        errorBox.textContent = msg;
        errorBox.hidden = false;
        // forzar reflow para animación
        // eslint-disable-next-line no-unused-expressions
        errorBox.offsetHeight;
        errorBox.classList.add('show');
        if (enviar) enviar.disabled = true;
    }

    function hideError(){
        if (!errorBox) return;
        errorBox.classList.remove('show');
        setTimeout(() => {
        if(!errorBox.classList.contains('show')) errorBox.hidden = true;
        }, 250);
    }

    function validar(){
        if (!nombre?.value.trim())   { showError('Ingresa tu nombre.'); return false; }
        if (!apellido?.value.trim()) { showError('Ingresa tu apellido.'); return false; }

        const tel = (telefono?.value || '').replace(/\s|-/g,'');
        if (!reTelefonoCO.test(tel)) { showError('Ingresa un celular colombiano válido (10 dígitos, inicia en 3).'); return false; }

        const em = (email?.value || '').trim();
        if (!reEmail.test(em))       { showError('Ingresa un correo electrónico válido.'); return false; }

        hideError();
        if (enviar) enviar.disabled = false;
        return true;
    }

    // Guardar en localStorage: { Talleres: { "Nombre del Taller": [ {datos...}, ... ] } }
    function guardarInscripcion(data){
        try {
        const key = 'Talleres';
        const store = JSON.parse(localStorage.getItem(key) || '{}');

        if (!store[tallerActual]) {
            store[tallerActual] = [];
        }
        store[tallerActual].push({
            ...data,
            taller: tallerActual,
            createdAt: new Date().toISOString()
        });

        localStorage.setItem(key, JSON.stringify(store));
        } catch (err) {
        console.error('Error guardando en localStorage:', err);
        }
    }

    // Listeners para abrir
    openers.forEach(op => op.addEventListener('click', openModal));

    // Listeners para cerrar (X y overlay)
    closes?.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    }));
    modal?.addEventListener('click', (e) => {
        if (e.target instanceof Element && e.target.dataset.close === 'true') {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal?.classList.contains('show')) closeModal();
    });

    // Validación en vivo
    ['input','change','blur'].forEach(evt => {
        nombre?.addEventListener(evt, validar);
        apellido?.addEventListener(evt, validar);
        telefono?.addEventListener(evt, validar);
        email?.addEventListener(evt, validar);
    });

    // Submit
    form?.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!validar()) return;

        const payload = {
        nombre:   nombre.value.trim(),
        apellido: apellido.value.trim(),
        telefono: telefono.value.trim(),
        email:    email.value.trim()
        };

        guardarInscripcion(payload);
        closeModal();

        if (window.Swal) {
        Swal.fire({
            icon: 'success',
            title: '¡Inscripción enviada!',
            text: `Quedaste inscrito(a) en "${tallerActual}". Te contactaremos pronto.`,
            timer: 1800,
            showConfirmButton: false
        });
        }
    });

    // Estado inicial
    validar();
})();
