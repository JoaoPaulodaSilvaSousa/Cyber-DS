// ==========================================
// 1. TEMA (BOTÃO ALTERNAR TEMA) - EMOJIS CUSTOMIZADOS
// ==========================================
const btnTema = document.getElementById('toggle-tema');

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
    if (btnAlarme) {
        btnAlarme.classList.add('desativado');
        btnAlarme.innerText = "🔕 Alarme: DESLIGADO";
    }
}

if (btnAlarme) {
    btnAlarme.onclick = () => {
        alarmeAtivo = !alarmeAtivo;

        btnAlarme.classList.toggle('desativado', !alarmeAtivo);
        btnAlarme.innerText = alarmeAtivo
            ? "🔔 Alarme: LIGADO"
            : "🔕 Alarme: DESLIGADO";

        localStorage.setItem('alarme', alarmeAtivo ? 'ligado' : 'desligado');
    };
}


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

const fusoSalvo = localStorage.getItem("fuso") || "America/Sao_Paulo";
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
// 🌍 CALCULAR HORA DO SERVER BASEADO NO FUSO ESCOLHIDO
// ==========================================
function obterHoraServerAtual() {
    const fusoUsuario = fusoSelect ? fusoSelect.dataset.valor : "America/Sao_Paulo";
    const agora = new Date();

    const formatterUsuario = new Intl.DateTimeFormat('en-US', {
        timeZone: fusoUsuario || "America/Sao_Paulo",
        hour: 'numeric', minute: 'numeric', second: 'numeric',
        hour12: false
    });
    const partesUsu = formatterUsuario.formatToParts(agora);
    const hUsu = parseInt(partesUsu.find(p => p.type === 'hour').value) % 24;
    const mUsu = parseInt(partesUsu.find(p => p.type === 'minute').value);
    const sUsu = parseInt(partesUsu.find(p => p.type === 'second').value);

    const formatterServer = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Manaus', 
        hour: 'numeric', hour12: false
    });
    const hServidor = parseInt(formatterServer.format(agora)) % 24;

    return {
        textoFormatado: formatar(hServidor, mUsu, sUsu),
        h: hServidor, m: mUsu, s: sUsu,
        hLocal: hUsu 
    };
}


// ==========================================
// 🌍 FUNÇÕES DE DIFERENÇA DE FUSO
// ==========================================
function obterDiferencaFuso() {
    const fusoUsuario = fusoSelect ? fusoSelect.dataset.valor : "America/Sao_Paulo";
    const agora = new Date();

    const formatterUsu = new Intl.DateTimeFormat('en-US', {
        timeZone: fusoUsuario || "America/Sao_Paulo",
        hour: 'numeric', hour12: false
    });
    const formatterServ = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Manaus',
        hour: 'numeric', hour12: false
    });

    const hUsuarioAgora = parseInt(formatterUsu.format(agora)) % 24;
    const hServerAgora = parseInt(formatterServ.format(agora)) % 24;

    let diferenca = hUsuarioAgora - hServerAgora;
    return diferenca;
}


// =======================================================
// 🌟 4. CALCULAR
// =======================================================
function calcular() {
    const diferencaFuso = obterDiferencaFuso();

    document.querySelectorAll('tr').forEach(tr => {
        const morteGigante = tr.querySelector('.morteGigante');
        const morteBandido = tr.querySelector('.morteBandido');

        if (!morteGigante || !morteBandido) return;

        const respGS = tr.querySelector('.respGiganteServer');
        const respGL = tr.querySelector('.respGiganteLocal');
        const respBS = tr.querySelector('.respBandidoServer');
        const respBL = tr.querySelector('.respBandidoLocal');

        function processarCalculo(valorInput, campoServer, campoLocal, storageKey) {
            let valorNumerico = valorInput.replace(/\D/g, "");

            if (valorNumerico.length === 0) {
                if (campoServer) campoServer.value = "";
                if (campoLocal) campoLocal.value = "";
                localStorage.removeItem(storageKey);
                return;
            }

            let valorCompleto = valorNumerico;
            if (valorNumerico.length === 1) valorCompleto = valorNumerico + "00000";
            else if (valorNumerico.length === 2) valorCompleto = valorNumerico + "0000";
            else if (valorNumerico.length === 3) valorCompleto = valorNumerico.slice(0,2) + "0" + valorNumerico.slice(2) + "00";
            else if (valorNumerico.length === 4) valorCompleto = valorNumerico + "00";
            else if (valorNumerico.length === 5) valorCompleto = valorNumerico.slice(0,4) + "0" + valorNumerico.slice(4);
            else if (valorNumerico.length > 6) valorCompleto = valorNumerico.slice(0, 6);

            let hLocalDigitada = parseInt(valorCompleto.slice(0, 2)) || 0;
            let m = parseInt(valorCompleto.slice(2, 4)) || 0;
            let s = parseInt(valorCompleto.slice(4, 6)) || 0;

            let hServerCalculada = hLocalDigitada - diferencaFuso;
            if (hServerCalculada < 0) hServerCalculada += 24;
            hServerCalculada = hServerCalculada % 24;

            let respawnServerH = (hServerCalculada + tempoServer) % 24;

            let respawnLocalH = respawnServerH + diferencaFuso;
            if (respawnLocalH < 0) respawnLocalH += 24;
            respawnLocalH = respawnLocalH % 24;

            if (campoServer) campoServer.value = formatar(respawnServerH, m, s);
            if (campoLocal) campoLocal.value = formatar(respawnLocalH, m, s);

            if (valorNumerico.length === 6) {
                localStorage.setItem(storageKey, formatar(hLocalDigitada, m, s));
            }
        }

        processarCalculo(morteGigante.value, respGS, respGL, `morte-${morteGigante.dataset.mapa}-Gigante`);
        processarCalculo(morteBandido.value, respBS, respBL, `morte-${morteBandido.dataset.mapa}-Bandido`);
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
let volumeAtual = parseFloat(localStorage.getItem('volumeAlarme')) || 0.1;

function tocarBip(duracaoSegundos = 1) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 600;
    
    gain.gain.value = volumeAtual; 
    
    osc.start();
    setTimeout(() => osc.stop(), duracaoSegundos * 1000);
}


// ==========================================
// 🚀 6.1 CONTROLE DE VOLUME (COM DIGITAÇÃO MANUAL)
// ==========================================
const sliderVolume = document.getElementById('volume-alarme');
const campoVolumeTxt = document.getElementById('valor-volume'); 
const btnVolMenos = document.getElementById('vol-menos');
const btnVolMais = document.getElementById('vol-mais');

function atualizarInterfaceVolume(valor) {
    if (sliderVolume) sliderVolume.value = valor;
    if (campoVolumeTxt) campoVolumeTxt.value = Math.round(valor * 100);
    volumeAtual = valor;
    localStorage.setItem('volumeAlarme', valor);
}

if (sliderVolume && campoVolumeTxt) {
    sliderVolume.value = volumeAtual;
    campoVolumeTxt.value = Math.round(volumeAtual * 100);

    sliderVolume.oninput = (e) => {
        atualizarInterfaceVolume(parseFloat(e.target.value));
    };

    campoVolumeTxt.oninput = (e) => {
        let valorDigitado = parseInt(e.target.value);
        
        if (isNaN(valorDigitado)) return;

        if (valorDigitado > 100) valorDigitado = 100;
        if (valorDigitado < 0) valorDigitado = 0;

        campoVolumeTxt.value = valorDigitado; 
        atualizarInterfaceVolume(valorDigitado / 100);
    };

    if (btnVolMenos) {
        btnVolMenos.onclick = () => {
            let novoVol = Math.max(0, volumeAtual - 0.05); 
            atualizarInterfaceVolume(parseFloat(novoVol.toFixed(2)));
        };
    }

    if (btnVolMais) {
        btnVolMais.onclick = () => {
            let novoVol = Math.min(1, volumeAtual + 0.05); 
            atualizarInterfaceVolume(parseFloat(novoVol.toFixed(2)));
        };
    }
}


// ==========================================
// ⏱️ 6.2 CONTROLE DA DURACAO DO ALARME (Apenas botões - 0.1s)
// ==========================================
const campoDuracao = document.getElementById('duracao-alarme');
const btnDuracaoMenos = document.getElementById('duracao-menos'); 
const btnDuracaoMais = document.getElementById('duracao-mais');   

let duracaoAlarme = parseFloat(localStorage.getItem('duracaoAlarme')) || 10; 

function atualizarInterfaceDuracao(valor) {
    if (campoDuracao) campoDuracao.value = valor.toFixed(1);
    duracaoAlarme = valor;
    localStorage.setItem('duracaoAlarme', valor);
}

if (campoDuracao) {
    campoDuracao.value = duracaoAlarme.toFixed(1);
}

if (btnDuracaoMenos) {
    btnDuracaoMenos.onclick = () => {
        let novaDuracao = Math.max(0.1, duracaoAlarme - 0.1);
        atualizarInterfaceDuracao(parseFloat(novaDuracao.toFixed(1)));
    };
}

if (btnDuracaoMais) {
    btnDuracaoMais.onclick = () => {
        let novaDuracao = Math.min(60, duracaoAlarme + 0.1);
        atualizarInterfaceDuracao(parseFloat(novaDuracao.toFixed(1)));
    };
}


// ==========================================
// 🌟 7. RELÓGIO + ALARME (Loop de 10ms - Sem delay)
// ==========================================
let testeAtivo = false; 
let respawnAtivo = false; 
let ultimosAlarmesDisparados = {}; // Evita disparar som várias vezes no mesmo segundo

// ⏱️ REDUZIDO DE 1000ms PARA 10ms PARA ELIMINAR O DELAY
setInterval(() => {
    const infoTempo = obterHoraServerAtual();
    const horarioLocal = formatar(infoTempo.hLocal, infoTempo.m, infoTempo.s);
    
    const relogioEl = document.getElementById('relogio');
    
    if (relogioEl) {
        relogioEl.innerText = `${horarioLocal} (Server: ${infoTempo.textoFormatado})`;
    }

    document.querySelectorAll('tr').forEach(tr => {
        const morteGigante = tr.querySelector('.morteGigante');
        const morteBandido = tr.querySelector('.morteBandido');
        
        const respGL = tr.querySelector('.respGiganteLocal');
        const respBL = tr.querySelector('.respBandidoLocal');
        
        if (!morteGigante || !morteBandido) return;

        function verificarInicioAlarme(inputElement, chaveUnica, ignorarRecente = false) {
            if (!inputElement.value || inputElement.value === "00:00:00") return false;

            const [hI, mI, sI] = inputElement.value.split(":").map(Number);
            const tempoInputSegundos = hI * 3600 + mI * 60 + sI;
            const tempoAtualSegundos = infoTempo.hLocal * 3600 + infoTempo.m * 60 + infoTempo.s;

            const diferenca = tempoAtualSegundos - tempoInputSegundos;
            
            if (ignorarRecente && diferenca >= 0 && diferenca < 60) {
                return false; 
            }

            // Ativa no segundo zero
            if (diferenca === 0) {
                // Se já disparou este alarme neste exato segundo, não repete (protege o som)
                if (ultimosAlarmesDisparados[chaveUnica] === tempoAtualSegundos) {
                    return false;
                }
                ultimosAlarmesDisparados[chaveUnica] = tempoAtualSegundos;
                return true;
            }
            return false;
        }

        const mapa = morteGigante.getAttribute('data-mapa');

        const comecouMorteG = verificarInicioAlarme(morteGigante, `${mapa}-MG`, true);
        const comecouMorteB = verificarInicioAlarme(morteBandido, `${mapa}-MB`, true);

        const comecouRespG = verificarInicioAlarme(respGL, `${mapa}-RG`);
        const comecouRespB = verificarInicioAlarme(respBL, `${mapa}-RB`);

        if (comecouMorteG || comecouMorteB || comecouRespG || comecouRespB) {
            
            tr.classList.add('alarme-linha');
            
            let celulaAlvo = null;
            if (comecouMorteG || comecouRespG) celulaAlvo = respGL;
            if (comecouMorteB || comecouRespB) celulaAlvo = respBL;

            if (celulaAlvo) celulaAlvo.classList.add('alarme-foco');

            const ehRespawn = comecouRespG || comecouRespB;
            if (ehRespawn) {
                respawnAtivo = true;
                if (alarmeAtivo) {
                    tocarBip(duracaoAlarme); 
                }
            }

            setTimeout(() => {
                tr.classList.remove('alarme-linha');
                if (celulaAlvo) celulaAlvo.classList.remove('alarme-foco');
                
                if (ehRespawn) {
                    respawnAtivo = false;
                }
            }, duracaoAlarme * 1000); 
        }
    });

    if (relogioEl) {
        if (testeAtivo || respawnAtivo) {
            relogioEl.style.borderColor = "#ff5252";
            relogioEl.style.color = "#ff5252";
        } else {
            relogioEl.style.borderColor = "#4CAF50";
            relogioEl.style.color = "#4CAF50";
        }
    }

}, 10); // 10ms = 100 checagens por segundo. Adeus delay!


// ==========================================
// 🚀 7.1 FUNCIONALIDADE DO BOTÃO DE TESTAR ALARME
// ==========================================
const btnTestarAlarm = document.getElementById('testar-alarm');
if (btnTestarAlarm) {
    btnTestarAlarm.onclick = () => {
        tocarBip(duracaoAlarme); 
        
        testeAtivo = true;
        
        setTimeout(() => {
            testeAtivo = false;
        }, duracaoAlarme * 1000); 
    };
}


// ==========================================
// ⌨️ 8. MÁSCARA DE TEMPO (GIGANTE E BANDIDO)
// ==========================================
document.querySelectorAll('.morteGigante, .morteBandido').forEach(input => {
    
    input.addEventListener('input', (e) => {
        let cursorPosition = e.target.selectionStart;
        let valorOriginal = e.target.value;
        let valorNumerico = valorOriginal.replace(/\D/g, ""); 

        if (valorNumerico.length > 6) {
            valorNumerico = valorNumerico.slice(0, 6); 
        }

        let pedacos = [];
        if (valorNumerico.length > 0) pedacos.push(valorNumerico.slice(0, 2));
        if (valorNumerico.length > 2) pedacos.push(valorNumerico.slice(2, 4));
        if (valorNumerico.length > 4) pedacos.push(valorNumerico.slice(4, 6));

        if (pedacos[0] && parseInt(pedacos[0]) > 23) pedacos[0] = "23";
        if (pedacos[1] && parseInt(pedacos[1]) > 59) pedacos[1] = "59";
        if (pedacos[2] && parseInt(pedacos[2]) > 59) pedacos[2] = "59";

        let formatado = pedacos.join(":");
        
        let digitandoNoFim = (cursorPosition >= valorOriginal.length);

        e.target.value = formatado;

        if (digitandoNoFim) {
            let tamanhoFinal = formatado.length;
            e.target.setSelectionRange(tamanhoFinal, tamanhoFinal);
        } else {
            e.target.setSelectionRange(cursorPosition, cursorPosition);
        }

        calcular();
    });

    input.addEventListener('change', (e) => {
        let valorNumerico = e.target.value.replace(/\D/g, "");
        if (valorNumerico.length > 0 && valorNumerico.length < 6) {
            
            let completo = valorNumerico;
            if (valorNumerico.length === 1) completo = valorNumerico + "00000";
            else if (valorNumerico.length === 2) completo = valorNumerico + "0000";
            else if (valorNumerico.length === 3) completo = valorNumerico.slice(0,2) + "0" + valorNumerico.slice(2) + "00";
            else if (valorNumerico.length === 4) completo = valorNumerico + "00";
            else if (valorNumerico.length === 5) completo = valorNumerico.slice(0,4) + "0" + valorNumerico.slice(4);

            let h = parseInt(completo.slice(0, 2));
            let m = parseInt(completo.slice(2, 4));
            let s = parseInt(completo.slice(4, 6));

            e.target.value = formatar(h, m, s);
            calcular();
        }
    });

    input.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            return; 
        }
        
        if (e.key === 'Enter') {
            input.blur(); 
        }
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
// 🚀 BOTÃO MORTE INSTANTÂNEA
// ==========================================
function marcarMorteInstantanea(botao) {
    const container = botao.closest('.container-morto');
    const input = container.querySelector('input');
    
    if (input) {
        const infoTempo = obterHoraServerAtual();
        
        // Atribui o tempo correto local para bater com o fuso do relógio
        input.value = formatar(infoTempo.hLocal, infoTempo.m, infoTempo.s);
        calcular();
    }
}


// ==========================================
// 9. INIT
// ==========================================
carregarDadosSalvos();