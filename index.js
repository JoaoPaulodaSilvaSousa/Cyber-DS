// ==========================================
// 0. DECLARAÇÕES GLOBAIS INICIAIS
// ==========================================
let volumeAtual = parseFloat(localStorage.getItem('volumeAlarme')) || 0.1;
let ultimoSpawnado = null;
let paginaCarregada = false; // Bloqueio para o Worker não atropelar no início

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
    if (fusoOpcoes) fusoOpcoes.classList.remove('ativo');
    if (fusoSelect) fusoSelect.classList.remove('aberto');
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
// 🌟 6. CALCULAR
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

        const campoTempoG = tr.querySelector('.tempo-restante-gigante');
        const campoTempoB = tr.querySelector('.tempo-restante-bandido');

        function processarCalculo(valorInput, campoServer, campoLocal, storageKey, celulaRegressiva, spawnKey) {
            let valorNumerico = valorInput.replace(/\D/g, "");

            if (valorNumerico.length === 0) {
                if (campoServer && !campoServer.dataset.colado) campoServer.value = "";
                if (campoLocal && !campoLocal.dataset.colado) campoLocal.value = "";
                
                // NOVIDADE: SÓ limpa o localStorage se a página já terminou de ser carregada
                if (paginaCarregada) {
                    localStorage.removeItem(storageKey);
                    localStorage.removeItem(spawnKey); 
                    
                    if (celulaRegressiva) {
                        delete celulaRegressiva.dataset.spawnado;
                        celulaRegressiva.innerText = "--:--:--";
                        celulaRegressiva.style.backgroundColor = ""; 
                        celulaRegressiva.style.color = "";
                        celulaRegressiva.classList.remove('ultimo-spawn');
                    }
                    
                    if (campoLocal) campoLocal.classList.remove('alarme-foco');
                    
                    const tipo = spawnKey.endsWith('-G') ? 'G' : 'B';
                    tr.classList.remove(tipo === 'G' ? 'linha-vermelha-gigante' : 'linha-vermelha-bandido'); 
                    
                    const mapaLocal = morteGigante.getAttribute('data-mapa');
                    localStorage.removeItem(`foco-azul-${spawnKey}`);
                }
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
            let respawnServerH = (hDigitada + 3) % 24;

            let respawnLocalH = respawnServerH + diferencaFuso;
            if (respawnLocalH < 0) respawnLocalH += 24;
            respawnLocalH = respawnLocalH % 24;

            if (campoServer) campoServer.value = formatar(respawnServerH, m, s);
            if (campoLocal) campoLocal.value = formatar(respawnLocalH, m, s);

            let horarioFormatado = formatar(hDigitada, m, s);
            let horarioSalvoNoStorage = localStorage.getItem(storageKey);
            if (valorNumerico.length === 6) {
                if (horarioSalvoNoStorage && horarioSalvoNoStorage !== horarioFormatado) {
                    localStorage.removeItem(spawnKey);
                    localStorage.removeItem(`foco-azul-${spawnKey}`);
                    
                    if (celulaRegressiva) {
                        delete celulaRegressiva.dataset.spawnado;
                        celulaRegressiva.style.backgroundColor = ""; 
                        celulaRegressiva.style.color = "";
                        celulaRegressiva.classList.remove('ultimo-spawn');
                        celulaRegressiva.innerText = "--:--:--";
                    }
                    
                    const tipo = spawnKey.endsWith('-G') ? 'gigante' : 'bandido';
                    tr.classList.remove(`linha-vermelha-${tipo}`);
                    
                    if (campoLocal) campoLocal.classList.remove('alarme-foco'); 
                    
                    const mapaLocal = morteGigante.getAttribute('data-mapa');
                }
                
                localStorage.setItem(storageKey, horarioFormatado);
            }
        }

        const mapa = morteGigante.getAttribute('data-mapa');
        processarCalculo(morteGigante.value, respGS, respGL, `morte-${mapa}-Gigante`, campoTempoG, `spawn-${mapa}-G`);
        processarCalculo(morteBandido.value, respBS, respBL, `morte-${mapa}-Bandido`, campoTempoB, `spawn-${mapa}-B`);
    });
}

// ==========================================
// 7. SISTEMA DE COLAR TEXTO DA IMAGEM
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
               
                        const campoTempoG = tr.querySelector('.tempo-restante-gigante');
                        const campoTempoB = tr.querySelector('.tempo-restante-bandido');

                        if (respGL && horaGigante) {
                            respGL.value = horaGigante;
                            respGL.dataset.colado = "true"; 
                            if (campoTempoG) {
                                delete campoTempoG.dataset.spawnado;
                                localStorage.removeItem(`spawn-${mapaNome}-G`);
                                localStorage.removeItem(`foco-azul-spawn-${mapaNome}-G`);
                                campoTempoG.style.backgroundColor = "";
                                campoTempoG.style.color = "";
                                campoTempoG.classList.remove('ultimo-spawn'); 
                                respGL.classList.remove('alarme-foco'); 
                            }
                        }
                        if (respBL && horaBandido) {
                            respBL.value = horaBandido;
                            respBL.dataset.colado = "true";
                            if (campoTempoB) {
                                delete campoTempoB.dataset.spawnado;
                                localStorage.removeItem(`spawn-${mapaNome}-B`);
                                localStorage.removeItem(`foco-azul-spawn-${mapaNome}-B`);
                                campoTempoB.style.backgroundColor = "";
                                campoTempoB.style.color = "";
                                campoTempoB.classList.remove('ultimo-spawn'); 
                                respBL.classList.remove('alarme-foco'); 
                            }
                        }

                        if (localStorage.getItem(`spawn-${mapaNome}-G`) !== "true" && localStorage.getItem(`spawn-${mapaNome}-B`) !== "true") {
                            // Não usa mais destaque de linha inteira.
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

    // Calcula os tempos iniciais uma vez para preencher a tabela
    calcular();

    // NOVIDADE: Força a estilização visual persistida diretamente do banco local.
    document.querySelectorAll('tr').forEach(tr => {
        const morteGigante = tr.querySelector('.morteGigante');
        if (!morteGigante) return;
        const mapa = morteGigante.getAttribute('data-mapa');
        
        const campoTempoG = tr.querySelector('.tempo-restante-gigante');
        const campoTempoB = tr.querySelector('.tempo-restante-bandido');
        const respGL = tr.querySelector('.respGiganteLocal');
        const respBL = tr.querySelector('.respBandidoLocal');

        if (localStorage.getItem(`spawn-${mapa}-G`) === "true" && campoTempoG) {
            campoTempoG.dataset.spawnado = "true";
            campoTempoG.innerText = "💥 SPAWNOU!";
            tr.classList.add('linha-vermelha-gigante');
        }
        if (localStorage.getItem(`spawn-${mapa}-B`) === "true" && campoTempoB) {
            campoTempoB.dataset.spawnado = "true";
            campoTempoB.innerText = "💥 SPAWNOU!";
            tr.classList.add('linha-vermelha-bandido');
        }
        if (localStorage.getItem(`foco-azul-spawn-${mapa}-G`) === "true" && respGL) {
            respGL.classList.add('alarme-foco');
        }
        if (localStorage.getItem(`foco-azul-spawn-${mapa}-B`) === "true" && respBL) {
            respBL.classList.add('alarme-foco');
        }
    });
}


// ==========================================
// 9. SISTEMA DE AUDIO COM EFEITO VISUAL LIMITADO
// ==========================================
let efeitoVisualTimeout = null;

function removerEfeitoVisualRelogio() {
    const relogioEl = document.getElementById('relogio');
    if (relogioEl) {
        relogioEl.style.borderColor = "#4CAF50";
        relogioEl.style.color = "#4CAF50";
        relogioEl.style.transition = "all 0.3s ease";
    }
    respawnAtivo = false;
}

function aplicarEfeitoVisualRelogio() {
    const relogioEl = document.getElementById('relogio');
    if (relogioEl) {
        relogioEl.style.borderColor = "#ff5252";
        relogioEl.style.color = "#ff5252";
        relogioEl.style.transition = "all 0.1s ease";
    }
    
    // Remover efeito após a duração do alarme
    if (efeitoVisualTimeout) {
        clearTimeout(efeitoVisualTimeout);
    }
    efeitoVisualTimeout = setTimeout(() => {
        removerEfeitoVisualRelogio();
    }, duracaoAlarme * 1000);
}

function tocarBip(duracaoSegundos = 1, tipo = 'default') {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tipo === 'bandido') {
        osc.type = 'sawtooth';
        osc.frequency.value = 480;
    } else if (tipo === 'gigante') {
        osc.type = 'triangle';
        osc.frequency.value = 720;
    } else {
        osc.type = 'square';
        osc.frequency.value = 600;
    }

    const agora = ctx.currentTime;
    gain.gain.setValueAtTime(0, agora);
    gain.gain.linearRampToValueAtTime(volumeAtual, agora + 0.02);
    gain.gain.linearRampToValueAtTime(0, agora + duracaoSegundos - 0.05);
    
    osc.start(agora);
    osc.stop(agora + duracaoSegundos);
    
    // Aplicar efeito visual no relógio
    aplicarEfeitoVisualRelogio();
}

// ==========================================
// 10. CONTROLE DE VOLUME
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
// 11. CONTROLE DA DURACAO DO ALARME
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


// ==========================================================
// 12. RELÓGIO + ALARME + REGRESSIVA (Blindado com Web Worker)
// ==========================================================
let testeAtivo = false;
let respawnAtivo = false; 
let ultimosAlarmesDisparados = {}; 

const workerCode = `
    setInterval(() => {
        postMessage('tick');
    }, 10);
`;

const blob = new Blob([workerCode], { type: 'application/javascript' });
const worker = new Worker(URL.createObjectURL(blob));
worker.onmessage = function() {
    if (!paginaCarregada) return;
    const infoTempo = obterHoraServerAtual();
    const horarioLocal = formatar(infoTempo.hLocal, infoTempo.m, infoTempo.s);
    const horarioServer = infoTempo.textoFormatado; 
    
    const relogioEl = document.getElementById('relogio');
   if (relogioEl) {
        relogioEl.innerText = `${horarioLocal} (Server: ${horarioServer})`;
    }

    const tempoAtualServidorSegundos = infoTempo.h * 3600 + infoTempo.m * 60 + infoTempo.s;
    document.querySelectorAll('tr').forEach(tr => {
        const morteGigante = tr.querySelector('.morteGigante');
        const morteBandido = tr.querySelector('.morteBandido');
        
        const respGS = tr.querySelector('.respGiganteServer');
        const respGL = tr.querySelector('.respGiganteLocal');
        const respBS = tr.querySelector('.respBandidoServer');
        const respBL = tr.querySelector('.respBandidoLocal');

        const campoTempoG = tr.querySelector('.tempo-restante-gigante');
        const campoTempoB = tr.querySelector('.tempo-restante-bandido');
  
        if (!morteGigante || !morteBandido) return;

        const mapa = morteGigante.getAttribute('data-mapa');

        // Não usa mais destaque de linha inteira para o alarme.
        function atualizarLinha(inputHoraRespawn, celulaExibicao, celulaFoco, chaveUnica, spawnKey) {
            if (!celulaExibicao) return;
            
            if (localStorage.getItem(spawnKey) === "true") {
                celulaExibicao.dataset.spawnado = "true";
                celulaExibicao.innerText = "💥 SPAWNOU!";
                if (localStorage.getItem(`foco-azul-${spawnKey}`) === "true" && celulaFoco) {
                    celulaFoco.classList.add('alarme-foco');
                }
                return;
            }

            const horaTexto = inputHoraRespawn ? inputHoraRespawn.value : "";
            if (!horaTexto || horaTexto === "" || horaTexto === "--:--:--" || horaTexto === "HH:MM:SS") {
                celulaExibicao.innerText = "--:--:--";
                return;
            }

            const partes = horaTexto.split(':');
            const hResp = parseInt(partes[0]);
            const mResp = parseInt(partes[1]);
            const sResp = parseInt(partes[2]);
            const tempoRespawnSegundos = hResp * 3600 + mResp * 60 + sResp;
            
            let diferencaSegundos = tempoRespawnSegundos - tempoAtualServidorSegundos;
            if (diferencaSegundos < 0) {
                diferencaSegundos += 24 * 3600;
            }

            if (diferencaSegundos <= 0) { 
                celulaExibicao.dataset.spawnado = "true";
                celulaExibicao.innerText = "💥 SPAWNOU!";
                
                localStorage.setItem(spawnKey, "true"); 

                // Adicionar classe da linha vermelha
                const tipo = spawnKey.endsWith('-G') ? 'gigante' : 'bandido';
                tr.classList.add(`linha-vermelha-${tipo}`);

                if (ultimoSpawnado) {
                    ultimoSpawnado.classList.remove('ultimo-spawn');
                }
                celulaExibicao.classList.add('ultimo-spawn');
                ultimoSpawnado = celulaExibicao;

                const tempoAtualSegundos = infoTempo.hLocal * 3600 + infoTempo.m * 60 + infoTempo.s;
                if (ultimosAlarmesDisparados[chaveUnica] !== tempoAtualSegundos) {
                    ultimosAlarmesDisparados[chaveUnica] = tempoAtualSegundos;
                    
                    if (celulaFoco) {
                        celulaFoco.classList.add('alarme-foco'); 
                        localStorage.setItem(`foco-azul-${spawnKey}`, "true");
                    }

                    if (alarmeAtivo) {
                        respawnAtivo = true;
                        const tipoSom = chaveUnica.endsWith('-G') ? 'gigante' : 'bandido';
                        tocarBip(duracaoAlarme, tipoSom);
                        
                        // Remover após a duração do alarme
                        setTimeout(() => {
                            // Não remover a linha vermelha aqui, deixar fixa até o usuário resetar
                        }, duracaoAlarme * 1000);
                    }
                }
            } else {
                // Remover spawn se o tempo ainda não zerou
                if (localStorage.getItem(spawnKey) === "true") {
                    localStorage.removeItem(spawnKey);
                    localStorage.removeItem(`foco-azul-${spawnKey}`);
                    delete celulaExibicao.dataset.spawnado;
                    celulaExibicao.classList.remove('ultimo-spawn');
                    
                    // Remover classe da linha vermelha
                    const tipo = spawnKey.endsWith('-G') ? 'gigante' : 'bandido';
                    tr.classList.remove(`linha-vermelha-${tipo}`);
                    
                    if (celulaFoco) celulaFoco.classList.remove('alarme-foco');
                }
                
                const hrs = Math.floor(diferencaSegundos / 3600);
                const mins = Math.floor((diferencaSegundos % 3600) / 60);
                const segs = diferencaSegundos % 60;

                celulaExibicao.innerText = formatar(hrs, mins, segs);
            }
        }

        atualizarLinha(respGS, campoTempoG, respGL, `${mapa}-G`, `spawn-${mapa}-G`);
        atualizarLinha(respBS, campoTempoB, respBL, `${mapa}-B`, `spawn-${mapa}-B`);
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
};

// ==========================================
// 13. BOTÃO DE TESTAR ALARME
// ==========================================
const btnTestarAlarm = document.getElementById('testar-alarm');
if (btnTestarAlarm) {
    btnTestarAlarm.onclick = () => {
        tocarBip(duracaoAlarme);
        testeAtivo = true;
        setTimeout(() => { 
            testeAtivo = false;
            removerEfeitoVisualRelogio();
        }, duracaoAlarme * 1000); 
    };
}

// ==========================================
// 14. MÁSCARA DE TEMPO + CTRL + Z (BLINDADO)
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
            
            if (valorNumerico.length === 1) {
                completo = "0" + valorNumerico + "0000";
            } 
            else if (valorNumerico.length === 2) completo = valorNumerico + "0000";
            else if (valorNumerico.length === 3) completo = valorNumerico.slice(0,2) + "0" + valorNumerico.slice(2) + "00";
            else if (valorNumerico.length === 4) completo = valorNumerico + "00";
            else if (valorNumerico.length === 5) completo = valorNumerico.slice(0,4) + "0" + valorNumerico.slice(4);

            let h = parseInt(completo.slice(0, 2));
            let m = parseInt(completo.slice(2, 4));
            let s = parseInt(completo.slice(4, 6));

            if (h > 23) h = 23;
            if (m > 59) m = 59;
            if (s > 59) s = 59;

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
// 15. BOTÃO LIMPAR HORÁRIOS
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
            if (input.value !== undefined) {
                input.value = "";
            } else {
                input.innerText = "--:--:--";
            }
            delete input.dataset.colado;
            input.classList.remove('alarme-foco'); 
        });
        document.querySelectorAll('.tempo-restante-gigante, .tempo-restante-bandido').forEach(celula => {
            celula.innerText = "--:--:--";
            celula.classList.remove('ultimo-spawn'); 
            delete celula.dataset.spawnado;    
        });
        document.querySelectorAll('tr').forEach(tr => {
            const morteGigante = tr.querySelector('.morteGigante');
            if (morteGigante) {
                const mapa = morteGigante.getAttribute('data-mapa');
                localStorage.removeItem(`morte-${mapa}-Gigante`);
                localStorage.removeItem(`morte-${mapa}-Bandido`);
                localStorage.removeItem(`spawn-${mapa}-G`);
                localStorage.removeItem(`spawn-${mapa}-B`);
                localStorage.removeItem(`foco-azul-spawn-${mapa}-G`); 
                localStorage.removeItem(`foco-azul-spawn-${mapa}-B`); 
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
// 16. BOTÃO MORTE INSTANTÂNEA (RESETANDO O SPAWN)
// ==========================================

function marcarMorteInstantanea(tipo, mapa) {
    // Adicione esta linha no inicio da funcao:
    onMortoButtonClicked(`${tipo}-${mapa}`);
    
    // ... resto do codigo existente ...
}

function marcarMorteInstantanea(botao) {
    const container = botao.closest('.container-morto');
    const input = container.querySelector('input');
    const tr = botao.closest('tr');
    
    if (input && tr) {
        const infoTempo = obterHoraServerAtual();
        const mapa = input.getAttribute('data-mapa');
        const tipo = input.classList.contains('morteGigante') ? 'G' : 'B';
        const spawnKey = `spawn-${mapa}-${tipo}`;
        
        localStorage.removeItem(spawnKey);
        localStorage.removeItem(`foco-azul-${spawnKey}`);
        
        const celulaRegressiva = tr.querySelector(tipo === 'G' ? '.tempo-restante-gigante' : '.tempo-restante-bandido');
        if (celulaRegressiva) {
            delete celulaRegressiva.dataset.spawnado;
            celulaRegressiva.classList.remove('ultimo-spawn');
            celulaRegressiva.innerText = "--:--:--";
        }

        const respGL = tr.querySelector('.respGiganteLocal');
        const respBL = tr.querySelector('.respBandidoLocal');
        if (tipo === 'G' && respGL) respGL.classList.remove('alarme-foco');
        if (tipo === 'B' && respBL) respBL.classList.remove('alarme-foco'); 

        const outroTipo = (tipo === 'G') ? 'B' : 'G';
        if (localStorage.getItem(`spawn-${mapa}-${outroTipo}`) !== "true") {
            tr.classList.remove(tipo === 'G' ? 'linha-vermelha-gigante' : 'linha-vermelha-bandido');
        }

        input.value = infoTempo.textoFormatado;
        calcular();
    }
}

// ==========================================
// 18. OCULTAR / EXIBIR TEMPO RESTANTE
// ==========================================
const btnToggleRestante = document.getElementById('toggle-restante');
if (btnToggleRestante) {
    const colunasG = document.querySelectorAll('.tempo-restante-gigante');
    const colunasB = document.querySelectorAll('.tempo-restante-bandido');
    
    const ths = document.querySelectorAll('th');
    let thGigante, thBandido;
    ths.forEach(th => {
        if (th.innerText.includes('RESTANTE GIGANTE')) thGigante = th;
        if (th.innerText.includes('RESTANTE BANDIDO')) thBandido = th;
    });
    const alternarVisibilidade = (elemento, esconder) => {
        if (elemento) {
            elemento.style.display = esconder ? 'none' : '';
        }
    };

    const estadoSalvo = localStorage.getItem('mostrarRestante');
    let deveEsconder = (estadoSalvo === 'oculto');
    if (deveEsconder) {
        alternarVisibilidade(thGigante, true);
        colunasG.forEach(el => alternarVisibilidade(el, true));

        alternarVisibilidade(thBandido, true);
        colunasB.forEach(el => alternarVisibilidade(el, true));

        btnToggleRestante.innerText = " Mostrar Tempo Restante + ";
    } else {
        btnToggleRestante.innerText = "  Ocultar Tempo Restante - ";
    }

    btnToggleRestante.onclick = () => {
        deveEsconder = !deveEsconder;
        alternarVisibilidade(thGigante, deveEsconder);
        colunasG.forEach(el => alternarVisibilidade(el, deveEsconder));

        alternarVisibilidade(thBandido, deveEsconder);
        colunasB.forEach(el => alternarVisibilidade(el, deveEsconder));
        if (deveEsconder) {
            btnToggleRestante.innerText = " Mostrar Tempo Restante + ";
            localStorage.setItem('mostrarRestante', 'oculto');
        } else {
            btnToggleRestante.innerText = "  Ocultar Tempo Restante - ";
            localStorage.setItem('mostrarRestante', 'visivel');
        }
    };
}


// ==========================================
// 18. BOTÕES PARA OCULTAR/EXIBIR COLUNAS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const headerRow = document.querySelector('thead tr');
    if (!headerRow) return;

    const ths = headerRow.querySelectorAll('th');
    let indexGigante = [];
    let indexBandido = [];

    ths.forEach((th, index) => {
        const texto = th.innerText.toUpperCase();
        if (texto.includes('GIGANTE') && texto.includes('RESTANTE')) {
            indexGigante.push(index);
      
        }
        if (texto.includes('BANDIDO') && texto.includes('RESTANTE')) {
            indexBandido.push(index);
        }
    });

    function alternarColuna(indices, visivel) {
        const linhas = document.querySelectorAll('tr');
        linhas.forEach(linha => {
            const celulas = linha.querySelectorAll('th, td');
            indices.forEach(idx => {
                if (celulas[idx]) {
                    if (visivel) {
                        celulas[idx].classList.remove('coluna-oculta');
                    } else {
                        celulas[idx].classList.add('coluna-oculta');
                    }
                }
            });
        });
    }

    const containerBotoes = document.createElement('div');
    containerBotoes.style.margin = "15px 0";
    containerBotoes.style.display = "flex";
    containerBotoes.style.gap = "10px";
    const btnGigante = document.createElement('button');
    btnGigante.innerText = "Ocultar Tempo Gigante";
    btnGigante.style.padding = "8px 12px";
    btnGigante.style.cursor = "pointer";

    const btnBandido = document.createElement('button');
    btnBandido.innerText = "Ocultar Tempo Bandido";
    btnBandido.style.padding = "8px 12px";
    btnBandido.style.cursor = "pointer";

    let giganteVisivel = true;
    let bandidoVisivel = true;
    btnGigante.onclick = () => {
        giganteVisivel = !giganteVisivel;
        alternarColuna(indexGigante, giganteVisivel);
        btnGigante.innerText = giganteVisivel ? "Ocultar Tempo Gigante" : "Exibir Tempo Gigante";
    };
    btnBandido.onclick = () => {
        bandidoVisivel = !bandidoVisivel;
        alternarColuna(indexBandido, bandidoVisivel);
        btnBandido.innerText = bandidoVisivel ? "Ocultar Tempo Bandido" : "Exibir Tempo Bandido";
    };

    containerBotoes.appendChild(btnGigante);
    containerBotoes.appendChild(btnBandido);

    const tabela = document.querySelector('table');
    if (tabela) {
        tabela.parentNode.insertBefore(containerBotoes, tabela);
    }
});

// ==========================================
// CRONÔMETRO MANUAL - SEM RECORDE
// ==========================================
let runTime = 0;
let runInterval = null;
let runActive = false;
let runPaused = false;

// Elementos
const runTimeDisplay = document.getElementById('runTimeDisplay');
const runLabel = document.getElementById('runLabel');
const runStartBtn = document.getElementById('runStartBtn');
const runPauseBtn = document.getElementById('runPauseBtn');
const runStopBtn = document.getElementById('runStopBtn');
const runResetBtn = document.getElementById('runResetBtn');
const runCard = document.querySelector('.run-card');

// Chaves do localStorage para persistência do timer
const STORAGE_RUN_TIME = 'run_tempo_atual';
const STORAGE_RUN_ACTIVE = 'run_estado_ativo';
const STORAGE_RUN_PAUSED = 'run_estado_pausado';

// Carregar estado salvo do timer
function carregarEstadoTimer() {
    const savedTime = localStorage.getItem(STORAGE_RUN_TIME);
    const savedActive = localStorage.getItem(STORAGE_RUN_ACTIVE);
    const savedPaused = localStorage.getItem(STORAGE_RUN_PAUSED);
    
    if (savedTime !== null && savedTime !== '0') {
        runTime = parseInt(savedTime);
        updateDisplay();
    }
    
    if (savedActive === 'true') {
        runActive = true;
        
        if (savedPaused === 'true') {
            runPaused = true;
            if (runPauseBtn) {
                runPauseBtn.textContent = '▶ RETOMAR';
                runPauseBtn.style.background = '#2196F3';
            }
            if (runCard) runCard.classList.remove('run-ativo');
        } else {
            runPaused = false;
            if (runInterval) clearInterval(runInterval);
            runInterval = setInterval(() => {
                if (runActive && !runPaused) {
                    runTime++;
                    updateDisplay();
                    salvarEstadoTimer();
                }
            }, 1000);
            if (runCard) runCard.classList.add('run-ativo');
            if (runPauseBtn) {
                runPauseBtn.textContent = '⏸ PAUSAR';
                runPauseBtn.style.background = '#ff9800';
            }
        }
    }
}

function salvarEstadoTimer() {
    if (runActive) {
        localStorage.setItem(STORAGE_RUN_TIME, runTime);
        localStorage.setItem(STORAGE_RUN_ACTIVE, runActive);
        localStorage.setItem(STORAGE_RUN_PAUSED, runPaused);
    }
}

function limparEstadoTimer() {
    localStorage.removeItem(STORAGE_RUN_TIME);
    localStorage.removeItem(STORAGE_RUN_ACTIVE);
    localStorage.removeItem(STORAGE_RUN_PAUSED);
}

function formatRunTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay() {
    if (runTimeDisplay) runTimeDisplay.textContent = formatRunTime(runTime);
}

function removerFinalizado() {
    if (runTimeDisplay) runTimeDisplay.classList.remove('finalizado');
    if (runLabel) runLabel.classList.remove('finalizado');
    if (runCard) runCard.classList.remove('run-finalizado');
    if (runLabel) runLabel.textContent = 'TEMPO DE ROTA:';
    if (runTimeDisplay) runTimeDisplay.style.fontSize = '42px';
}

function mostrarFinalizado() {
    if (runLabel) {
        runLabel.textContent = '✅ ROTA FINALIZADA:';
        runLabel.classList.add('finalizado');
    }
    if (runTimeDisplay) {
        runTimeDisplay.classList.add('finalizado');
    }
    if (runCard) {
        runCard.classList.add('run-finalizado');
        runCard.classList.remove('run-ativo');
    }
    limparEstadoTimer();
}

function iniciar() {
    if (runActive) return;
    
    removerFinalizado();
    
    runActive = true;
    runPaused = false;
    runTime = 0;
    updateDisplay();
    
    if (runInterval) clearInterval(runInterval);
    runInterval = setInterval(() => {
        if (runActive && !runPaused) {
            runTime++;
            updateDisplay();
            salvarEstadoTimer();
        }
    }, 1000);
    
    if (runCard) runCard.classList.add('run-ativo');
    if (runPauseBtn) {
        runPauseBtn.textContent = '⏸ PAUSAR';
        runPauseBtn.style.background = '#ff9800';
    }
    
    salvarEstadoTimer();
}

function pausarOuRetomar() {
    if (!runActive) return;
    
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
        runPaused = true;
        if (runPauseBtn) {
            runPauseBtn.textContent = '▶ RETOMAR';
            runPauseBtn.style.background = '#2196F3';
        }
        if (runCard) runCard.classList.remove('run-ativo');
    } else {
        runPaused = false;
        runInterval = setInterval(() => {
            if (runActive && !runPaused) {
                runTime++;
                updateDisplay();
                salvarEstadoTimer();
            }
        }, 1000);
        if (runPauseBtn) {
            runPauseBtn.textContent = '⏸ PAUSAR';
            runPauseBtn.style.background = '#ff9800';
        }
        if (runCard) runCard.classList.add('run-ativo');
    }
    salvarEstadoTimer();
}

function parar() {
    if (!runActive) return;
    
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    
    runActive = false;
    runPaused = false;
    
    mostrarFinalizado();
    
    if (runPauseBtn) {
        runPauseBtn.textContent = '⏸ PAUSAR';
        runPauseBtn.style.background = '#ff9800';
    }
}

function resetar() {
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    
    runActive = false;
    runPaused = false;
    runTime = 0;
    updateDisplay();
    
    removerFinalizado();
    
    if (runCard) runCard.classList.remove('run-ativo');
    if (runPauseBtn) {
        runPauseBtn.textContent = '⏸ PAUSAR';
        runPauseBtn.style.background = '#ff9800';
    }
    
    limparEstadoTimer();
}

// Eventos
if (runStartBtn) runStartBtn.onclick = iniciar;
if (runPauseBtn) runPauseBtn.onclick = pausarOuRetomar;
if (runStopBtn) runStopBtn.onclick = parar;
if (runResetBtn) runResetBtn.onclick = resetar;

// Carregar estado salvo ao iniciar
carregarEstadoTimer();

// ==========================================
// 20. INIT (Forçado a rodar só após tudo carregar)
// ==========================================
window.onload = function() {
    carregarDadosSalvos();
    setTimeout(() => {
        paginaCarregada = true;
    }, 100);
};