// ==========================================
// 1. TEMA (COM SALVAMENTO NO LOCALSTORAGE)
// ==========================================
const btnTema = document.getElementById('toggle-theme');

if (localStorage.getItem('tema') === 'light') {
    document.body.classList.add('light-mode');
}

btnTema.onclick = () => {
    document.body.classList.toggle('light-mode');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('tema', 'light');
    } else {
        localStorage.setItem('tema', 'dark');
    }
};


// ==========================================
// 2. CONTROLE DE ALARME (LIGAR/DESLIGAR)
// ==========================================
const btnAlarme = document.getElementById('toggle-alarm');
let alarmeAtivo = true; // Por padrão, começa ligado

// Verifica se o usuário já tinha desligado o alarme antes
if (localStorage.getItem('alarme') === 'desligado') {
    alarmeAtivo = false;
    btnAlarme.classList.add('desativado');
    btnAlarme.innerText = "🔕 Alarme: DESLIGADO";
}

btnAlarme.onclick = () => {
    alarmeAtivo = !alarmeAtivo; // Inverte o estado atual
    
    if (alarmeAtivo) {
        btnAlarme.classList.remove('desativado');
        btnAlarme.innerText = "🔔 Alarme: LIGADO";
        localStorage.setItem('alarme', 'ligado');
    } else {
        btnAlarme.classList.add('desativado');
        btnAlarme.innerText = "🔕 Alarme: DESLIGADO";
        localStorage.setItem('alarme', 'desligado');
    }
};


// ==========================================
// 3. CONFIGURAÇÕES E CÁLCULOS ORIGINAIS
// ==========================================
const tempoServer = 3; // +3h
const tempoBrasil = 4; // +4h

function formatar(h, m, s) {
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

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

        // ===== GIGANTE =====
        let valorG = morteGigante.value.trim();
        if (valorG) {
            let [h, m, s] = valorG.split(":").map(Number);
            if (!s) s = 0;

            let serverH = (h + tempoServer) % 24;
            let brasilH = (h + tempoBrasil) % 24;

            respGS.value = formatar(serverH, m, s);
            respGB.value = formatar(brasilH, m, s);

            localStorage.setItem(`morte-${mapa}-Gigante`, valorG);
        } else {
            respGS.value = "";
            respGB.value = "";
            localStorage.removeItem(`morte-${mapa}-Gigante`);
        }

        // ===== BANDIDO =====
        let valorB = morteBandido.value.trim();
        if (valorB) {
            let [h, m, s] = valorB.split(":").map(Number);
            if (!s) s = 0;

            let serverH = (h + tempoServer) % 24;
            let brasilH = (h + tempoBrasil) % 24;

            respBS.value = formatar(serverH, m, s);
            respBB.value = formatar(brasilH, m, s);

            localStorage.setItem(`morte-${mapa}-Bandido`, valorB);
        } else {
            respBS.value = "";
            respBB.value = "";
            localStorage.removeItem(`morte-${mapa}-Bandido`);
        }
    });
}


// ==========================================
// 4. CARREGAR DADOS SALVOS
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
// 5. SISTEMA DE RELÓGIO E ALARME
// ==========================================

function tocarBip() {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    oscillator.type = 'square';
    oscillator.frequency.value = 600;
    gainNode.gain.value = 0.1;

    oscillator.start();
    setTimeout(() => oscillator.stop(), 300);
}

setInterval(() => {
    const agora = new Date();
    const horas = agora.getHours();
    const minutos = agora.getMinutes();
    const segundos = agora.getSeconds();
    
    const horarioAtualFormatado = formatar(horas, minutos, segundos);
    document.getElementById('relogio').innerText = horarioAtualFormatado;

    // SÓ CHECA OS HORÁRIOS SE O ALARME ESTIVER ATIVADO
    if (alarmeAtivo) {
        document.querySelectorAll('tr').forEach(tr => {
            const respGS = tr.querySelector('.respGiganteServer');
            const respGB = tr.querySelector('.respGiganteBR');
            const respBS = tr.querySelector('.respBandidoServer');
            const respBB = tr.querySelector('.respBandidoBR');

            if (!respGS) return; // Pula a linha de cabeçalho

            const horariosDaLinha = [respGS.value, respGB.value, respBS.value, respBB.value];

            if (horariosDaLinha.includes(horarioAtualFormatado) && horarioAtualFormatado !== "00:00:00") {
                tr.classList.add('alarme-ativo');
                tocarBip();

                setTimeout(() => {
                    tr.classList.remove('alarme-ativo');
                }, 10000);
            }
        });
    }
}, 1000);


// ==========================================
// 6. INICIALIZAÇÃO E EVENTOS
// ==========================================
carregarDadosSalvos();

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', calcular);
});