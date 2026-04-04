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
// 🌍 3. FUSO HORÁRIO (Busca Inteligente e Limpa)
// ==========================================
const fusoSelect = document.getElementById("fusoSelect");
const fusoOpcoes = document.getElementById("fusoOpcoes");
const buscarFuso = document.getElementById("buscarFuso");

if (buscarFuso) {
    buscarFuso.setAttribute('autocomplete', 'off');
}

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

function renderizarOpcoes(lista) {
    if (!fusoOpcoes) return;
    fusoOpcoes.innerHTML = "";
    
    if (lista.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Nenhum fuso encontrado";
        li.style.color = "#888";
        li.style.fontStyle = "italic";
        fusoOpcoes.appendChild(li);
        return;
    }

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
    fusoSelect.innerHTML = `<span>🌍</span> ${texto}`;
    fusoSelect.dataset.valor = valor;
    localStorage.setItem("fuso", valor);
    fecharMenu();
    calcular();
}

function fecharMenu() {
    fusoOpcoes.classList.remove('ativo');
    fusoSelect.classList.remove('aberto');
}

if (fusoSelect) {
    fusoSelect.onclick = (e) => {
        e.stopPropagation();
        
        const termo = buscarFuso ? buscarFuso.value.trim() : "";
        if (termo.length > 0) {
            fusoOpcoes.classList.toggle('ativo');
            fusoSelect.classList.toggle('aberto');
        }
    };
}

document.addEventListener('click', (e) => {
    if (buscarFuso && !buscarFuso.contains(e.target) && fusoOpcoes && !fusoOpcoes.contains(e.target)) {
        fecharMenu();
    }
});

const buscaSalva = localStorage.getItem("buscaFuso") || "";
if (buscarFuso) {
    buscarFuso.value = buscaSalva;
}

function aplicarFiltro() {
    const termo = buscarFuso ? buscarFuso.value.toLowerCase().trim() : "";
    
    if (termo.length === 0) {
        fecharMenu();
        if (fusoOpcoes) fusoOpcoes.innerHTML = "";
        return;
    }

    const filtrados = listaComPaises.filter(item =>
        item.textoExibicao.toLowerCase().includes(termo) || 
        item.valorOriginal.toLowerCase().includes(termo)
    );
    
    renderizarOpcoes(filtrados);
    fusoOpcoes.classList.add('ativo');
    fusoSelect.classList.add('aberto');
}

const fusoSalvo = localStorage.getItem("fuso");
if (fusoSalvo) {
    const encontrado = listaComPaises.find(p => p.valorOriginal === fusoSalvo);
    if (encontrado) {
        fusoSelect.innerHTML = `<span>🌍</span> ${encontrado.textoExibicao}`;
        fusoSelect.dataset.valor = fusoSalvo;
    }
} else {
    fusoSelect.innerHTML = "<span>🌍</span> Selecione sua região";
    fusoSelect.dataset.valor = "";
}

if (buscarFuso) {
    buscarFuso.addEventListener("input", () => {
        localStorage.setItem("buscaFuso", buscarFuso.value);
        aplicarFiltro();
        
        const termoDigitado = buscarFuso.value.toLowerCase().trim();
        if (termoDigitado.length > 0) {
            const correspondenciaPerfeita = listaComPaises.find(item => 
                item.textoExibicao.toLowerCase().includes(termoDigitado) ||
                item.valorOriginal.toLowerCase().includes(termoDigitado)
            );

            if (correspondenciaPerfeita) {
                fusoSelect.innerHTML = `<span>🌍</span> ${correspondenciaPerfeita.textoExibicao}`;
                fusoSelect.dataset.valor = correspondenciaPerfeita.valorOriginal;
                localStorage.setItem("fuso", correspondenciaPerfeita.valorOriginal);
                calcular();
            }
        } else {
            fusoSelect.innerHTML = "<span>🌍</span> Selecione sua região";
            fusoSelect.dataset.valor = "";
            localStorage.removeItem("fuso");
            calcular();
        }
    });
    
    buscarFuso.addEventListener("focus", () => {
        if (buscarFuso.value.trim().length > 0) {
            aplicarFiltro();
        }
    });
}


// ==========================================
// 4. CONFIG
// ==========================================
function formatar(h, m, s) {
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}


// ==========================================
// 🌍 5. CALCULAR HORA DO SERVER
// ==========================================
function obterHoraServerAtual() {
    const fusoUsuario = fusoSelect && fusoSelect.dataset.valor ? fusoSelect.dataset.valor : "America/Sao_Paulo";
    const agora = new Date();

    const formatterUsuario = new Intl.DateTimeFormat('en-US', {
        timeZone: fusoUsuario,
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


function obterDiferencaFuso() {
    const fusoUsuario = fusoSelect && fusoSelect.dataset.valor ? fusoSelect.dataset.valor : "America/Sao_Paulo";
    const agora = new Date();

    const formatterUsu = new Intl.DateTimeFormat('en-US', {
        timeZone: fusoUsuario,
        hour: 'numeric', hour12: false
    });
    const formatterServ = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Manaus',
        hour: 'numeric', hour12: false
    });

    const hUsuarioAgora = parseInt(formatterUsu.format(agora)) % 24;
    const hServerAgora = parseInt(formatterServ.format(agora)) % 24;

    return hUsuarioAgora - hServerAgora;
}


// =======================================================
// 🌟 6. CALCULAR (FIXADO EM EXATAMENTE 3 HORAS NO SERVER)
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
                if (campoServer && !campoServer.dataset.colado) campoServer.value = "";
                if (campoLocal && !campoLocal.dataset.colado) campoLocal.value = "";
                localStorage.removeItem(storageKey);
                return;
            }

            if (campoLocal && campoLocal.dataset.colado) return;

            let valorCompleto = valorNumerico;
            if (valorNumerico.length === 1) valorCompleto = valorNumerico + "00000";
            else if (valorNumerico.length === 2) valorCompleto = valorNumerico + "0000";
            else if (valorNumerico.length === 3) valorCompleto = valorNumerico.slice(0,2) + "0" + valorNumerico.slice(2) + "00";
            else if (valorNumerico.length === 4) valorCompleto = valorNumerico + "00";
            else if (valorNumerico.length === 5) valorCompleto = valorNumerico.slice(0,4) + "0" + valorNumerico.slice(4);
            else if (valorNumerico.length > 6) valorCompleto = valorNumerico.slice(0, 6);

            let hDigitada = parseInt(valorCompleto.slice(0, 2)) || 0;
            let m = parseInt(valorCompleto.slice(2, 4)) || 0;
            let s = parseInt(valorCompleto.slice(4, 6)) || 0;

            // 1. O jogo SEMPRE soma 3 horas no Server em relação ao que você digitou
            let respawnServerH = (hDigitada + 3) % 24;

            // 2. A hora local apenas pega esse resultado do Server e soma o fuso do usuário
            let respawnLocalH = respawnServerH + diferencaFuso;
            if (respawnLocalH < 0) respawnLocalH += 24;
            respawnLocalH = respawnLocalH % 24;

            if (campoServer) campoServer.value = formatar(respawnServerH, m, s);
            if (campoLocal) campoLocal.value = formatar(respawnLocalH, m, s);

            if (valorNumerico.length === 6) {
                localStorage.setItem(storageKey, formatar(hDigitada, m, s));
            }
        }

        processarCalculo(morteGigante.value, respGS, respGL, `morte-${morteGigante.dataset.mapa}-Gigante`);
        processarCalculo(morteBandido.value, respBS, respBL, `morte-${morteBandido.dataset.mapa}-Bandido`);
    });
}


// ==========================================
// 🚀 7. SISTEMA DE COLAR TEXTO DA IMAGEM
// ==========================================
const campoColar = document.getElementById('campo-colar');
if (campoColar) {
    campoColar.addEventListener('input', (e) => {
        const texto = e.target.value.trim();
        if (!texto) return;

        const linhas = texto.split('\n');

        linhas.forEach(linha => {
            const regex = /([A-Z]{2})\s+(\d{2}:\d{2}:\d{2})\s+(\d{2}:\d{2}:\d{2})/;
            const match = linha.match(regex);

            if (match) {
                const mapaNome = match[1];      
                const horaGigante = match[2];   
                const horaBandido = match[3];   

                document.querySelectorAll('tr').forEach(tr => {
                    const celulaMapa = tr.querySelector('td:first-child');
                    if (celulaMapa && celulaMapa.innerText.trim() === mapaNome) {
                        const respGL = tr.querySelector('.respGiganteLocal');
                        const respBL = tr.querySelector('.respBandidoLocal');

                        if (respGL && horaGigante) {
                            respGL.value = horaGigante;
                            respGL.dataset.colado = "true"; 
                        }
                        if (respBL && horaBandido) {
                            respBL.value = horaBandido;
                            respBL.dataset.colado = "true";
                        }
                    }
                });
            }
        });

        setTimeout(() => { campoColar.value = ""; }, 1000);
    });
}


// ==========================================
// 8. CARREGAR DADOS SALVOS
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
// 9. SOM
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
// 🚀 10. CONTROLE DE VOLUME
// ==========================================
const sliderVolume = document.getElementById('volume-alarme');
const campoVolumeTxt = document.getElementById('valor-volume'); 
const btnVolMenos = document.getElementById('vol-menos') || document.getElementById('diminuir-vol');
const btnVolMais = document.getElementById('vol-mais') || document.getElementById('aumentar-vol');

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
// ⏱️ 11. CONTROLE DA DURACAO DO ALARME
// ==========================================
const campoDuracao = document.getElementById('duracao-alarme');
const btnDuracaoMenos = document.getElementById('duracao-menos'); 
const btnDuracaoMais = document.getElementById('duracao-mais');   

let duracaoAlarme = parseFloat(localStorage.getItem('duracaoAlarme')) || 1; 

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
// 🌟 12. RELÓGIO + ALARME (Loop de 10ms)
// ==========================================
let testeAtivo = false; 
let respawnAtivo = false; 
let ultimosAlarmesDisparados = {}; 

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

            if (diferenca === 0) {
                if (ultimosAlarmesDisparados[chaveUnica] === tempoAtualSegundos) {
                    return false;
                }
                switch (chaveUnica.split("-")[1]) {
                    case "MG": case "MB": return false; 
                    case "RG": case "RB": return true; 
                }
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

}, 10); 


// ==========================================
// 🚀 13. BOTÃO DE TESTAR ALARME
// ==========================================
const btnTestarAlarm = document.getElementById('testar-alarm');
if (btnTestarAlarm) {
    btnTestarAlarm.onclick = () => {
        tocarBip(duracaoAlarme); 
        testeAtivo = true;
        setTimeout(() => { testeAtivo = false; }, duracaoAlarme * 1000); 
    };
}


// ==========================================
// ⌨️ 14. MÁSCARA DE TEMPO + CTRL + Z (BLINDADO)
// ==========================================
const historicoCampos = {};

document.querySelectorAll('.morteGigante, .morteBandido').forEach(input => {
    const idCampo = input.dataset.mapa + "-" + (input.classList.contains('morteGigante') ? 'G' : 'B');
    historicoCampos[idCampo] = [];

    input.addEventListener('focus', () => {
        if (historicoCampos[idCampo].length === 0) {
            historicoCampos[idCampo].push(input.value);
        }
    });

    input.addEventListener('input', (e) => {
        if (e.detail && e.detail.isUndo) return;

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

        if (pedacos[0] && pedacos[0].length === 2 && parseInt(pedacos[0]) > 23) pedacos[0] = "23";
        if (pedacos[1] && pedacos[1].length === 2 && parseInt(pedacos[1]) > 59) pedacos[1] = "59";
        if (pedacos[2] && pedacos[2].length === 2 && parseInt(pedacos[2]) > 59) pedacos[2] = "59";

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

    input.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            const pilha = historicoCampos[idCampo];
            if (pilha.length > 1) { 
                e.preventDefault();
                
                pilha.pop(); 
                const valorAnterior = pilha[pilha.length - 1]; 
                
                input.value = valorAnterior;
                
                input.dispatchEvent(new CustomEvent('input', { detail: { isUndo: true } }));
                calcular();
            }
            return;
        }

        if (e.key === 'Enter') {
            input.blur(); 
        }
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

        const pilha = historicoCampos[idCampo];
        if (pilha[pilha.length - 1] !== e.target.value) {
            pilha.push(e.target.value);
            if (pilha.length > 10) pilha.shift();
        }
    });
});


// ==========================================
// 🌟 15. BOTÃO LIMPAR HORÁRIOS (Atualizado)
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
            delete input.dataset.colado;
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
        
        calcular();
    };

    modalContainer.onclick = (e) => {
        if (e.target === modalContainer) {
            modalContainer.classList.add('modal-oculto');
        }
    };
}


// ==========================================
// 🚀 16. BOTÃO MORTE INSTANTÂNEA (CORRIGIDO)
// ==========================================
function marcarMorteInstantanea(botao) {
    const container = botao.closest('.container-morto');
    const input = container.querySelector('input');
    
    if (input) {
        const infoTempo = obterHoraServerAtual();
        input.value = infoTempo.textoFormatado;
        calcular();
    }
}


// ==========================================
// 17. INIT
// ==========================================
carregarDadosSalvos();