// ==========================================
// 1. TEMA (BOTÃO ALTERNAR TEMA) - EMOJIS CUSTOMIZADOS
// ==========================================
const btnTema = document.getElementById('toggle-tema');

// Verifica salvamento e bota os emojis e spans corretos ao carregar
if (localStorage.getItem('tema') === 'light') {
    document.body.classList.add('light-mode');
    if (btnTema) btnTema.innerHTML = "<span>🌗</span> Modo Claro";
} else {
    if (btnTema) btnTema.innerHTML = "<span>🌓</span> Modo Escuro";
}

if (btnTema) {
    btnTema.onclick = () => {
        document.body.classList.toggle('light-mode');

        if (document.body.classList.contains('light-mode')) {
            localStorage.setItem('tema', 'light');
            btnTema.innerHTML = "<span>🌗</span> Modo Claro";
        } else {
            localStorage.setItem('tema', 'dark');
            btnTema.innerHTML = "<span>🌓</span> Modo Escuro";
        }
    };
}


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
// 🌍 FUSO HORÁRIO
// ==========================================
const fusoSelect = document.getElementById("fusoSelect");
const fusoOpcoes = document.getElementById("fusoOpcoes");
const buscarFuso = document.getElementById("buscarFuso");

const fusos = Intl.supportedValuesOf('timeZone');
const listaComPaises = [];

fusos.forEach(f => {
    let nomeExibicao = f.replace("_", " ");
    try {
        const partes = f.split('/');
        const cidade = partes[partes.length - 1].replace("_", " ");
        const interpretador = new Intl.DateTimeFormat('en-US', { timeZone: f, timeZoneName: 'long' });
        const partesData = interpretador.formatToParts(new Date());
        const nomeFusoLongo = partesData.find(p => p.type === 'timeZoneName').value;
        nomeExibicao = `${cidade} (${nomeFusoLongo})`;
    } catch (e) {}
    listaComPaises.push({ valorOriginal: f, textoExibicao: nomeExibicao });
});

let ultimaLetra = "";
let indiceBusca = 0;

function escutarTecladoNoSelect(e) {
    if (e.key.length !== 1) return;
    e.preventDefault();

    const letraAtual = e.key.toLowerCase();
    const todosOsLi = fusoOpcoes.querySelectorAll('li');
    const itensCorrespondentes = [];
    
    todosOsLi.forEach((li, index) => {
        if (li.textContent.trim().toLowerCase().startsWith(letraAtual)) {
            itensCorrespondentes.push({ elemento: li, indexOriginal: index });
        }
    });

    if (itensCorrespondentes.length === 0) return;

    if (letraAtual === ultimaLetra) {
        indiceBusca = (indiceBusca + 1) % itensCorrespondentes.length;
    } else {
        indiceBusca = 0;
        ultimaLetra = letraAtual;
    }

    const itemAlvo = itensCorrespondentes[indiceBusca].elemento;
    itemAlvo.scrollIntoView({ block: 'nearest', behavior: 'smooth' });

    todosOsLi.forEach(item => item.style.backgroundColor = "");
    itemAlvo.style.backgroundColor = "rgba(76, 175, 80, 0.2)";
}

if (fusoSelect) {
    fusoSelect.onclick = (e) => {
        e.stopPropagation();
        fusoOpcoes.classList.toggle('ativo');
        
        if (fusoOpcoes.classList.contains('ativo')) {
            fusoSelect.classList.add('aberto');
            fusoSelect.setAttribute('tabindex', '0');
            fusoSelect.focus();
            fusoSelect.addEventListener('keydown', escutarTecladoNoSelect);
        } else {
            fusoSelect.classList.remove('aberto');
            fusoSelect.removeEventListener('keydown', escutarTecladoNoSelect);
        }
    };
}

document.addEventListener('click', () => {
    if (fusoOpcoes) {
        fusoOpcoes.classList.remove('ativo');
        fusoSelect.classList.remove('aberto');
        fusoSelect.removeEventListener('keydown', escutarTecladoNoSelect);
    }
});

function renderizarOpcoes(lista) {
    if (!fusoOpcoes) return;
    fusoOpcoes.innerHTML = "";
    
    lista.forEach(item => {
        const li = document.createElement("li");
        li.textContent = item.textoExibicao;
        li.dataset.valor = item.valorOriginal;
        
        li.onclick = () => {
            selecionarFuso(item.valorOriginal, item.textoExibicao);
        };
        
        fusoOpcoes.appendChild(li);
    });
}

function selecionarFuso(valor, texto) {
    fusoSelect.innerText = texto;
    fusoSelect.dataset.valor = valor;
    localStorage.setItem("fuso", valor);
    fusoOpcoes.classList.remove('ativo');
    fusoSelect.classList.remove('aberto');
    fusoSelect.removeEventListener('keydown', escutarTecladoNoSelect);
    calcular();
}

const buscaSalva = localStorage.getItem("buscaFuso") || "";
if (buscarFuso) {
    buscarFuso.value = buscaSalva;
}

function aplicarFiltro() {
    const termo = buscarFuso ? buscarFuso.value.toLowerCase() : "";
    const filtrados = listaComPaises.filter(item =>
        item.textoExibicao.toLowerCase().includes(termo) || 
        item.valorOriginal.toLowerCase().includes(termo)
    );
    renderizarOpcoes(filtrados);
}

aplicarFiltro();

const fusoSalvo = localStorage.getItem("fuso") || "";
if (fusoSalvo) {
    const encontrado = listaComPaises.find(p => p.valorOriginal === fusoSalvo);
    if (encontrado) {
        fusoSelect.innerText = encontrado.textoExibicao;
        fusoSelect.dataset.valor = fusoSalvo;
    }
}

if (buscarFuso) {
    buscarFuso.addEventListener("input", () => {
        localStorage.setItem("buscaFuso", buscarFuso.value);
        aplicarFiltro();
        fusoOpcoes.classList.add('ativo');
        fusoSelect.classList.add('aberto');
    });
}


// ==========================================
// 3. CONFIG
// ==========================================
const tempoServer = 3;

function formatar(h, m, s) {
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}


// ==========================================
// 🌍 CONVERTER SERVER → LOCAL
// ==========================================
function converterParaLocal(h, m, s) {
    const fuso = fusoSelect ? fusoSelect.dataset.valor : "America/Sao_Paulo";
    if (!fuso) return { h: 0, m: 0, s: 0 };

    const dataBase = new Date();
    const formatterCompleto = new Intl.DateTimeFormat('en-US', {
        timeZone: fuso,
        hour: 'numeric',
        hour12: false
    });
    
    const horaNoFuso = parseInt(formatterCompleto.format(dataBase));
    const horaNoServer = dataBase.getUTCHours();
    
    let diferencaHoras = horaNoFuso - horaNoServer;
    if (diferencaHoras > 12) diferencaHoras -= 24;
    if (diferencaHoras < -12) diferencaHoras += 24;

    let horaFinal = h + (diferencaHoras + 4);
    if (horaFinal < 0) horaFinal += 24;
    horaFinal = horaFinal % 24;

    return { h: horaFinal, m: m, s: s };
}


// ==========================
// 🔥 FORMATAÇÃO DIGITAÇÃO
// ==========================
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
// 🔥 COMPLETAR
// ==========================================
function completarHora(valor) {
    let partes = valor.split(':');
    let h = partes[0] || '00';
    let m = partes[1] || '00';
    let s = partes[2] || '00';
    return `${h.padStart(2,'0')}:${m.padStart(2,'0')}:${s.padStart(2,'0')}`;
}


// ==========================================
// 🌟 4. CALCULAR
// ==========================================
function calcular() {
    document.querySelectorAll('tr').forEach(tr => {
        const morteGigante = tr.querySelector('.morteGigante');
        const morteBandido = tr.querySelector('.morteBandido');

        if (!morteGigante || !morteBandido) return;

        const respGS = tr.querySelector('.respGiganteServer');
        const respGL = tr.querySelector('.respGiganteLocal');
        const respBS = tr.querySelector('.respBandidoServer');
        const respBL = tr.querySelector('.respBandidoLocal');

        // ===== GIGANTE =====
        let valorG = morteGigante.value.trim();
        if (valorG) {
            let [h, m, s] = valorG.split(":").map(Number);
            if (isNaN(h)) h = 0; if (isNaN(m)) m = 0; if (isNaN(s)) s = 0;

            let respawnServerH = (h + tempoServer) % 24;
            let tempoLocal = converterParaLocal(respawnServerH, m, s);

            if (respGS) respGS.value = formatar(respawnServerH, m, s);
            if (respGL) respGL.value = formatar(tempoLocal.h, tempoLocal.m, tempoLocal.s);

            localStorage.setItem(`morte-${morteGigante.dataset.mapa}-Gigante`, valorG);
        } else {
            if (respGS) respGS.value = "";
            if (respGL) respGL.value = "";
            localStorage.removeItem(`morte-${morteGigante.dataset.mapa}-Gigante`);
        }

        // ===== BANDIDO =====
        let valorB = morteBandido.value.trim();
        if (valorB) {
            let [h, m, s] = valorB.split(":").map(Number);
            if (isNaN(h)) h = 0; if (isNaN(m)) m = 0; if (isNaN(s)) s = 0;

            let respawnServerH = (h + tempoServer) % 24;
            let tempoLocal = converterParaLocal(respawnServerH, m, s);

            if (respBS) respBS.value = formatar(respawnServerH, m, s);
            if (respBL) respBL.value = formatar(tempoLocal.h, tempoLocal.m, tempoLocal.s);

            localStorage.setItem(`morte-${morteBandido.dataset.mapa}-Bandido`, valorB);
        } else {
            if (respBS) respBS.value = "";
            if (respBL) respBL.value = "";
            localStorage.removeItem(`morte-${morteBandido.dataset.mapa}-Bandido`);
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
// 🌟 7. RELÓGIO + ALARME
// ==========================================
setInterval(() => {
    const agora = new Date();
    const horario = formatar(agora.getHours(), agora.getMinutes(), agora.getSeconds());
    
    const relogioEl = document.getElementById('relogio');
    if (relogioEl) relogioEl.innerText = horario;

    document.querySelectorAll('tr').forEach(tr => {
        const respGL = tr.querySelector('.respGiganteLocal');
        const respBL = tr.querySelector('.respBandidoLocal');
        if (!respGL) return;

        let acenderLinha = false;

        if (respGL.value === horario && horario !== "00:00:00" && respGL.value !== "") {
            acenderLinha = true;
            respGL.classList.add('alarme-foco'); 
            setTimeout(() => { respGL.classList.remove('alarme-foco'); }, 10000);
        }

        if (respBL.value === horario && horario !== "00:00:00" && respBL.value !== "") {
            acenderLinha = true;
            respBL.classList.add('alarme-foco'); 
            setTimeout(() => { respBL.classList.remove('alarme-foco'); }, 10000);
        }

        if (acenderLinha) {
            tr.classList.add('alarme-linha');
            if (alarmeAtivo) {
                tocarBip();
            }
            setTimeout(() => { tr.classList.remove('alarme-linha'); }, 10000);
        }
    });
}, 1000);


// ==========================
// 🌟 8. INPUT INTELIGENTE (COM CTRL+Z E CTRL+Y FUNCIONANDO)
// ==========================
document.querySelectorAll('.morteGigante, .morteBandido').forEach(input => {
    
    input.addEventListener('beforeinput', (e) => {
        // Se o usuário apertar Ctrl+Z ou Ctrl+Y, deixamos o navegador agir normalmente!
        if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') {
            return;
        }
    });

    input.addEventListener('input', (e) => {
        // Se a mudança veio de um desfazer/refazer, não forçamos a máscara agressiva
        if (e.inputType === 'historyUndo' || e.inputType === 'historyRedo') {
            calcular();
            return;
        }

        let el = e.target;
        let posicaoCursor = el.selectionStart;
        let valorAntigo = el.value;

        let numeros = el.value.replace(/\D/g, '').slice(0, 6);
        let formatado = formatarInputHora(numeros);
        
        // Só atualiza o valor se ele realmente mudou (evita quebrar o histórico à toa)
        if (el.value !== formatado) {
            el.value = formatado;

            if (valorAntigo.length > formatado.length && valorAntigo[posicaoCursor] === ':') {
                 posicaoCursor--;
            } else if (valorAntigo.length < formatado.length && formatado[posicaoCursor - 1] === ':') {
                 posicaoCursor++;
            }
            el.setSelectionRange(posicaoCursor, posicaoCursor);
        }

        calcular();
    });

    input.addEventListener('blur', (e) => {
        if (e.target.value.trim() !== "") {
            e.target.value = completarHora(e.target.value);
            calcular();
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.target.blur(); }
    });
});


// ==========================================
// 🌟 10. BOTÃO LIMPAR HORÁRIOS
// ==========================================
const btnLimpar = document.getElementById('limpar-dados');
const modalContainer = document.getElementById('modal-container');
const modalConfirmar = document.getElementById('modal-confirmar');
const modalCancelar = document.getElementById('modal-cancelar');

if (btnLimpar && modalContainer) {
    btnLimpar.onclick = () => {
        modalContainer.classList.remove('modal-oculto');
    };

    modalCancelar.onclick = () => {
        modalContainer.classList.add('modal-oculto');
    };

    modalConfirmar.onclick = () => {
        document.querySelectorAll('.morteGigante, .morteBandido, .respGiganteServer, .respGiganteLocal, .respBandidoServer, .respBandidoLocal').forEach(input => {
            input.value = "";
        });

        // Loop inteligente: busca o mapa diretamente pela linha da tabela
        document.querySelectorAll('tr').forEach(tr => {
            const morteGigante = tr.querySelector('.morteGigante');
            if (morteGigante) {
                const mapa = morteGigante.getAttribute('data-mapa');
                localStorage.removeItem(`morte-${mapa}-Gigante`);
                localStorage.removeItem(`morte-${mapa}-Bandido`);
            }
        });

        modalContainer.classList.add('modal-oculto');
    };

    modalContainer.onclick = (e) => {
        if (e.target === modalContainer) {
            modalContainer.classList.add('modal-oculto');
        }
    };
}


// ==========================================
// 9. INIT
// ==========================================
carregarDadosSalvos();