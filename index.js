// ==========================================
// 1. TEMA
// ==========================================
const btnTema = document.getElementById('toggle-theme');

if (localStorage.getItem('tema') === 'light') {
    document.body.classList.add('light-mode');
}

btnTema.onclick = () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('tema',
        document.body.classList.contains('light-mode') ? 'light' : 'dark'
    );
};


// ==========================================
// 2. ALARME
// ==========================================
const btnAlarme = document.getElementById('toggle-alarm');
let alarmeAtivo = true;

if (localStorage.getItem('alarme') === 'desligado') {
    alarmeAtivo = false;
    btnAlarme.classList.add('desativado');
    btnAlarme.innerText = "🔕 Alarme: DESLIGADO";
}

btnAlarme.onclick = () => {
    alarmeAtivo = !alarmeAtivo;

    btnAlarme.classList.toggle('desativado', !alarmeAtivo);
    btnAlarme.innerText = alarmeAtivo
        ? "🔔 Alarme: LIGADO"
        : "🔕 Alarme: DESLIGADO";

    localStorage.setItem('alarme', alarmeAtivo ? 'ligado' : 'desligado');
};


// ==========================================
// 3. CONFIG
// ==========================================
const tempoServer = 3;
const tempoBrasil = 4;

function formatar(h, m, s) {
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}


// ==========================================
// 🔥 FORMATAÇÃO DIGITAÇÃO
// ==========================================
function formatarInputHora(valor) {
    let h = valor.substring(0, 2);
    let m = valor.substring(2, 4);
    let s = valor.substring(4, 6);

    if (h.length === 2) h = Math.min(parseInt(h), 23).toString().padStart(2, '0');
    if (m.length === 2) m = Math.min(parseInt(m), 59).toString().padStart(2, '0');
    if (s.length === 2) s = Math.min(parseInt(s), 59).toString().padStart(2, '0');

    if (valor.length <= 2) return h;
    if (valor.length <= 4) return `${h}:${m}`;
    return `${h}:${m}:${s}`;
}


// ==========================================
// 🔥 COMPLETAR AO SAIR
// ==========================================
function completarHora(valor) {
    let partes = valor.split(':');

    let h = partes[0] || '00';
    let m = partes[1] || '00';
    let s = partes[2] || '00';

    h = h.padStart(2, '0');
    m = m.padStart(2, '0');
    s = s.padStart(2, '0');

    return `${h}:${m}:${s}`;
}


// ==========================================
// 4. CALCULAR
// ==========================================
function calcular() {
    document.querySelectorAll('tr').forEach(tr => {
        const morteGigante = tr.querySelector('.morteGigante');
        const morteBandido = tr.querySelector('.morteBandido');

        if (!morteGigante || !morteBandido) return;

        const mapa = morteGigante.getAttribute('data-mapa');
        const respGS = tr.querySelector('.respGiganteServer');
        const respGB = tr.querySelector('.respGiganteBR');
        const respBS = tr.querySelector('.respBandidoServer');
        const respBB = tr.querySelector('.respBandidoBR');

        let valorG = morteGigante.value.trim();
        if (valorG) {
            let [h, m, s] = valorG.split(":").map(Number);

            if (isNaN(h)) h = 0;
            if (isNaN(m)) m = 0;
            if (isNaN(s)) s = 0;

            respGS.value = formatar((h + tempoServer) % 24, m, s);
            respGB.value = formatar((h + tempoBrasil) % 24, m, s);

            localStorage.setItem(`morte-${mapa}-Gigante`, valorG);
        } else {
            respGS.value = "";
            respGB.value = "";
            localStorage.removeItem(`morte-${mapa}-Gigante`);
        }

        let valorB = morteBandido.value.trim();
        if (valorB) {
            let [h, m, s] = valorB.split(":").map(Number);

            if (isNaN(h)) h = 0;
            if (isNaN(m)) m = 0;
            if (isNaN(s)) s = 0;

            respBS.value = formatar((h + tempoServer) % 24, m, s);
            respBB.value = formatar((h + tempoBrasil) % 24, m, s);

            localStorage.setItem(`morte-${mapa}-Bandido`, valorB);
        } else {
            respBS.value = "";
            respBB.value = "";
            localStorage.removeItem(`morte-${mapa}-Bandido`);
        }
    });
}


// ==========================================
// 5. CARREGAR
// ==========================================
function carregarDadosSalvos() {
    document.querySelectorAll('tr').forEach(tr => {
        const morteGigante = tr.querySelector('.morteGigante');
        const morteBandido = tr.querySelector('.morteBandido');

        if (!morteGigante || !morteBandido) return;

        const mapa = morteGigante.getAttribute('data-mapa');

        const salvoG = localStorage.getItem(`morte-${mapa}-Gigante`);
        const salvoB = localStorage.getItem(`morte-${mapa}-Bandido`);

        if (salvoG) morteGigante.value = salvoG;
        if (salvoB) morteBandido.value = salvoB;
    });

    calcular();
}


// ==========================================
// 6. SOM
// ==========================================
function tocarBip() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 600;
    gain.gain.value = 0.1;

    osc.start();
    setTimeout(() => osc.stop(), 300);
}


// ==========================================
// 7. RELÓGIO + ALARME
// ==========================================
setInterval(() => {
    const agora = new Date();
    const horario = formatar(
        agora.getHours(),
        agora.getMinutes(),
        agora.getSeconds()
    );

    document.getElementById('relogio').innerText = horario;

    if (!alarmeAtivo) return;

    document.querySelectorAll('tr').forEach(tr => {
        const respGB = tr.querySelector('.respGiganteBR');
        const respBB = tr.querySelector('.respBandidoBR');

        if (!respGB) return;

        const horarios = [respGB.value, respBB.value];

        if (horarios.includes(horario) && horario !== "00:00:00") {
            tr.classList.add('alarme-ativo');
            tocarBip();

            setTimeout(() => {
                tr.classList.remove('alarme-ativo');
            }, 10000);
        }
    });

}, 1000);


// ==========================================
// 8. INPUT INTELIGENTE
// ==========================================
document.querySelectorAll('.morteGigante, .morteBandido').forEach(input => {

    input.addEventListener('input', (e) => {
        let el = e.target;
        let pos = el.selectionStart;

        let numeros = el.value.replace(/\D/g, '').slice(0, 6);
        let formatado = formatarInputHora(numeros);

        el.value = formatado;

        let novaPos = pos;
        if (formatado[pos - 1] === ':') novaPos++;

        el.setSelectionRange(novaPos, novaPos);

        calcular();
    });

    // completar ao sair
    input.addEventListener('blur', (e) => {
        if (e.target.value) {
            e.target.value = completarHora(e.target.value);
            calcular();
        }
    });

    // ENTER sai do campo
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        }
    });

});


// ==========================================
// 9. INIT
// ==========================================
carregarDadosSalvos();