 // ==========================================
// DESBLOQUEAR ÁUDIO NO PRIMEIRO TOQUE/CLIQUE
// ==========================================
let audioDesbloqueado = false;

function desbloquearAudio() {
    if (audioDesbloqueado) return;
    
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    
    if (ctx.state === 'suspended') {
        ctx.resume();
    }
    
    audioDesbloqueado = true;
    console.log('Áudio desbloqueado!');
}

// Desbloqueia no primeiro clique em qualquer lugar
document.body.addEventListener('click', desbloquearAudio, { once: true });
document.body.addEventListener('touchstart', desbloquearAudio, { once: true });

// Tenta desbloquear também no load
window.addEventListener('load', () => {
    setTimeout(() => {
        if (!audioDesbloqueado) {
            console.log('Aguardando clique do usuário para ativar som...');
        }
    }, 1000);
});

// ==========================================
// 0. DECLARAÇÕES GLOBAIS INICIAIS
// ==========================================
let volumeAtual = parseFloat(localStorage.getItem('volumeAlarme')) || 0.1;
let ultimoSpawnado = null;
let paginaCarregada = false; // Bloqueio para o Worker não atropelar no início

// ==========================================
// TIMER PARA SPAWNOU (HÁ QUANTO TEMPO SPAWNOU)
// ==========================================

let timersSpawn = {};

function iniciarTimerSpawn(celula, mapa, tipo) {
    const chave = `${mapa}-${tipo}`;
    
    // Se já existe um timer rodando, não cria outro
    if (timersSpawn[chave]) return;
    
    // Verifica se já tem um horário de spawn salvo (chave ÚNICA por mapa/tipo)
    const spawnTimeKey = `spawn_start_${chave}`;
    let dataSpawn = localStorage.getItem(spawnTimeKey);
    
    if (!dataSpawn) {
        // Primeira vez: salva o horário atual
        dataSpawn = new Date();
        localStorage.setItem(spawnTimeKey, dataSpawn.toISOString());
    } else {
        dataSpawn = new Date(dataSpawn);
        // Se a data for inválida, recria
        if (isNaN(dataSpawn.getTime())) {
            console.log(`Data inválida para ${chave}, recriando...`);
            dataSpawn = new Date();
            localStorage.setItem(spawnTimeKey, dataSpawn.toISOString());
        }
    }
    
    // Limpa a célula e cria os elementos
    celula.innerHTML = '';
    
    const spawnText = document.createElement('div');
    spawnText.textContent = '💥 SPAWNOU!';
    spawnText.style.fontWeight = 'bold';
    spawnText.style.fontSize = '13px';
    spawnText.style.color = '#ff5252';
    spawnText.style.textAlign = 'center';
    celula.appendChild(spawnText);
    
    const timerSpan = document.createElement('div');
    timerSpan.className = 'spawn-timer';
    celula.appendChild(timerSpan);
    
    // Função que atualiza o timer
    const atualizarTimer = () => {
        const agora = new Date();
        const diferencaMs = agora - dataSpawn;
        
        // Garante que não fique negativo
        let segundosTotal = Math.max(0, Math.floor(diferencaMs / 1000));
        
        const horas = Math.floor(segundosTotal / 3600);
        const minutos = Math.floor((segundosTotal % 3600) / 60);
        const segundos = segundosTotal % 60;
        const texto = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
        timerSpan.textContent = `⏱️ HÁ ${texto}`;
    };
    
    // Atualiza imediatamente e cria o intervalo
    atualizarTimer();
    timersSpawn[chave] = setInterval(atualizarTimer, 1000);
}

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
// 7. SISTEMA DE COLAR TEXTO - COMPLETO E FUNCIONAL
// ==========================================

// Definir as variáveis
const campoColar = document.getElementById('campo-colar');
const btnColarTexto = document.getElementById('btnColarTexto');

// Função para converter hora com AM/PM para 24h
function converterHoraPara24h(horaStr) {
    if (!horaStr) return horaStr;
    let horaLimpa = horaStr.trim().toLowerCase();
    const temPM = /p\s*\.?\s*m\s*\.?/.test(horaLimpa);
    const temAM = /a\s*\.?\s*m\s*\.?/.test(horaLimpa);
    const match = horaLimpa.match(/(\d{1,2}):(\d{2}):(\d{2})/);
    if (!match) return horaStr;
    let hora = parseInt(match[1]);
    const minuto = match[2];
    const segundo = match[3];
    if (temPM && hora < 12) hora += 12;
    if (temAM && hora === 12) hora = 0;
    return `${String(hora).padStart(2, '0')}:${minuto}:${segundo}`;
}

// Função para limpar palavras indesejadas (Editada, Edit, Edited, etc.)
function limparTextoMapa(texto) {
    if (!texto) return texto;
    return texto.replace(/\s+(Editada|Editado|Edited|Edit|edit|editar|modificado|alterado)\s+/gi, ' ').trim();
}

// Mapeamento de mapas
const mapaMapping = {
    'GF': 'GF', 'GOLDFIELDS': 'GF', 'GOLD FIELDS': 'GF', 'GOLD': 'GF',
    'MW': 'MW', 'MOKON WOODS': 'MW', 'MOKONWOODS': 'MW', 'MOKON': 'MW', 'WOODS': 'MW', 'MK': 'MW',
    'GV': 'GV', 'GREEN VOLCANO': 'GV', 'GREENVOLCANO': 'GV', 'GREEN': 'GV', 'VOLCANO': 'GV',
    'CCV': 'CCV', 'CV': 'CCV',
    'MM': 'MM', 'MAUJAK MOUNTAINS': 'MM', 'MAUJAKMOUNTAINS': 'MM', 'MAUJAK': 'MM', 'MOUNTAINS': 'MM', 'MJ': 'MM'
};

function normalizarMapa(nome) {
    if (!nome) return null;
    let nomeLimpo = nome.trim().toUpperCase();
    if (mapaMapping[nomeLimpo]) return mapaMapping[nomeLimpo];
    nomeLimpo = nomeLimpo.replace(/[^A-Z0-9]/g, '');
    if (mapaMapping[nomeLimpo]) return mapaMapping[nomeLimpo];
    return null;
}



function extrairDados(linha) {
    let linhaLimpa = linha.replace(/\s+/g, ' ').trim();

    // ==========================================
// REGRA PARA TABELA: "18:19 | mm | selvagem" (hora | mapa | tipo)
// ==========================================
let tabelaPipeMatch = linhaLimpa.match(/^(\d{1,2}:\d{2})\s*\|\s*(mm|ccv|gv|mw|gf|MM|CCV|GV|MW|GF)\s*\|\s*(selvagem|bandido)/i);
if (tabelaPipeMatch) {
    let hora = tabelaPipeMatch[1];
    let mapaAbrev = tabelaPipeMatch[2].toLowerCase();
    let tipo = tabelaPipeMatch[3].toLowerCase();
    
    // Mapeamento de mapas
    const mapaAbreviado = { 
        'mm': 'MM', 'ccv': 'CCV', 'gv': 'GV', 
        'mw': 'MW', 'gf': 'GF', 'mk': 'MW' 
    };
    const mapa = mapaAbreviado[mapaAbrev] || mapaAbrev.toUpperCase();
    
    // Adiciona segundos ":00" se não tiver
    let horaCompleta = `${hora}:00`;
    horaCompleta = converterHoraPara24h(horaCompleta);
    
    console.log(`🎯 REGRA TABELA PIPE: ${horaCompleta} ${mapa} ${tipo}`);
    
    if (tipo === 'selvagem') {
        return {
            mapa: mapa,
            horaGigante: horaCompleta,
            horaBandido: null
        };
    } else { // bandido
        return {
            mapa: mapa,
            horaGigante: null,
            horaBandido: horaCompleta
        };
    }
}

    // ==========================================
// NOVA REGRA: "15:19 mm selvagem" (hora + mapa + tipo em português)
// ==========================================
let horaMapaTipoMatch = linhaLimpa.match(/^(\d{1,2}:\d{2})\s+(mm|ccv|gv|mw|gf|MM|CCV|GV|MW|GF)\s+(selvagem|bandido)/i);
if (horaMapaTipoMatch) {
    let hora = horaMapaTipoMatch[1];
    let mapaAbrev = horaMapaTipoMatch[2].toLowerCase();
    let tipo = horaMapaTipoMatch[3].toLowerCase();
    
    // Mapeamento de mapas
    const mapaAbreviado = { 
        'mm': 'MM', 'ccv': 'CCV', 'gv': 'GV', 
        'mw': 'MW', 'gf': 'GF', 'mk': 'MW' 
    };
    const mapa = mapaAbreviado[mapaAbrev] || mapaAbrev.toUpperCase();
    
    // Adiciona segundos ":00" se não tiver
    let horaCompleta = hora.includes(':') ? `${hora}:00` : `${hora}:00:00`;
    horaCompleta = converterHoraPara24h(horaCompleta);
    
    console.log(`🎯 REGRA HORA+MAPA+TIPO: ${horaCompleta} ${mapa} ${tipo}`);
    
    if (tipo === 'selvagem') {
        return {
            mapa: mapa,
            horaGigante: horaCompleta,
            horaBandido: null
        };
    } else { // bandido
        return {
            mapa: mapa,
            horaGigante: null,
            horaBandido: horaCompleta
        };
    }
}

    // ==========================================
// REGRA PARA: n mm 19:01 (letra + mapa + hora)
// ==========================================
let letraMapaHoraMatch = linhaLimpa.match(/^([nb])\s+(mm|ccv|gv|mk|gf)\s+(\d{1,2}:\d{2})(?::(\d{2}))?$/i);
if (letraMapaHoraMatch) {
    const letra = letraMapaHoraMatch[1].toLowerCase();
    const mapaAbrev = letraMapaHoraMatch[2].toLowerCase();
    // Já existe, mas garantir que 'cvv' está em todos os lugares
const mapaAbreviado = { 
    'mm': 'MM', 
    'ccv': 'CCV', 
    'cvv': 'CCV',  // ← JÁ TEM, mas garantir
    'gv': 'GV', 
    'mk': 'MW', 
    'gf': 'GF' 
};
    const mapa = mapaAbreviado[mapaAbrev];
    let hora = letraMapaHoraMatch[3];
    let segundos = letraMapaHoraMatch[4] || "00";
    let horaCompleta = converterHoraPara24h(`${hora}:${segundos}`);
    
    if (letra === 'n') {
        return {
            mapa: mapa,
            horaGigante: horaCompleta,
            horaBandido: null
        };
    } else {
        return {
            mapa: mapa,
            horaGigante: null,
            horaBandido: horaCompleta
        };
    }
}

// ==========================================
// REGRA PARA: MW n 19:49 (mapa completo + letra + hora)
// ==========================================
let mapaCompletoLetraMatch = linhaLimpa.match(/^(MM|CCV|GV|MW|GF)\s+([nb])\s+(\d{1,2}:\d{2})(?::(\d{2}))?$/i);
if (mapaCompletoLetraMatch) {
    const mapa = mapaCompletoLetraMatch[1].toUpperCase();
    const letra = mapaCompletoLetraMatch[2].toLowerCase();
    let hora = mapaCompletoLetraMatch[3];
    let segundos = mapaCompletoLetraMatch[4] || "00";
    let horaCompleta = converterHoraPara24h(`${hora}:${segundos}`);
    
    if (letra === 'n') {
        return {
            mapa: mapa,
            horaGigante: horaCompleta,
            horaBandido: null
        };
    } else {
        return {
            mapa: mapa,
            horaGigante: null,
            horaBandido: horaCompleta
        };
    }
}

// ==========================================
// REGRA PARA: gf b 20:07 (mapa abreviado + letra + hora)
// ==========================================
let mapaAbrevLetraMatch = linhaLimpa.match(/^(gf|mm|ccv|gv|mk)\s+([nb])\s+(\d{1,2}:\d{2})(?::(\d{2}))?$/i);
if (mapaAbrevLetraMatch) {
    const mapaAbrev = mapaAbrevLetraMatch[1].toLowerCase();
    const letra = mapaAbrevLetraMatch[2].toLowerCase();
    const mapaAbreviado = { 'mm': 'MM', 'ccv': 'CCV', 'gv': 'GV', 'mk': 'MW', 'gf': 'GF' };
    const mapa = mapaAbreviado[mapaAbrev];
    let hora = mapaAbrevLetraMatch[3];
    let segundos = mapaAbrevLetraMatch[4] || "00";
    let horaCompleta = converterHoraPara24h(`${hora}:${segundos}`);
    
    if (letra === 'n') {
        return {
            mapa: mapa,
            horaGigante: horaCompleta,
            horaBandido: null
        };
    } else {
        return {
            mapa: mapa,
            horaGigante: null,
            horaBandido: horaCompleta
        };
    }
}

    // ==========================================
// REGRA PARA: MM bandido 12:46 selvagem 12:49
// ==========================================
let mapaHorasMatch2 = linhaLimpa.match(/^(MM|CCV|GV|MW|GF)\s+bandido\s+(\d{1,2}:\d{2})\s+selvagem\s+(\d{1,2}:\d{2})/i);
if (mapaHorasMatch2) {
    let horaBandido = mapaHorasMatch2[2];
    let horaGigante = mapaHorasMatch2[3];
    let segundosBandido = "00";
    let segundosGigante = "00";
    
    if (!horaBandido.includes(':')) horaBandido = `${horaBandido}:00`;
    if (!horaGigante.includes(':')) horaGigante = `${horaGigante}:00`;
    
    return {
        mapa: normalizarMapa(mapaHorasMatch2[1]),
        horaGigante: converterHoraPara24h(horaGigante + ':00'),
        horaBandido: converterHoraPara24h(horaBandido + ':00')
    };
}

// ==========================================
// REGRA PARA: MM bandido 12:46 selvagem 12:49
// OU: CCV selvagem 12:56 bandido 13:02
// ==========================================

// Tenta pegar bandido primeiro, depois selvagem
let mapaHorasBandidoSelvagem = linhaLimpa.match(/^(MM|CCV|GV|MW|GF)\s+bandido\s+(\d{1,2}:\d{2})\s+selvagem\s+(\d{1,2}:\d{2})/i);
if (mapaHorasBandidoSelvagem) {
    let horaBandido = mapaHorasBandidoSelvagem[2];
    let horaGigante = mapaHorasBandidoSelvagem[3];
    return {
        mapa: normalizarMapa(mapaHorasBandidoSelvagem[1]),
        horaGigante: converterHoraPara24h(`${horaGigante}:00`),
        horaBandido: converterHoraPara24h(`${horaBandido}:00`)
    };
}

// Tenta pegar selvagem primeiro, depois bandido
let mapaHorasSelvagemBandido = linhaLimpa.match(/^(MM|CCV|GV|MW|GF)\s+selvagem\s+(\d{1,2}:\d{2})\s+bandido\s+(\d{1,2}:\d{2})/i);
if (mapaHorasSelvagemBandido) {
    let horaGigante = mapaHorasSelvagemBandido[2];
    let horaBandido = mapaHorasSelvagemBandido[3];
    return {
        mapa: normalizarMapa(mapaHorasSelvagemBandido[1]),
        horaGigante: converterHoraPara24h(`${horaGigante}:00`),
        horaBandido: converterHoraPara24h(`${horaBandido}:00`)
    };
}

    // ==========================================
// REGRA PARA FORMATO SEM TEMPO RESTANTE
// Ex: GF 09:02:59 💀 Morto 12:02:59 13:02:59 08:57:18 💀 Morto 11:57:18 12:57:18
// Onde: 1ª hora = Morte Gigante, 4ª hora = Morte Bandido
// ==========================================
let mapaMatchSemTempo = linhaLimpa.match(/^(GF|MW|GV|CCV|MM)/i);
let horasSemTempo = linhaLimpa.match(/\d{1,2}:\d{2}:\d{2}/g);

if (mapaMatchSemTempo && horasSemTempo && horasSemTempo.length >= 4) {
    // Verifica se NÃO tem "TEMPO RESTANTE" no texto (ou tem apenas 7 horas no total)
    if (!linhaLimpa.includes('TEMPO RESTANTE') && horasSemTempo.length <= 7) {
        console.log('🎯 REGRA SEM TEMPO RESTANTE detectada!');
        console.log(`   Mapa: ${mapaMatchSemTempo[1]}`);
        console.log(`   G=${horasSemTempo[0]} (1ª hora), B=${horasSemTempo[3]} (4ª hora)`);
        return {
            mapa: normalizarMapa(mapaMatchSemTempo[1]),
            horaGigante: converterHoraPara24h(horasSemTempo[0]),
            horaBandido: converterHoraPara24h(horasSemTempo[3])
        };
    }
}
    // ==========================================
    // NOVA REGRA: FORMATO COM TEMPO RESTANTE
    // Ex: GF 19:39:54 💀 Morto 22:39:54 23:39:54 19:27:29 💀 Morto 22:27:29 23:27:29
    // ==========================================
    let mapaMatchNova = linhaLimpa.match(/^(GF|MW|GV|CCV|MM)/i);
    let horasNova = linhaLimpa.match(/\d{1,2}:\d{2}:\d{2}/g);
    
    if (mapaMatchNova && horasNova && horasNova.length >= 5) {
        if (linhaLimpa.includes('💀') && linhaLimpa.includes('Morto')) {
            console.log('🎯 NOVA REGRA detectada!');
            console.log(`   Mapa: ${mapaMatchNova[1]}`);
            console.log(`   G=${horasNova[0]} (1ª hora), B=${horasNova[4]} (5ª hora)`);
            return {
                mapa: normalizarMapa(mapaMatchNova[1]),
                horaGigante: converterHoraPara24h(horasNova[0]),
                horaBandido: converterHoraPara24h(horasNova[4])
            };
        }
    }
    
    // ==========================================
    // FORMATO CSV COMPLETO
    // ==========================================
    let csvMatch = linhaLimpa.match(/^([A-Za-z]{2,3})\s*,\s*(\d{1,2}:\d{2}:\d{2})\s*,\s*\d{1,2}:\d{2}:\d{2}\s*,\s*\d{1,2}:\d{2}:\d{2}\s*,\s*(\d{1,2}:\d{2}:\d{2})/i);
    if (csvMatch) {
        console.log('✅ CSV detectado:', csvMatch[1], 'G=', csvMatch[2], 'B=', csvMatch[3]);
        return {
            mapa: normalizarMapa(csvMatch[1]),
            horaGigante: converterHoraPara24h(csvMatch[2]),
            horaBandido: converterHoraPara24h(csvMatch[3])
        };
    }

    // ==========================================
    // FORMATO DIRETO: GF💀 Morto01:55:36💀 Morto01:56:36
    // ==========================================
    let linhaSemMorto = linhaLimpa.replace(/💀\s*Morto/g, '');
    let matchDireto = linhaSemMorto.match(/^(GF|MW|GV|CCV|MM)\s*(\d{1,2}:\d{2}:\d{2})\s*(\d{1,2}:\d{2}:\d{2})/i);
    if (matchDireto) {
        return {
            mapa: normalizarMapa(matchDireto[1]),
            horaGigante: converterHoraPara24h(matchDireto[2]),
            horaBandido: converterHoraPara24h(matchDireto[3])
        };
    }

    // ==========================================
    // FORMATO TABELA CONDENSADA
    // ==========================================
    if (linhaLimpa.match(/^(GF|MW|GV|CCV|MM)/i)) {
        let mapaMatchTemp = linhaLimpa.match(/^(GF|MW|GV|CCV|MM)/i);
        let mapa = normalizarMapa(mapaMatchTemp[1]);
        let horasTemp = linhaLimpa.match(/(\d{1,2}:\d{2}:\d{2})/g);
        if (horasTemp && horasTemp.length >= 2) {
            return {
                mapa: mapa,
                horaGigante: converterHoraPara24h(horasTemp[0]),
                horaBandido: converterHoraPara24h(horasTemp[1])
            };
        }
    }

    // ==========================================
    // FORMATO SIMPLES: GF 18:59:00 19:00:00
    // ==========================================
    let mapaHorasMatch = linhaLimpa.match(/^(GF|MW|GV|CCV|MM)\s+(\d{1,2}:\d{2}:\d{2}).*?(\d{1,2}:\d{2}:\d{2})/i);
    if (mapaHorasMatch) {
        return {
            mapa: normalizarMapa(mapaHorasMatch[1]),
            horaGigante: converterHoraPara24h(mapaHorasMatch[2]),
            horaBandido: converterHoraPara24h(mapaHorasMatch[3])
        };
    }

    // ==========================================
    // FORMATO: "n 19:01" ou "b 19:09"
    // ==========================================
    let nMatch = linhaLimpa.match(/^n\s+(\d{1,2}:\d{2})(?::(\d{2}))?$/i);
    if (nMatch) {
        let hora = nMatch[1];
        let segundos = nMatch[2] || "00";
        return { horaGigante: converterHoraPara24h(`${hora}:${segundos}`) };
    }
    
    let bMatch = linhaLimpa.match(/^b\s+(\d{1,2}:\d{2})(?::(\d{2}))?$/i);
    if (bMatch) {
        let hora = bMatch[1];
        let segundos = bMatch[2] || "00";
        return { horaBandido: converterHoraPara24h(`${hora}:${segundos}`) };
    }

    // ==========================================
    // FORMATO: "mm 19:10" (Mapa com hora)
    // ==========================================
    const mapaAbreviado = {
        'mm': 'MM', 'ccv': 'CCV', 'gv': 'GV', 'mk': 'MW', 'gf': 'GF'
    };
    
    let linhaLimpaOriginal = linhaLimpa;
    linhaLimpa = limparTextoMapa(linhaLimpa);
    
    let mapaComHoraMatch = linhaLimpa.match(/^(mm|ccv|gv|mk|gf)\s+(\d{1,2}:\d{2})(?::(\d{2}))?$/i);
    if (mapaComHoraMatch) {
        let mapaAbrev = mapaComHoraMatch[1].toLowerCase();
        let mapa = mapaAbreviado[mapaAbrev];
        let hora = mapaComHoraMatch[2];
        let segundos = mapaComHoraMatch[3] || "00";
        let horaCompleta = converterHoraPara24h(`${hora}:${segundos}`);
        return { 
            mapa: mapa, 
            pending: true,
            horaGigante: horaCompleta,
            horaBandido: horaCompleta
        };
    }
    
    linhaLimpa = linhaLimpaOriginal;

    // ==========================================
    // FORMATO: "gf b 20:07" ou "gf n 20:17"
    // ==========================================
    let mapaComBandidoMatch = linhaLimpa.match(/^(gf|mm|ccv|gv|mk)\s+b\s+(\d{1,2}:\d{2})(?::(\d{2}))?$/i);
    if (mapaComBandidoMatch) {
        let mapaAbrev = mapaComBandidoMatch[1].toLowerCase();
        let mapa = mapaAbreviado[mapaAbrev];
        let hora = mapaComBandidoMatch[2];
        let segundos = mapaComBandidoMatch[3] || "00";
        return {
            mapa: mapa,
            horaBandido: converterHoraPara24h(`${hora}:${segundos}`)
        };
    }
    
    let mapaComGiganteMatch = linhaLimpa.match(/^(gf|mm|ccv|gv|mk)\s+n\s+(\d{1,2}:\d{2})(?::(\d{2}))?$/i);
    if (mapaComGiganteMatch) {
        let mapaAbrev = mapaComGiganteMatch[1].toLowerCase();
        let mapa = mapaAbreviado[mapaAbrev];
        let hora = mapaComGiganteMatch[2];
        let segundos = mapaComGiganteMatch[3] || "00";
        return {
            mapa: mapa,
            horaGigante: converterHoraPara24h(`${hora}:${segundos}`)
        };
    }

    // ==========================================
    // FORMATO MAPA (GF, MW, GV, CCV, MM)
    // ==========================================
    let mapaMatchSimples = linhaLimpa.match(/^(GF|MW|GV|CCV|MM)$/i);
    if (mapaMatchSimples) {
        return { mapa: normalizarMapa(mapaMatchSimples[1]), pending: true };
    }

    // ==========================================
    // FORMATO TABELA: | GF | 21:46:36 | 21:51:20 |
    // ==========================================
    let tableMatch = linhaLimpa.match(/\|\s*([A-Za-z]{2,3})\s*\|\s*(\d{1,2}:\d{2}:\d{2})\s*\|\s*(\d{1,2}:\d{2}:\d{2})\s*\|/i);
    if (tableMatch) {
        return {
            mapa: normalizarMapa(tableMatch[1]),
            horaGigante: converterHoraPara24h(tableMatch[2]),
            horaBandido: converterHoraPara24h(tableMatch[3])
        };
    }

    // ==========================================
    // FORMATO TEXTO LIVRE
    // ==========================================
    let mapaLivro = linhaLimpa.match(/\b(GF|MW|GV|CCV|MM|Gf|Mw|Gv|Ccv|Mm)\b/i);
    let horasLivro = linhaLimpa.match(/(\d{1,2}:\d{2}:\d{2})/g);
    if (mapaLivro && horasLivro && horasLivro.length >= 2) {
        return {
            mapa: normalizarMapa(mapaLivro[1]),
            horaGigante: converterHoraPara24h(horasLivro[0]),
            horaBandido: converterHoraPara24h(horasLivro[1])
        };
    }
    
    return null;
}

function preencherMapa(mapa, horaGigante, horaBandido, mapasEncontrados) {
    console.log(`Preenchendo ${mapa}: G=${horaGigante} B=${horaBandido}`);
    mapasEncontrados.push(mapa);
    
    document.querySelectorAll('tr').forEach(tr => {
        const celulaMapa = tr.querySelector('td:first-child');
        if (celulaMapa && celulaMapa.innerText.trim().toUpperCase() === mapa) {
            const inputGigante = tr.querySelector('.morteGigante');
            if (inputGigante && horaGigante) {
                inputGigante.value = horaGigante;
                inputGigante.dispatchEvent(new Event('input', { bubbles: true }));
            }
            const inputBandido = tr.querySelector('.morteBandido');
            if (inputBandido && horaBandido) {
                inputBandido.value = horaBandido;
                inputBandido.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }
    });
}

// Dentro do for (const linha of linhasJuntas), antes de processar
// Ou modifique a função juntarLinhasTabela para reconhecer o novo formato

function juntarLinhasTabela(linhas) {
    let resultado = [];
    let ultimoMapa = '';
    
    // Lista de abreviações de mapas
    const abreviacoesMapa = /^(MM|CCV|GV|MW|GF|mm|ccv|cvv|gv|mw|gf|mk)$/i;
    
    for (let i = 0; i < linhas.length; i++) {
        let linha = linhas[i].trim();
        if (linha === '') continue;
        
        // Se é apenas um mapa (qualquer abreviatura)
        if (linha.match(abreviacoesMapa)) {
            // Se já tinha um mapa pendente, finaliza ele
            if (ultimoMapa) {
                // Não adiciona nada, apenas reseta
            }
            ultimoMapa = linha.toUpperCase();
            if (ultimoMapa === 'MK') ultimoMapa = 'MW';
            if (ultimoMapa === 'CVV') ultimoMapa = 'CCV';
            continue; // Não adiciona a linha separada, apenas guarda o mapa
        }
        
        // Se é "n mm 19:01" (letra + mapa + hora)
        else if (linha.match(/^[nb]\s+(gf|mm|ccv|cvv|gv|mk)\s+\d{1,2}:\d{2}/i)) {
            resultado.push(linha);
            const match = linha.match(/^[nb]\s+(gf|mm|ccv|cvv|gv|mk)/i);
            if (match) {
                let mapaAbrev = match[1].toLowerCase();
                const mapaAbreviado = { 'mm': 'MM', 'ccv': 'CCV', 'cvv': 'CCV', 'gv': 'GV', 'mk': 'MW', 'gf': 'GF' };
                ultimoMapa = mapaAbreviado[mapaAbrev];
            }
        }
        
        // Se é "gf b 20:07" (mapa + letra + hora)
        else if (linha.match(/^(gf|mm|ccv|cvv|gv|mk)\s+[nb]\s+\d{1,2}:\d{2}/i)) {
            resultado.push(linha);
            const match = linha.match(/^(gf|mm|ccv|cvv|gv|mk)/i);
            if (match) {
                let mapaAbrev = match[1].toLowerCase();
                const mapaAbreviado = { 'mm': 'MM', 'ccv': 'CCV', 'cvv': 'CCV', 'gv': 'GV', 'mk': 'MW', 'gf': 'GF' };
                ultimoMapa = mapaAbreviado[mapaAbrev];
            }
        }
        
        // Se é n ou b com hora (ex: "n 19:01" ou "b 19:09")
        else if (linha.match(/^[nb]\s+\d{1,2}:\d{2}/i)) {
            if (ultimoMapa) {
                resultado.push(`${ultimoMapa} ${linha}`);
            } else {
                resultado.push(linha);
            }
        }
        
        // Linha normal (já tem mapa explícito)
        else {
            resultado.push(linha);
            // Tenta extrair mapa da linha para atualizar ultimoMapa
            const mapaMatch = linha.match(/^(MM|CCV|GV|MW|GF)/i);
            if (mapaMatch) {
                ultimoMapa = mapaMatch[1].toUpperCase();
            }
        }
    }
    
    console.log('Linhas processadas:', resultado);
    return resultado;
}

function processarTextoColado(texto) {
    console.log('🔴🔴🔴 processarTextoColado EXECUTANDO!');
    // 🔥 NOVA LINHA - LIMPA SPAWNS ANTES DE PROCESSAR
    //limparSpawnsAntigos();
    console.log('Texto recebido (primeiros 100 caracteres):', texto.substring(0, 100));
    
    let linhasOriginais = texto.split('\n');
    let linhasJuntas = juntarLinhasTabela(linhasOriginais);
    
    console.log('Linhas após juntar:', linhasJuntas);
    
    let encontrados = 0;
    const mapasEncontrados = [];
    let mapaAtual = null;
    let horaGiganteAtual = null;
    let horaBandidoAtual = null;
    
    // NOVO: Rastrear quais células foram realmente preenchidas (evita duplicatas)
    const celulasPreenchidas = new Set();
    
    for (const linha of linhasJuntas) {
        let linhaLimpa = linha.trim();
        if (linhaLimpa === '') continue;
        
        if (linhaLimpa.includes('MAPA') && linhaLimpa.includes('MORTE GIGANTE')) {
            console.log('Linha de cabeçalho ignorada');
            continue;
        }
        
        if (linhaLimpa.match(/^MAPA|SERVER|RESPAWN|TEMPO|RESTANTE/i)) {
            console.log('Linha ignorada (cabeçalho)');
            continue;
        }

        // Pular linha de cabeçalho "NOVO HORÁRIO | CATEGORIA | TIPO"
    if (linhaLimpa.includes('NOVO HORÁRIO') || linhaLimpa.includes('CATEGORIA') || linhaLimpa.includes('TIPO')) {
        console.log('Cabeçalho ignorado');
        continue;
    }
    
    // Pular linha do título
if (linhaLimpa.includes('CRONOGRAMA') || linhaLimpa.includes('ADIANTADO') || linhaLimpa.includes('+3 HORAS')) {
    console.log('Título ignorado');
    continue;
}

        console.log('Processando linha junta:', linhaLimpa);
        
        const dados = extrairDados(linhaLimpa);
        console.log('Dados extraídos:', dados);
        if (!dados) continue;
        
        if (dados.pending && dados.mapa) {
            if (mapaAtual && (horaGiganteAtual || horaBandidoAtual)) {
                // Contar apenas células que realmente mudaram
                const chaveMapa = mapaAtual;
                const gigantePreenchido = preencherMapaComRetorno(mapaAtual, horaGiganteAtual, horaBandidoAtual, mapasEncontrados, celulasPreenchidas);
                if (horaGiganteAtual) encontrados += gigantePreenchido ? 1 : 0;
                if (horaBandidoAtual) encontrados += gigantePreenchido ? 0 : (horaBandidoAtual ? 1 : 0);
            }
            mapaAtual = dados.mapa;
            horaGiganteAtual = dados.horaGigante || null;
            horaBandidoAtual = dados.horaBandido || null;
            continue;
        }
        
        if (dados.horaGigante) horaGiganteAtual = dados.horaGigante;
        if (dados.horaBandido) horaBandidoAtual = dados.horaBandido;
        
        if (dados.mapa && (dados.horaGigante || dados.horaBandido)) {
    const preenchidos = preencherMapaComRetorno(dados.mapa, dados.horaGigante, dados.horaBandido, mapasEncontrados, celulasPreenchidas);
    
    // Conta de forma mais simples
    if (dados.horaGigante) {
        encontrados++;
        console.log(`✅ Contagem +1 para Gigante ${dados.mapa}`);
    }
    if (dados.horaBandido) {
        encontrados++;
        console.log(`✅ Contagem +1 para Bandido ${dados.mapa}`);
    }
    continue;
}
        
        if (mapaAtual && horaGiganteAtual && horaBandidoAtual) {
            const preenchidos = preencherMapaComRetorno(mapaAtual, horaGiganteAtual, horaBandidoAtual, mapasEncontrados, celulasPreenchidas);
            if (horaGiganteAtual && preenchidos.gigante) encontrados++;
            if (horaBandidoAtual && preenchidos.bandido) encontrados++;
            mapaAtual = null;
            horaGiganteAtual = null;
            horaBandidoAtual = null;
        }
    }
    
    if (mapaAtual && horaGiganteAtual && horaBandidoAtual) {
        const preenchidos = preencherMapaComRetorno(mapaAtual, horaGiganteAtual, horaBandidoAtual, mapasEncontrados, celulasPreenchidas);
        if (horaGiganteAtual && preenchidos.gigante) encontrados++;
        if (horaBandidoAtual && preenchidos.bandido) encontrados++;
    }
    
    if (typeof calcular === 'function') calcular();
    
    // Mensagem mais precisa
    const container = campoColar ? campoColar.parentNode : document.body;
    const statusDiv = document.createElement('div');
    const mapaTexto = mapasEncontrados.length === 1 ? 'mapa' : 'mapas';
    const horarioTexto = encontrados === 1 ? 'horário' : 'horários';
    statusDiv.innerHTML = encontrados > 0 
        ? `✅ ${encontrados} ${horarioTexto} preenchidos (${mapasEncontrados.length} ${mapaTexto})` 
        : `❌ Nenhum horário encontrado. Tente outro formato.`;
    statusDiv.style.color = encontrados > 0 ? '#4CAF50' : '#ff5252';
    statusDiv.style.cssText = 'font-size: 12px; margin-top: 8px; text-align: center; font-weight: bold; padding: 5px; border-radius: 8px;';
    container.appendChild(statusDiv);
    setTimeout(() => statusDiv.remove(), 5000);
    
    if (campoColar) campoColar.value = '';
    console.log(`Processamento concluído: ${encontrados} horários únicos`);
    return encontrados;
}

// Função auxiliar que retorna quais células foram realmente preenchidas
function preencherMapaComRetorno(mapa, horaGigante, horaBandido, mapasEncontrados, celulasPreenchidas) {
    console.log(`Preenchendo ${mapa}: G=${horaGigante} B=${horaBandido}`);
    
    let gigantePreenchido = false;
    let bandidoPreenchido = false;
    
    if (!mapasEncontrados.includes(mapa)) {
        mapasEncontrados.push(mapa);
    }
    
    document.querySelectorAll('tr').forEach(tr => {
        const celulaMapa = tr.querySelector('td:first-child');
        if (celulaMapa && celulaMapa.innerText.trim().toUpperCase() === mapa) {
            const inputGigante = tr.querySelector('.morteGigante');
            const inputBandido = tr.querySelector('.morteBandido');
            
            if (inputGigante && horaGigante) {
                const chaveCelula = `${mapa}-G`;
                if (inputGigante.value !== horaGigante) {
                    inputGigante.value = horaGigante;
                    inputGigante.dispatchEvent(new Event('input', { bubbles: true }));
                    if (!celulasPreenchidas.has(chaveCelula)) {
                        celulasPreenchidas.add(chaveCelula);
                        gigantePreenchido = true;
                    }
                }
            }
            
            if (inputBandido && horaBandido) {
                const chaveCelula = `${mapa}-B`;
                if (inputBandido.value !== horaBandido) {
                    inputBandido.value = horaBandido;
                    inputBandido.dispatchEvent(new Event('input', { bubbles: true }));
                    if (!celulasPreenchidas.has(chaveCelula)) {
                        celulasPreenchidas.add(chaveCelula);
                        bandidoPreenchido = true;
                    }
                }
            }
        }
    });
    
    return { gigante: gigantePreenchido, bandido: bandidoPreenchido };
}

// Evento do botão PREENCHER HORÁRIOS
// Evento do botão PREENCHER HORÁRIOS - VERSÃO SIMPLES
btnColarTexto.onclick = function() {
    console.log('🔴 CLIQUE DO BOTÃO DETECTADO!');
    
    const texto = campoColar.value.trim();
    console.log('Texto do textarea:', texto);
    
    if (!texto) {
        alert('⚠️ Cole o texto primeiro!');
        return;
    }
    
    processarTextoColado(texto);
};

if (campoColar) {
    campoColar.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            const btn = document.getElementById('btnColarTexto');
            if (btn) btn.click();
        }
    });
}

console.log('Sistema de colar texto carregado com sucesso!');

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

    // 🔥 CARREGA O HISTÓRICO SALVO (ADICIONE AQUI, FORA DA FUNÇÃO DUPLICADA)
    document.querySelectorAll('.morteGigante, .morteBandido').forEach(input => {
        const idCampo = input.dataset.mapa + "-" + (input.classList.contains('morteGigante') ? 'G' : 'B');
        
        const historicoSalvo = localStorage.getItem(`historico_${idCampo}`);
        const futuroSalvo = localStorage.getItem(`futuro_${idCampo}`);
        
        if (historicoSalvo) {
            historicoCampos[idCampo] = JSON.parse(historicoSalvo);
            console.log(`✅ Histórico carregado para ${idCampo}:`, historicoCampos[idCampo]);
        } else {
            if (!historicoCampos[idCampo]) historicoCampos[idCampo] = [];
            if (!historicoFuturoCampos[idCampo]) historicoFuturoCampos[idCampo] = [];
            console.log(`❌ Nenhum histórico encontrado para ${idCampo}`);
        }
        
        if (futuroSalvo) {
            historicoFuturoCampos[idCampo] = JSON.parse(futuroSalvo);
        }
        
        if (input.value && input.value !== '--:--:--') {
            if (historicoCampos[idCampo].length === 0) {
                historicoCampos[idCampo].push(input.value);
            }
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
    
    // Garante que o contexto está rodando
    if (ctx.state === 'suspended') {
        ctx.resume().then(() => {
            tocarBipReal(ctx, duracaoSegundos, tipo);
        });
    } else {
        tocarBipReal(ctx, duracaoSegundos, tipo);
    }
}

function tocarBipReal(ctx, duracaoSegundos, tipo) {
    try {
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
        
        aplicarEfeitoVisualRelogio();
    } catch (e) {
        console.log('Erro no áudio:', e);
    }
}

// ==========================================
// 10. CONTROLE DE VOLUME
// ==========================================
const sliderVolume = document.getElementById('volume-alarme');
const campoVolumeTxt = document.getElementById('valor-volume'); 
const btnVolMenos = document.getElementById('vol-menos');
const btnVolMais = document.getElementById('vol-mais');

// Converter de 0-100 para 0-1 e vice-versa
function atualizarInterfaceVolume(valor) {
    // Garantir que é número inteiro
    valor = Math.round(Number(valor));
    if (isNaN(valor)) valor = 10;
    if (valor > 100) valor = 100;
    if (valor < 0) valor = 0;
    
    const valorNormalizado = valor / 100;
    if (sliderVolume) sliderVolume.value = valor;
    if (campoVolumeTxt) campoVolumeTxt.value = valor;
    volumeAtual = valorNormalizado;
    localStorage.setItem('volumeAlarme', valorNormalizado);
}

// Carregar volume salvo
let volumeSalvo = parseFloat(localStorage.getItem('volumeAlarme')) || 0.1;
let volumePercentual = Math.round(volumeSalvo * 100);

if (sliderVolume && campoVolumeTxt) {
    sliderVolume.value = volumePercentual;
    campoVolumeTxt.value = volumePercentual;
    
    sliderVolume.oninput = (e) => {
        let novoValor = parseInt(e.target.value);
        atualizarInterfaceVolume(novoValor);
    };
    
    campoVolumeTxt.oninput = (e) => {
        let valorDigitado = parseInt(e.target.value);
        if (isNaN(valorDigitado)) return;
        if (valorDigitado > 100) valorDigitado = 100;
        if (valorDigitado < 0) valorDigitado = 0;
        atualizarInterfaceVolume(valorDigitado);
    };
}

// Botão diminuir volume
if (btnVolMenos) {
    btnVolMenos.onclick = () => {
        let valorAtual = parseInt(sliderVolume.value);
        if (isNaN(valorAtual)) valorAtual = 10;
        let novoValor = valorAtual - 1;
        if (novoValor < 0) novoValor = 0;
        atualizarInterfaceVolume(novoValor);
    };
}

// Botão aumentar volume
if (btnVolMais) {
    btnVolMais.onclick = () => {
        let valorAtual = parseInt(sliderVolume.value);
        if (isNaN(valorAtual)) valorAtual = 10;
        let novoValor = valorAtual + 1;
        if (novoValor > 100) novoValor = 100;
        atualizarInterfaceVolume(novoValor);
    };
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

        function atualizarLinha(inputHoraRespawn, celulaExibicao, celulaFoco, chaveUnica, spawnKey) {
            if (celulaExibicao.querySelector('.spawn-timer')) return;
            if (!celulaExibicao) return;

            const horaTexto = inputHoraRespawn ? inputHoraRespawn.value : "";
            if (!horaTexto || horaTexto === "" || horaTexto === "--:--:--" || horaTexto === "HH:MM:SS") {
                celulaExibicao.innerText = "--:--:--";
                const tipoLinha = spawnKey.endsWith('-G') ? 'gigante' : 'bandido';
                tr.classList.remove(`linha-vermelha-${tipoLinha}`);
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
                if (!celulaExibicao.dataset.spawnado) {
                    celulaExibicao.dataset.spawnado = "true";
                    localStorage.setItem(spawnKey, "true");
                    
                    const spawnTimeKey = `${spawnKey}_time`;
                    let spawnTime = localStorage.getItem(spawnTimeKey);
                    if (!spawnTime) {
                        spawnTime = new Date().toISOString();
                        localStorage.setItem(spawnTimeKey, spawnTime);
                    }
                    
                    const chaveTimer = `${mapa}-${spawnKey.endsWith('-G') ? 'G' : 'B'}`;
                    const startTimeKey = `spawn_start_${chaveTimer}`;
                    if (!localStorage.getItem(startTimeKey)) {
                        localStorage.setItem(startTimeKey, spawnTime);
                    }
                    
                    const horasPassadas = (new Date() - new Date(spawnTime)) / (1000 * 60 * 60);
                        
                    if (horasPassadas >= 3) {
                        celulaExibicao.innerHTML = '';
                        const spawnText = document.createElement('div');
                        spawnText.textContent = '💥 SPAWNOU!';
                        spawnText.style.fontWeight = 'bold';
                        spawnText.style.fontSize = '13px';
                        spawnText.style.color = '#ff5252';
                        spawnText.style.textAlign = 'center';
                        celulaExibicao.appendChild(spawnText);
                        
                        const msgText = document.createElement('div');
                        msgText.textContent = '⏰ HORÁRIO DA ÚLTIMA ROTAÇÃO/ERRADA!';
                        msgText.style.fontSize = '10px';
                        msgText.style.color = '#FFA500';
                        msgText.style.textAlign = 'center';
                        celulaExibicao.appendChild(msgText);
                        
                        const atualizeText = document.createElement('div');
                        atualizeText.textContent = '📋 ATUALIZE OS HORÁRIOS';
                        atualizeText.style.fontSize = '9px';
                        atualizeText.style.color = '#888';
                        atualizeText.style.textAlign = 'center';
                        celulaExibicao.appendChild(atualizeText);
                        
                        const tipoLinha = spawnKey.endsWith('-G') ? 'gigante' : 'bandido';
                        tr.classList.remove(`linha-vermelha-${tipoLinha}`);
                    } else {
                        const tipoSpawn = spawnKey.endsWith('-G') ? 'G' : 'B';
                        iniciarTimerSpawn(celulaExibicao, mapa, tipoSpawn);
                        const tipo = spawnKey.endsWith('-G') ? 'gigante' : 'bandido';
                        tr.classList.add(`linha-vermelha-${tipo}`);
                    }

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
                        }
                    }
                }
            } else {
                const tipo = spawnKey.endsWith('-G') ? 'gigante' : 'bandido';
                const tipoSpawn = spawnKey.endsWith('-G') ? 'G' : 'B';

                tr.classList.remove(`linha-vermelha-${tipo}`);
                tr.style.backgroundColor = '';
                tr.style.background = '';
                
                if (localStorage.getItem(spawnKey) === "true") {
                    localStorage.removeItem(spawnKey);
                    localStorage.removeItem(`${spawnKey}_time`);
                    localStorage.removeItem(`spawn_start_${mapa}-${tipoSpawn}`);
                    localStorage.removeItem(`foco-azul-${spawnKey}`);
                    delete celulaExibicao.dataset.spawnado;
                    celulaExibicao.classList.remove('ultimo-spawn', 'mensagem-atualizacao');
                    tr.classList.remove(`linha-vermelha-${tipo}`);
                    if (celulaFoco) celulaFoco.classList.remove('alarme-foco');
                }

                const hrs = Math.floor(diferencaSegundos / 3600);

                if (diferencaSegundos <= 10800 && celulaExibicao.classList.contains('mensagem-atualizacao')) {
                    celulaExibicao.classList.remove('mensagem-atualizacao');
                    celulaExibicao.innerHTML = '';
                    tr.classList.remove(`linha-vermelha-${tipo}`);
                    tr.style.backgroundColor = '';
                    tr.style.background = '';
                }

                if (diferencaSegundos > 10800 && !celulaExibicao.dataset.spawnado) {
                    celulaExibicao.innerHTML = '';
                    celulaExibicao.classList.add('mensagem-atualizacao');
                    
                    const spawnText = document.createElement('div');
                    spawnText.textContent = '💥 SPAWNOU!';
                    spawnText.style.fontWeight = 'bold';
                    spawnText.style.fontSize = '13px';
                    spawnText.style.color = '#ff5252';
                    spawnText.style.textAlign = 'center';
                    celulaExibicao.appendChild(spawnText);
                    
                    const msgText = document.createElement('div');
                    msgText.textContent = '⏰ HORÁRIO DA ÚLTIMA ROTAÇÃO/ERRADA!';
                    msgText.style.fontSize = '10px';
                    msgText.style.color = '#FFA500';
                    msgText.style.textAlign = 'center';
                    celulaExibicao.appendChild(msgText);
                    
                    const atualizeText = document.createElement('div');
                    atualizeText.textContent = '📋 ATUALIZE OS HORÁRIOS';
                    atualizeText.style.fontSize = '9px';
                    atualizeText.style.color = '#888';
                    atualizeText.style.textAlign = 'center';
                    celulaExibicao.appendChild(atualizeText);
                    
                    tr.classList.remove(`linha-vermelha-${tipo}`);
                } else if (!celulaExibicao.classList.contains('mensagem-atualizacao')) {
                    const mins = Math.floor((diferencaSegundos % 3600) / 60);
                    const segs = diferencaSegundos % 60;
                    celulaExibicao.innerText = formatar(hrs, mins, segs);
                }

                if (!celulaExibicao.dataset.spawnado && !celulaExibicao.classList.contains('mensagem-atualizacao')) {
                    if (diferencaSegundos <= 60) {
                        celulaExibicao.classList.add('muito-critico');
                        celulaExibicao.classList.remove('critico');
                    } else if (diferencaSegundos <= 300) {
                        celulaExibicao.classList.add('critico');
                        celulaExibicao.classList.remove('muito-critico');
                    } else {
                        celulaExibicao.classList.remove('critico', 'muito-critico');
                    }
                }
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
    };
}

// ==========================================
// 14. MÁSCARA DE TEMPO + CTRL + Z (DESFAZER) + CTRL + Y (REFAZER) - CORRIGIDO
// ==========================================
const historicoCampos = {};
const historicoFuturoCampos = {};

document.querySelectorAll('.morteGigante, .morteBandido').forEach(input => {
    const idCampo = input.dataset.mapa + "-" + (input.classList.contains('morteGigante') ? 'G' : 'B');
    historicoCampos[idCampo] = [];
    historicoFuturoCampos[idCampo] = [];

    // Salvar valor no histórico (desfazer)
function salvarNoHistorico(valor) {
    const pilha = historicoCampos[idCampo];
    const valorParaSalvar = valor === "" ? "" : valor;
    
    if (pilha.length === 0 || pilha[pilha.length - 1] !== valorParaSalvar) {
        pilha.push(valorParaSalvar);
        if (pilha.length > 30) pilha.shift();
        console.log(`📝 Histórico [${idCampo}]:`, pilha);
        
        // Salva no localStorage imediatamente
        localStorage.setItem(`historico_${idCampo}`, JSON.stringify(pilha));
    }
}

    // Salvar valor no futuro (refazer)
    function salvarNoFuturo(valor) {
        const pilhaFuturo = historicoFuturoCampos[idCampo];
        if (pilhaFuturo.length === 0 || pilhaFuturo[pilhaFuturo.length - 1] !== valor) {
            pilhaFuturo.push(valor);
            if (pilhaFuturo.length > 30) pilhaFuturo.shift();
        }
    }

    // 🔥 ADICIONE ESTA FUNÇÃO AQUI 🔥
function limparFuturo() {
    historicoFuturoCampos[idCampo] = [];
}


// ==========================================
// FUNÇÃO FORÇAR LIMPEZA DE SPAWN (VERSÃO SUAVE - SÓ PARA DESFAZER/REFAZER)
// ==========================================
function forcarLimpezaSpawn(inputElement) {
    if (!inputElement) return;
    
    const mapa = inputElement.getAttribute('data-mapa');
    const tipo = inputElement.classList.contains('morteGigante') ? 'G' : 'B';
    const spawnKey = `spawn-${mapa}-${tipo}`;
    const tr = inputElement.closest('tr');
    const campoTempo = tr.querySelector(tipo === 'G' ? '.tempo-restante-gigante' : '.tempo-restante-bandido');
    const respServer = tr.querySelector(tipo === 'G' ? '.respGiganteServer' : '.respBandidoServer');
    
    if (campoTempo) {
        if (campoTempo.classList.contains('mensagem-atualizacao')) {
            campoTempo.classList.remove('mensagem-atualizacao');
            campoTempo.innerHTML = '';
        }
        campoTempo.classList.remove('ultimo-spawn', 'mensagem-atualizacao', 'critico', 'muito-critico');
    }
    
    if (respServer && respServer.value && campoTempo && campoTempo.classList.contains('mensagem-atualizacao')) {
        const infoTempo = obterHoraServerAtual();
        const partes = respServer.value.split(':');
        const hResp = parseInt(partes[0]);
        const mResp = parseInt(partes[1]);
        const sResp = parseInt(partes[2]);
        const tempoRespawn = hResp * 3600 + mResp * 60 + sResp;
        const tempoAtual = infoTempo.h * 3600 + infoTempo.m * 60 + infoTempo.s;
        let diff = tempoRespawn - tempoAtual;
        if (diff < 0) diff += 86400;
        
        if (diff > 0 && diff <= 10800) {
            const hrs = Math.floor(diff / 3600);
            const mins = Math.floor((diff % 3600) / 60);
            const segs = diff % 60;
            campoTempo.innerText = formatar(hrs, mins, segs);
            campoTempo.classList.remove('mensagem-atualizacao');
            
            if (diff <= 60) {
                campoTempo.classList.add('muito-critico');
            } else if (diff <= 300) {
                campoTempo.classList.add('critico');
            }
        }
    }
    
    const outroTipo = tipo === 'G' ? 'B' : 'G';
    const outroSpawnKey = `spawn-${mapa}-${outroTipo}`;
    const outroSpawnAtivo = localStorage.getItem(outroSpawnKey) === "true";
    
    if (!outroSpawnAtivo) {
        if (tr) {
            tr.style.backgroundColor = '';
            tr.style.background = '';
        }
    }
}  // ← SÓ UMA CHAVE AQUI, NADA MAIS!

function desfazer() {
    const pilha = historicoCampos[idCampo];
    const pilhaFuturo = historicoFuturoCampos[idCampo];
    
    console.log(`🔄 Desfazer em ${idCampo} - Pilha atual:`, pilha);
    
    if (pilha.length > 1) {
        // Salva valor atual no futuro
        const valorAtual = input.value;
        pilhaFuturo.push(valorAtual === "" ? "" : valorAtual);
        
        // Remove o atual e pega o anterior
        pilha.pop();
        const valorAnterior = pilha[pilha.length - 1];
        input.value = valorAnterior;  // Pode ser "" vazio
        
        // Limpa a mensagem de spawn se existir
        const mapa = input.getAttribute('data-mapa');
        const tipo = input.classList.contains('morteGigante') ? 'G' : 'B';
        const tr = input.closest('tr');
        const campoTempo = tr.querySelector(tipo === 'G' ? '.tempo-restante-gigante' : '.tempo-restante-bandido');
        if (campoTempo && campoTempo.classList.contains('mensagem-atualizacao')) {
            campoTempo.classList.remove('mensagem-atualizacao');
            campoTempo.innerHTML = '--:--:--';
        }
        
        // Força atualização
        input.dispatchEvent(new Event('input', { bubbles: true }));
        calcular();
        
        // Salva no localStorage
        localStorage.setItem(`historico_${idCampo}`, JSON.stringify(pilha));
        localStorage.setItem(`futuro_${idCampo}`, JSON.stringify(pilhaFuturo));
        
        console.log(`✅ Desfazer: novo valor = "${valorAnterior}"`);
    } else {
        console.log("⚠️ Não há mais histórico para desfazer");
    }
}

// Refazer (Ctrl+Y)
function refazer() {
    const pilhaFuturo = historicoFuturoCampos[idCampo];
    
    if (pilhaFuturo.length > 0) {
        // 🔥 SÓ LIMPA A MENSAGEM, NÃO O SPAWN
        const mapa = input.getAttribute('data-mapa');
        const tipo = input.classList.contains('morteGigante') ? 'G' : 'B';
        const tr = input.closest('tr');
        const campoTempo = tr.querySelector(tipo === 'G' ? '.tempo-restante-gigante' : '.tempo-restante-bandido');
        if (campoTempo && campoTempo.classList.contains('mensagem-atualizacao')) {
            campoTempo.classList.remove('mensagem-atualizacao');
            campoTempo.innerHTML = '';
        }
        
        // Pegar o próximo valor do futuro
        const valorProximo = pilhaFuturo.pop();
        
        // Salvar valor atual no histórico
        const valorAtual = input.value;
        if (valorAtual) {
            historicoCampos[idCampo].push(valorAtual);
        }
        
        input.value = valorProximo;
        
        // Forçar atualização
        input.dispatchEvent(new CustomEvent('input', { detail: { isUndo: true } }));
        calcular();

        // 🔥 SALVA O HISTÓRICO NO STORAGE
        localStorage.setItem(`historico_${idCampo}`, JSON.stringify(historicoCampos[idCampo]));
        localStorage.setItem(`futuro_${idCampo}`, JSON.stringify(pilhaFuturo));
    }
}

    // Salvar valor inicial
    if (input.value) {
        historicoCampos[idCampo].push(input.value);
    }

    input.addEventListener('focus', () => {
    if (historicoCampos[idCampo].length === 0 && input.value) {
        historicoCampos[idCampo].push(input.value);
    }
});

input.addEventListener('input', (e) => {
    if (e.detail && e.detail.isUndo) return;

    // ==========================================
    // FORÇA LIMPEZA DO SPAWN AO DIGITAR
    // ==========================================
    const mapa = input.getAttribute('data-mapa');
    const tipo = input.classList.contains('morteGigante') ? 'G' : 'B';
    const spawnKey = `spawn-${mapa}-${tipo}`;
    const tr = input.closest('tr');
    const campoTempo = tr.querySelector(tipo === 'G' ? '.tempo-restante-gigante' : '.tempo-restante-bandido');
    
    localStorage.removeItem(spawnKey);
    localStorage.removeItem(`${spawnKey}_time`);
    localStorage.removeItem(`spawn_start_${mapa}-${tipo}`);
    localStorage.removeItem(`foco-azul-${spawnKey}`);
    
    if (campoTempo) {
        delete campoTempo.dataset.spawnado;
        campoTempo.classList.remove('ultimo-spawn', 'mensagem-atualizacao', 'critico', 'muito-critico');
        if (!campoTempo.querySelector('.spawn-timer')) {
            campoTempo.innerText = '--:--:--';
        }
    }
    
    if (tr) {
        tr.classList.remove('linha-vermelha-gigante', 'linha-vermelha-bandido');
    }
    
    const chaveTimer = `${mapa}-${tipo}`;
    if (timersSpawn && timersSpawn[chaveTimer]) {
        clearInterval(timersSpawn[chaveTimer]);
        delete timersSpawn[chaveTimer];
    }

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
    
    // 🔥 ADICIONE ESTA LINHA AQUI - SALVA NO HISTÓRICO
    salvarNoHistorico(formatado === "" ? "" : formatado);
});

    // Teclas de atalho
    input.addEventListener('keydown', (e) => {
        // Ctrl + Z (Desfazer)
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();
            desfazer();
            return;
        }

        // Ctrl + Y (Refazer)
        if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
            e.preventDefault();
            e.stopPropagation();
            refazer();
            return;
        }

        // Ctrl + Shift + Z (Refazer - alternativa)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
            e.preventDefault();
            e.stopPropagation();
            refazer();
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

    const valorFinal = e.target.value;
salvarNoHistorico(valorFinal === "" ? "" : valorFinal);
    //limparFuturo();
});

// Função para debug (opcional - digitar no console)
window.verificarHistorico = function() {
    console.log('Histórico de campos:', historicoCampos);
    console.log('Histórico de refazer:', historicoFuturoCampos);
};


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

    // ==========================================
    // BOTÃO CANCELAR - FECHA O MODAL
    // ==========================================
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
        celula.classList.remove('ultimo-spawn', 'critico', 'muito-critico', 'mensagem-atualizacao'); // ADICIONE 'mensagem-atualizacao'
        delete celula.dataset.spawnado;    
    });

    document.querySelectorAll('tr').forEach(tr => {
        tr.classList.remove('linha-vermelha-gigante', 'linha-vermelha-bandido');
    });
    
    document.querySelectorAll('tr').forEach(tr => {
        const morteGigante = tr.querySelector('.morteGigante');
        if (morteGigante) {
            const mapa = morteGigante.getAttribute('data-mapa');
            localStorage.removeItem(`morte-${mapa}-Gigante`);
            localStorage.removeItem(`morte-${mapa}-Bandido`);
            localStorage.removeItem(`spawn-${mapa}-G`);
            localStorage.removeItem(`spawn-${mapa}-B`);
            localStorage.removeItem(`spawn_start_${mapa}-G`); // ADICIONE ESTA LINHA
            localStorage.removeItem(`spawn_start_${mapa}-B`); // ADICIONE ESTA LINHA
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
// BOTÃO MORTE INSTANTÂNEA - CORRIGIDO
// ==========================================
function marcarMorteInstantanea(botao) {
    console.log('🔴 Botão Morto clicado!');
    
    const container = botao.closest('.container-morto');
    if (!container) {
        console.error('❌ Container não encontrado');
        return;
    }
    
    const input = container.querySelector('input');
    if (!input) {
        console.error('❌ Input não encontrado');
        return;
    }
    
    const tr = botao.closest('tr');
    if (!tr) {
        console.error('❌ Tr não encontrado');
        return;
    }
    
    const infoTempo = obterHoraServerAtual();
    const mapa = input.getAttribute('data-mapa');
    const tipo = input.classList.contains('morteGigante') ? 'G' : 'B';
    const spawnKey = `spawn-${mapa}-${tipo}`;
    const chaveTimer = `${mapa}-${tipo}`;
    
    console.log(`🎯 Processando morte: Mapa=${mapa}, Tipo=${tipo}, Hora=${infoTempo.textoFormatado}`);
    
    // ==========================================
    // 1. REMOVE TODOS OS ESTADOS DE SPAWN
    // ==========================================
    
    // Remove do localStorage
    localStorage.removeItem(spawnKey);
    localStorage.removeItem(`${spawnKey}_time`);
    localStorage.removeItem(`spawn_start_${chaveTimer}`);
    localStorage.removeItem(`foco-azul-${spawnKey}`);
    
    // Para o timer se estiver rodando
    if (timersSpawn && timersSpawn[chaveTimer]) {
        clearInterval(timersSpawn[chaveTimer]);
        delete timersSpawn[chaveTimer];
        console.log(`⏹️ Timer parado para ${chaveTimer}`);
    }
    
    // ==========================================
    // 2. LIMPA A CÉLULA DE TEMPO RESTANTE
    // ==========================================
    
    const celulaRegressiva = tr.querySelector(tipo === 'G' ? '.tempo-restante-gigante' : '.tempo-restante-bandido');
    if (celulaRegressiva) {
        // Remove todas as classes e flags
        delete celulaRegressiva.dataset.spawnado;
        celulaRegressiva.classList.remove('ultimo-spawn', 'mensagem-atualizacao', 'critico', 'muito-critico');
        
        // Limpa o HTML interno (remove qualquer div de spawn)
        celulaRegressiva.innerHTML = '';
        
        // Reseta para o texto padrão
        celulaRegressiva.innerText = '--:--:--';
        console.log(`🧹 Célula de tempo restante limpa`);
    }
    
    // ==========================================
    // 3. REMOVE CLASSE DE FOCO DO CAMPO LOCAL
    // ==========================================
    
    const respLocal = tr.querySelector(tipo === 'G' ? '.respGiganteLocal' : '.respBandidoLocal');
    if (respLocal) {
        respLocal.classList.remove('alarme-foco');
    }
    
    // ==========================================
    // 4. REMOVE A LINHA VERMELHA (se o outro tipo também não estiver spawnado)
    // ==========================================
    
    const outroTipo = tipo === 'G' ? 'B' : 'G';
    const outroSpawnKey = `spawn-${mapa}-${outroTipo}`;
    const outroSpawnAtivo = localStorage.getItem(outroSpawnKey) === "true";
    
    if (!outroSpawnAtivo) {
        // Remove a classe de linha vermelha específica deste tipo
        const classeVermelha = tipo === 'G' ? 'linha-vermelha-gigante' : 'linha-vermelha-bandido';
        tr.classList.remove(classeVermelha);
        console.log(`🟢 Linha vermelha removida para ${tipo === 'G' ? 'Gigante' : 'Bandido'}`);
    } else {
        console.log(`⚠️ Outro tipo (${outroTipo}) ainda está spawnado, mantendo linha vermelha parcial`);
    }
    
    // ==========================================
    // 5. ATUALIZA O CAMPO DE MORTE COM A HORA ATUAL
    // ==========================================
    
    // Salva o valor atual no histórico antes de mudar
    const idCampo = mapa + "-" + tipo;
    if (historicoCampos && historicoCampos[idCampo]) {
        const valorAtual = input.value;
        if (valorAtual && valorAtual !== '--:--:--' && valorAtual !== '') {
            historicoCampos[idCampo].push(valorAtual);
            localStorage.setItem(`historico_${idCampo}`, JSON.stringify(historicoCampos[idCampo]));
        }
    }
    
    // Atualiza o valor do input
    const novaHora = infoTempo.textoFormatado;
    input.value = novaHora;
    console.log(`📝 Novo horário de morte: ${novaHora}`);
    
    // Dispara o evento para recalcular tudo
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    // ==========================================
    // 6. FORÇA O RECÁLCULO COMPLETO
    // ==========================================
    
    if (typeof calcular === 'function') {
        calcular();
        console.log(`🔄 Recálculo forçado`);
    }
    
    // ==========================================
    // 7. PEQUENO ATRASO PARA GARANTIR QUE O DOM ATUALIZOU
    // ==========================================
    
    setTimeout(() => {
        // Verifica se a célula realmente foi limpa
        if (celulaRegressiva && celulaRegressiva.innerText === '--:--:--') {
            console.log(`✅ Limpeza confirmada para ${mapa}-${tipo}`);
        } else if (celulaRegressiva) {
            console.warn(`⚠️ Limpeza pode não ter funcionado para ${mapa}-${tipo}, forçando novamente...`);
            celulaRegressiva.innerText = '--:--:--';
            celulaRegressiva.innerHTML = '';
            delete celulaRegressiva.dataset.spawnado;
        }
    }, 50);
    
    console.log(`✅ Processo de morte finalizado para ${mapa}-${tipo}`);
}

// Garantir que a função está disponível globalmente
window.marcarMorteInstantanea = marcarMorteInstantanea;

// Adicione event listeners para os botões de morte após o carregamento
document.querySelectorAll('.morte-button, .botao-morto, [data-morto]').forEach(btn => {
    btn.addEventListener('click', function() {
        marcarMorteInstantanea(this);
    });
});

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

// Função auxiliar para animar o label
function animarLabel(novoTexto) {
    if (!runLabel) return;
    
    // Adiciona classe de animação
    runLabel.style.animation = 'none';
    runLabel.offsetHeight; // Força reflow
    runLabel.style.animation = 'fadeSlideIn 0.25s ease-out';
    
    // Muda o texto
    runLabel.textContent = novoTexto;
    
    // Remove a animação depois
    setTimeout(() => {
        if (runLabel) runLabel.style.animation = '';
    }, 300);
}

// Funções atualizadas com animação
function play() {
    if (runActive) return;
    
    runActive = true;
    
    if (runInterval) clearInterval(runInterval);
    runInterval = setInterval(() => {
        if (runActive) {
            runTime++;
            updateDisplay();
        }
    }, 1000);
    
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '⏸';
    animarLabel('INICIADA:');  // ← Com animação
    
    if (cronometroSide) {
        cronometroSide.classList.add('run-ativo');
        cronometroSide.classList.remove('run-pausado', 'finalizado');
    }
}

function retomar() {
    if (runActive) return;
    
    runActive = true;
    
    if (runInterval) clearInterval(runInterval);
    runInterval = setInterval(() => {
        if (runActive) {
            runTime++;
            updateDisplay();
        }
    }, 1000);
    
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '⏸';
    animarLabel('RETOMADA:');  // ← Com animação
    
    if (cronometroSide) {
        cronometroSide.classList.add('run-ativo');
        cronometroSide.classList.remove('run-pausado', 'finalizado');
    }
}

function pause() {
    if (!runActive) return;
    
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    runActive = false;
    
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '▶';
    animarLabel('PAUSADA:');  // ← Com animação
    
    if (cronometroSide) {
        cronometroSide.classList.remove('run-ativo');
        cronometroSide.classList.add('run-pausado');
    }
}

function finalizar() {
    if (!runActive && runTime === 0) return;
    
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    runActive = false;
    
    const tempoFinal = formatRunTime(runTime);
    
    animarLabel('FINALIZADA:');  // ← Com animação
    if (runTimeDisplay) runTimeDisplay.textContent = `${tempoFinal}`;
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '▶';
    
    if (cronometroSide) {
        cronometroSide.classList.remove('run-ativo', 'run-pausado');
        cronometroSide.classList.add('finalizado');
    }
}

function resetar() {
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    runActive = false;
    runTime = 0;
    updateDisplay();
    
    animarLabel('REINICIADA:');  // ← Com animação
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '▶';
    if (cronometroSide) {
        cronometroSide.classList.remove('run-ativo', 'run-pausado', 'finalizado');
    }
    
    // Volta para "TEMPO:" após 2 segundos
    setTimeout(() => {
        if (runLabel && !runActive && runTime === 0) {
            animarLabel('TEMPO:');
        }
    }, 2000);
}

// ==========================================
// CRONÔMETRO - VERSÃO COM TEXTOS "ROTA" E PADRÃO "TEMPO:"
// ==========================================
let runTime = 0;
let runInterval = null;
let runActive = false;

const runTimeDisplay = document.getElementById('runTimeDisplay');
const runLabel = document.getElementById('runLabel');
const runPlayPauseBtn = document.getElementById('runPlayPauseBtn');
const runStopBtn = document.getElementById('runStopBtn');
const runResetBtn = document.getElementById('runResetBtn');
const cronometroSide = document.querySelector('.cronometro-box');

function formatRunTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay() {
    if (runTimeDisplay) runTimeDisplay.textContent = formatRunTime(runTime);
}

function animarLabel(novoTexto, corEspecial = false) {
    if (!runLabel) return;
    
    runLabel.style.animation = 'none';
    runLabel.offsetHeight;
    runLabel.style.animation = 'fadeSlideIn 0.3s ease-out';
    runLabel.textContent = novoTexto;
    
    // Se for finalizado, aplica cor amarela
    if (corEspecial) {
        runLabel.style.color = '#FFD700';
    } else {
        runLabel.style.color = '';
    }
    
    setTimeout(() => {
        if (runLabel) runLabel.style.animation = '';
    }, 300);
}

function play() {
    if (runActive) return;
    
    runActive = true;
    
    if (runInterval) clearInterval(runInterval);
    runInterval = setInterval(() => {
        if (runActive) {
            runTime++;
            updateDisplay();
        }
    }, 1000);
    
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '⏸';
    animarLabel('ROTA INICIADA:');
    
    // Remove a cor amarela se tiver
    if (runLabel) runLabel.style.color = '';
    if (runTimeDisplay) runTimeDisplay.style.color = '';
}

function pause() {
    if (!runActive) return;
    
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    runActive = false;
    
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '▶';
    animarLabel('ROTA PAUSADA:');
}

function retomar() {
    if (runActive) return;
    
    runActive = true;
    
    if (runInterval) clearInterval(runInterval);
    runInterval = setInterval(() => {
        if (runActive) {
            runTime++;
            updateDisplay();
        }
    }, 1000);
    
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '⏸';
    animarLabel('ROTA RETOMADA:');
    
    // Remove a cor amarela se tiver
    if (runLabel) runLabel.style.color = '';
    if (runTimeDisplay) runTimeDisplay.style.color = '';
}

function playPause() {
    if (runActive) {
        pause();
    } else {
        if (runTime > 0) {
            retomar();
        } else {
            play();
        }
    }
}

function finalizar() {
    if (!runActive && runTime === 0) return;
    
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    runActive = false;
    
    const tempoFinal = formatRunTime(runTime);
    
    animarLabel('ROTA FINALIZADA:', true); // true = cor amarela
    if (runTimeDisplay) {
        runTimeDisplay.textContent = `${tempoFinal}`;
        runTimeDisplay.style.color = '#FFD700'; // Deixa o tempo também em amarelo
    }
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '▶';
}

function resetar() {
    if (runInterval) {
        clearInterval(runInterval);
        runInterval = null;
    }
    runActive = false;
    runTime = 0;
    updateDisplay();
    
    animarLabel('ROTA REINICIADA:');
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '▶';
    
    // Remove a cor amarela se tiver
    if (runLabel) runLabel.style.color = '';
    if (runTimeDisplay) runTimeDisplay.style.color = '';
    
    // Volta para "TEMPO:" após 2 segundos
    setTimeout(() => {
        if (runLabel && !runActive && runTime === 0) {
            runLabel.textContent = 'TEMPO:';
            runLabel.style.animation = '';
        }
    }, 2000);
}

function comecarDoZero() {
    // Reseta o tempo
    runTime = 0;
    updateDisplay();
    
    // Remove cor amarela
    if (runLabel) runLabel.style.color = '';
    if (runTimeDisplay) runTimeDisplay.style.color = '';
    
    // Inicia o cronômetro
    runActive = true;
    
    if (runInterval) clearInterval(runInterval);
    runInterval = setInterval(() => {
        if (runActive) {
            runTime++;
            updateDisplay();
        }
    }, 1000);
    
    if (runPlayPauseBtn) runPlayPauseBtn.textContent = '⏸';
    animarLabel('ROTA INICIADA:');
}

function playPauseAtualizado() {
    // Verifica se está finalizado (tempo parado, não ativo, e tempo > 0)
    const estaFinalizado = !runActive && runTime > 0 && runLabel.textContent.includes('FINALIZADA');
    
    if (estaFinalizado) {
        // Se finalizado, começar do zero
        comecarDoZero();
    } else if (runActive) {
        pause();
    } else {
        if (runTime > 0) {
            retomar();
        } else {
            play();
        }
    }
}

// Eventos
if (runPlayPauseBtn) runPlayPauseBtn.onclick = playPauseAtualizado;
if (runStopBtn) runStopBtn.onclick = finalizar;
if (runResetBtn) runResetBtn.onclick = resetar;

// Inicializar
if (runLabel) runLabel.textContent = 'TEMPO:';
updateDisplay();


// ==========================================
// DESTAQUE PARA TEMPO CRÍTICO (5 minutos a 1 minuto)
// ==========================================

function aplicarDestaqueCritico(celula, segundosRestantes) {
    if (!celula) return;
    
    // Remove classes anteriores
    celula.classList.remove('critico', 'muito-critico');
    
    // Se já spawnou, não aplica destaque
    if (celula.dataset.spawnado === "true") return;
    
    // Aplica destaque baseado no tempo restante
    if (segundosRestantes <= 60) { // menos de 1 minuto
        celula.classList.add('muito-critico');
    } else if (segundosRestantes <= 300) { // menos de 5 minutos
        celula.classList.add('critico');
    }
}

// ==========================================
// RECUPERAR TIMERS APÓS RECARREGAR PÁGINA
// ==========================================
function recuperarTimersAposRecarregar() {
    console.log('🔁 Recuperando timers...');
    document.querySelectorAll('tr').forEach(tr => {
        const morteGigante = tr.querySelector('.morteGigante');
        if (!morteGigante) return;
        
        const mapa = morteGigante.getAttribute('data-mapa');
        
        // Verifica spawn do Gigante
        const spawnKeyG = `spawn-${mapa}-G`;
        if (localStorage.getItem(spawnKeyG) === "true") {
            const campoTempoG = tr.querySelector('.tempo-restante-gigante');
            if (campoTempoG && !campoTempoG.querySelector('.spawn-timer')) {
                const tipoSpawn = 'G';
                iniciarTimerSpawn(campoTempoG, mapa, tipoSpawn);
            }
        }
        
        // Verifica spawn do Bandido
        const spawnKeyB = `spawn-${mapa}-B`;
        if (localStorage.getItem(spawnKeyB) === "true") {
            const campoTempoB = tr.querySelector('.tempo-restante-bandido');
            if (campoTempoB && !campoTempoB.querySelector('.spawn-timer')) {
                const tipoSpawn = 'B';
                iniciarTimerSpawn(campoTempoB, mapa, tipoSpawn);
            }
        }
    });
}

// ==========================================
// BOTÕES DESFAZER E REFAZER - VERSÃO DEFINITIVA
// ==========================================
const btnDesfazer = document.getElementById('btn-desfazer');
const btnRefazer = document.getElementById('btn-refazer');

if (btnDesfazer) {
    btnDesfazer.onclick = function() {
        console.log("🔴 BOTÃO DESFAZER CLICADO");
        
        // Pega o campo que está com foco
        let activeInput = document.activeElement;
        
        // Se nenhum campo está focado, pega o último campo editado
        if (!activeInput || !(activeInput.classList.contains('morteGigante') || activeInput.classList.contains('morteBandido'))) {
            // Procura o primeiro campo que tem histórico
            for (const [id, pilha] of Object.entries(historicoCampos)) {
                if (pilha && pilha.length > 1) {
                    const [mapa, tipo] = id.split('-');
                    const seletor = tipo === 'G' ? '.morteGigante' : '.morteBandido';
                    activeInput = document.querySelector(`${seletor}[data-mapa="${mapa}"]`);
                    if (activeInput) break;
                }
            }
        }
        
        if (activeInput && (activeInput.classList.contains('morteGigante') || activeInput.classList.contains('morteBandido'))) {
            const idCampo = activeInput.dataset.mapa + "-" + (activeInput.classList.contains('morteGigante') ? 'G' : 'B');
            const pilha = historicoCampos[idCampo];
            const pilhaFuturo = historicoFuturoCampos[idCampo] || [];
            
            console.log(`📀 Desfazer em ${idCampo}`, { pilha, pilhaFuturo });
            
            if (pilha && pilha.length > 1) {
                // Salva o valor atual no futuro
                const valorAtual = activeInput.value;
                if (valorAtual && valorAtual !== '--:--:--') {
                    pilhaFuturo.push(valorAtual);
                    historicoFuturoCampos[idCampo] = pilhaFuturo;
                }
                
                // Remove o atual e pega o anterior
                pilha.pop();
                const valorAnterior = pilha[pilha.length - 1];
                activeInput.value = valorAnterior || "";
                
                // Força atualização
                activeInput.dispatchEvent(new Event('input', { bubbles: true }));
                calcular();
                
                // Salva no localStorage
                localStorage.setItem(`historico_${idCampo}`, JSON.stringify(pilha));
                localStorage.setItem(`futuro_${idCampo}`, JSON.stringify(pilhaFuturo));
                
                console.log(`✅ Desfazer concluído. Novo valor: ${valorAnterior}`);
            } else {
                console.log("⚠️ Não há histórico para desfazer");
            }
        } else {
            console.log("⚠️ Nenhum campo de horário está focado ou com histórico");
        }
    };
}

if (btnRefazer) {
    btnRefazer.onclick = function() {
        console.log("🟢 BOTÃO REFAZER CLICADO");
        
        // Pega o campo que está com foco
        let activeInput = document.activeElement;
        
        // Se nenhum campo está focado, pega o primeiro campo que tem futuro
        if (!activeInput || !(activeInput.classList.contains('morteGigante') || activeInput.classList.contains('morteBandido'))) {
            for (const [id, pilhaFuturo] of Object.entries(historicoFuturoCampos)) {
                if (pilhaFuturo && pilhaFuturo.length > 0) {
                    const [mapa, tipo] = id.split('-');
                    const seletor = tipo === 'G' ? '.morteGigante' : '.morteBandido';
                    activeInput = document.querySelector(`${seletor}[data-mapa="${mapa}"]`);
                    if (activeInput) break;
                }
            }
        }
        
        if (activeInput && (activeInput.classList.contains('morteGigante') || activeInput.classList.contains('morteBandido'))) {
            const idCampo = activeInput.dataset.mapa + "-" + (activeInput.classList.contains('morteGigante') ? 'G' : 'B');
            const pilhaFuturo = historicoFuturoCampos[idCampo] || [];
            
            console.log(`📀 Refazer em ${idCampo}`, { pilhaFuturo });
            
            if (pilhaFuturo.length > 0) {
                // Pega o próximo valor
                const valorProximo = pilhaFuturo.pop();
                
                // Salva o valor atual no histórico
                const valorAtual = activeInput.value;
                if (valorAtual && valorAtual !== '--:--:--') {
                    if (!historicoCampos[idCampo]) historicoCampos[idCampo] = [];
                    historicoCampos[idCampo].push(valorAtual);
                }
                
                activeInput.value = valorProximo;
                
                // Força atualização
                activeInput.dispatchEvent(new Event('input', { bubbles: true }));
                calcular();
                
                // Salva no localStorage
                localStorage.setItem(`historico_${idCampo}`, JSON.stringify(historicoCampos[idCampo]));
                localStorage.setItem(`futuro_${idCampo}`, JSON.stringify(pilhaFuturo));
                
                console.log(`✅ Refazer concluído. Novo valor: ${valorProximo}`);
            } else {
                console.log("⚠️ Não há histórico para refazer");
            }
        } else {
            console.log("⚠️ Nenhum campo de horário está focado ou com futuro");
        }
    };
}
// ==========================================
// FORÇAR LIMPEZA DE SPAWNS ANTIGOS AO CARREGAR
// ==========================================
function limparSpawnsAntigos() {
    // COMENTADO PARA NÃO PERDER OS DADOS AO RECARREGAR
    // for (let i = 0; i < localStorage.length; i++) {
    //     const key = localStorage.key(i);
    //     if (key && (key.startsWith('spawn-') || key.startsWith('spawn_start_') || key.startsWith('foco-azul-'))) {
    //         localStorage.removeItem(key);
    //         console.log('🗑️ Spawn antigo removido:', key);
    //     }
    // }
    console.log('⚠️ Limpeza de spawns desativada para preservar dados');
}

// ==========================================
// FORÇAR LIMPEZA TOTAL DE FUNDO
// ==========================================
function forcarLimpezaTotalBackground() {
    document.querySelectorAll('tr').forEach(tr => {
        // Remove classes
        tr.classList.remove('linha-vermelha-gigante');
        tr.classList.remove('linha-vermelha-bandido');
        
        // Remove estilos inline
        tr.style.backgroundColor = '';
        tr.style.background = '';
        
        // Limpa as células também
        const celulas = tr.querySelectorAll('.tempo-restante-gigante, .tempo-restante-bandido');
        celulas.forEach(celula => {
            celula.style.backgroundColor = '';
            celula.style.background = '';
            celula.classList.remove('mensagem-atualizacao');
        });
    });
}

// Chame esta função depois de calcular
const calcularOriginal = calcular;
calcular = function() {
    calcularOriginal();
    setTimeout(forcarLimpezaTotalBackground, 50);
};

// ==========================================
// TABELA DE SPAWNS (GIGANTES + BANDIDOS)
// ==========================================

// Gigantes
const gigantes = [
    { nome: 'Coelophysis', imagem: 'imagens/coeloc.jpeg' },
    { nome: 'Centrosaurus', imagem: 'imagens/centroc.jpeg' },
    { nome: 'Carnotaurus', imagem: 'imagens/carnoc.jpeg' },
    { nome: 'Paquicefalossauro', imagem: 'imagens/pachyc.jpeg' },
    { nome: 'Brachiosaurus', imagem: 'imagens/brachyc.jpeg' },
    { nome: 'Parasaurolophus', imagem: 'imagens/parac.jpeg' },
    { nome: 'Ankylosaurus', imagem: 'imagens/ankyc.jpeg' },
    { nome: 'T-rex', imagem: 'imagens/rexc.jpeg' }
];

// Bandidos
const bandidos = [
    { nome: 'Martelo', imagem: 'imagens/martelos.jpeg' },
    { nome: 'Colt', imagem: 'imagens/colts.jpeg' },
    { nome: 'Paci', imagem: 'imagens/pacis.jpeg' },
    { nome: 'Gat', imagem: 'imagens/gats.jpeg' },
    { nome: 'Yager', imagem: 'imagens/yagers.jpeg' },
    { nome: 'Show', imagem: 'imagens/shows.jpeg' }
];

// ==========================================
// LOCALSTORAGE
// ==========================================

function getChaveGigante(giganteIndex) {
    return `spawn_gigante_${giganteIndex}`;
}

function getChaveBandido(giganteIndex, bandidoIndex) {
    return `spawn_bandido_${giganteIndex}_${bandidoIndex}`;
}

function carregarGigante(giganteIndex) {
    const chave = getChaveGigante(giganteIndex);
    const salvo = localStorage.getItem(chave);
    return salvo === null ? 0 : Number(salvo);
}

function salvarGigante(giganteIndex, valor) {
    const chave = getChaveGigante(giganteIndex);
    if (valor <= 0) {
        localStorage.removeItem(chave);
    } else {
        localStorage.setItem(chave, valor.toString());
    }
}

function carregarBandido(giganteIndex, bandidoIndex) {
    const chave = getChaveBandido(giganteIndex, bandidoIndex);
    const salvo = localStorage.getItem(chave);
    return salvo === null ? 0 : Number(salvo);
}

function salvarBandido(giganteIndex, bandidoIndex, valor) {
    const chave = getChaveBandido(giganteIndex, bandidoIndex);
    if (valor <= 0) {
        localStorage.removeItem(chave);
    } else {
        localStorage.setItem(chave, valor.toString());
    }
}

function limparTodos() {
    if (confirm('⚠️ TEM CERTEZA? Isso vai apagar TODOS os contadores!')) {
        for (let i = 0; i < gigantes.length; i++) {
            localStorage.removeItem(getChaveGigante(i));
            for (let j = 0; j < bandidos.length; j++) {
                localStorage.removeItem(getChaveBandido(i, j));
            }
        }
        alert('✅ Todos os dados foram limpos!');
        location.reload();
    }
}

// ==========================================
// BOTÃO FLUTUANTE (MAIOR)
// ==========================================

function criarBotaoFlutuante() {
    const botao = document.createElement('button');
    botao.innerHTML = '📋';
    botao.style.position = 'fixed';
    botao.style.right = '25px';
    botao.style.top = '50%';
    botao.style.transform = 'translateY(-50%)';
    botao.style.width = '75px';
    botao.style.height = '75px';
    botao.style.borderRadius = '50%';
    botao.style.background = 'linear-gradient(135deg, #FF9800, #F57C00)';
    botao.style.border = 'none';
    botao.style.fontSize = '38px';
    botao.style.cursor = 'pointer';
    botao.style.zIndex = '999';
    botao.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    botao.style.transition = 'all 0.3s ease';
    
    botao.onmouseenter = () => {
        botao.style.transform = 'translateY(-50%) scale(1.1)';
        botao.style.boxShadow = '0 6px 20px rgba(255, 152, 0, 0.6)';
    };
    botao.onmouseleave = () => {
        botao.style.transform = 'translateY(-50%) scale(1)';
        botao.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
    };
    
    botao.onclick = abrirModal;
    document.body.appendChild(botao);
}

// ==========================================
// MODAL COM DUAS TABELAS
// ==========================================

function abrirModal() {
    const modalAntigo = document.getElementById('modal-spawns');
    if (modalAntigo) modalAntigo.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'modal-spawns';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.92)';
    overlay.style.backdropFilter = 'blur(5px)';
    overlay.style.zIndex = '10000';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    
    const modal = document.createElement('div');
    modal.style.backgroundColor = '#1a1a2e';
    modal.style.borderRadius = '24px';
    modal.style.padding = '25px 30px';
    modal.style.border = '3px solid #FF9800';
    modal.style.width = '95%';
    modal.style.maxWidth = '1600px';
    modal.style.height = '92vh';
    modal.style.overflow = 'auto';
    modal.style.boxShadow = '0 25px 50px rgba(0,0,0,0.5)';
    
    // TÍTULO PRINCIPAL (MAIOR)
    const titulo = document.createElement('h2');
    titulo.innerHTML = '🦖 CONTROLE DE SPAWNS 🗡️';
    titulo.style.textAlign = 'center';
    titulo.style.color = '#FF9800';
    titulo.style.fontSize = '42px';
    titulo.style.margin = '0 0 15px 0';
    titulo.style.fontWeight = 'bold';
    modal.appendChild(titulo);
    
    // INSTRUÇÕES (MAIOR)
    const instrucoes = document.createElement('div');
    instrucoes.innerHTML = '💡 Clique = +1 | Clique com BOTÃO DIREITO = -1 | Botão vermelho = LIMPAR TUDO';
    instrucoes.style.textAlign = 'center';
    instrucoes.style.color = '#ccc';
    instrucoes.style.fontSize = '18px';
    instrucoes.style.marginBottom = '25px';
    instrucoes.style.padding = '12px';
    instrucoes.style.backgroundColor = '#16213e';
    instrucoes.style.borderRadius = '12px';
    modal.appendChild(instrucoes);
    
    // ==========================================
    // TABELA 1: GIGANTES
    // ==========================================
    
    const tituloGigantes = document.createElement('h3');
    tituloGigantes.innerHTML = '🦕 GIGANTES';
    tituloGigantes.style.color = '#FF9800';
    tituloGigantes.style.fontSize = '34px';
    tituloGigantes.style.margin = '30px 0 20px 0';
    tituloGigantes.style.textAlign = 'center';
    modal.appendChild(tituloGigantes);
    
    const tabelaGigantes = document.createElement('table');
    tabelaGigantes.style.width = 'auto';
    tabelaGigantes.style.minWidth = '600px';
    tabelaGigantes.style.margin = '0 auto';
    tabelaGigantes.style.borderCollapse = 'collapse';
    tabelaGigantes.style.backgroundColor = '#0f0f1a';
    tabelaGigantes.style.borderRadius = '16px';
    tabelaGigantes.style.overflow = 'hidden';
    tabelaGigantes.style.marginBottom = '40px';
    
    const theadG = document.createElement('thead');
    const linhaHeadG = document.createElement('tr');
    
    const thNomeG = document.createElement('th');
    thNomeG.textContent = 'GIGANTE';
    thNomeG.style.padding = '20px 30px';
    thNomeG.style.backgroundColor = '#FF9800';
    thNomeG.style.color = '#1a1a2e';
    thNomeG.style.fontSize = '24px';
    thNomeG.style.fontWeight = 'bold';
    thNomeG.style.textAlign = 'left';
    linhaHeadG.appendChild(thNomeG);
    
    const thContG = document.createElement('th');
    thContG.textContent = 'SPAWNS';
    thContG.style.padding = '20px 30px';
    thContG.style.backgroundColor = '#FF9800';
    thContG.style.color = '#1a1a2e';
    thContG.style.fontSize = '24px';
    thContG.style.fontWeight = 'bold';
    thContG.style.textAlign = 'center';
    linhaHeadG.appendChild(thContG);
    
    theadG.appendChild(linhaHeadG);
    tabelaGigantes.appendChild(theadG);
    
    const tbodyG = document.createElement('tbody');
    
    for (let i = 0; i < gigantes.length; i++) {
        const linha = document.createElement('tr');
        
        const celulaDino = document.createElement('td');
        celulaDino.style.display = 'flex';
        celulaDino.style.alignItems = 'center';
        celulaDino.style.gap = '25px';
        celulaDino.style.padding = '18px 25px';
        celulaDino.style.backgroundColor = '#16213e';
        celulaDino.style.border = '1px solid #FF9800';
        
        const imgDino = document.createElement('img');
        imgDino.src = gigantes[i].imagem;
        imgDino.style.width = '90px';
        imgDino.style.height = '90px';
        imgDino.style.objectFit = 'cover';
        imgDino.style.borderRadius = '16px';
        imgDino.style.border = '2px solid #FF9800';
        
        const nomeDino = document.createElement('span');
        nomeDino.textContent = gigantes[i].nome;
        nomeDino.style.fontSize = '22px';
        nomeDino.style.fontWeight = 'bold';
        nomeDino.style.color = '#FF9800';
        
        celulaDino.appendChild(imgDino);
        celulaDino.appendChild(nomeDino);
        linha.appendChild(celulaDino);
        
        const celulaCont = document.createElement('td');
        celulaCont.style.padding = '18px 25px';
        celulaCont.style.textAlign = 'center';
        celulaCont.style.backgroundColor = '#16213e';
        celulaCont.style.border = '1px solid #FF9800';
        
        const contador = document.createElement('div');
        const valorInicial = carregarGigante(i);
        
        contador.textContent = valorInicial;
        contador.style.width = '110px';
        contador.style.height = '110px';
        contador.style.display = 'flex';
        contador.style.alignItems = 'center';
        contador.style.justifyContent = 'center';
        contador.style.backgroundColor = valorInicial > 0 ? '#4CAF50' : '#2a2a3a';
        contador.style.borderRadius = '20px';
        contador.style.fontSize = '42px';
        contador.style.fontWeight = 'bold';
        contador.style.color = 'white';
        contador.style.cursor = 'pointer';
        contador.style.border = valorInicial > 0 ? '3px solid #FF9800' : '2px solid #555';
        contador.style.margin = '0 auto';
        
        contador.dataset.index = i;
        
        contador.onclick = function() {
            const idx = Number(this.dataset.index);
            let valor = carregarGigante(idx);
            valor++;
            salvarGigante(idx, valor);
            this.textContent = valor;
            this.style.backgroundColor = valor > 0 ? '#4CAF50' : '#2a2a3a';
            this.style.borderColor = valor > 0 ? '#FF9800' : '#555';
        };
        
        contador.oncontextmenu = function(e) {
            e.preventDefault();
            const idx = Number(this.dataset.index);
            let valor = carregarGigante(idx);
            if (valor > 0) {
                valor--;
                salvarGigante(idx, valor);
                this.textContent = valor;
                this.style.backgroundColor = valor > 0 ? '#4CAF50' : '#2a2a3a';
                this.style.borderColor = valor > 0 ? '#FF9800' : '#555';
            }
            return false;
        };
        
        celulaCont.appendChild(contador);
        linha.appendChild(celulaCont);
        tbodyG.appendChild(linha);
    }
    tabelaGigantes.appendChild(tbodyG);
    modal.appendChild(tabelaGigantes);
    
    // ==========================================
    // TABELA 2: BANDIDOS
    // ==========================================
    
    const tituloBandidos = document.createElement('h3');
    tituloBandidos.innerHTML = '🗡️ BANDIDOS 🗡️';
    tituloBandidos.style.color = '#FF9800';
    tituloBandidos.style.fontSize = '34px';
    tituloBandidos.style.margin = '30px 0 20px 0';
    tituloBandidos.style.textAlign = 'center';
    modal.appendChild(tituloBandidos);
    
    const tabelaBandidos = document.createElement('table');
    tabelaBandidos.style.width = '100%';
    tabelaBandidos.style.borderCollapse = 'collapse';
    tabelaBandidos.style.backgroundColor = '#0f0f1a';
    tabelaBandidos.style.borderRadius = '16px';
    tabelaBandidos.style.overflow = 'hidden';
    
    const theadB = document.createElement('thead');
    const linhaHeadB = document.createElement('tr');
    
    const thNomeB = document.createElement('th');
    thNomeB.textContent = 'GIGANTE';
    thNomeB.style.padding = '20px';
    thNomeB.style.backgroundColor = '#FF9800';
    thNomeB.style.color = '#1a1a2e';
    thNomeB.style.fontSize = '22px';
    thNomeB.style.fontWeight = 'bold';
    thNomeB.style.width = '300px';
    thNomeB.style.textAlign = 'left';
    linhaHeadB.appendChild(thNomeB);
    
    for (let i = 0; i < bandidos.length; i++) {
        const th = document.createElement('th');
        th.style.padding = '18px 12px';
        th.style.backgroundColor = '#FF9800';
        th.style.textAlign = 'center';
        th.style.width = '140px';
        
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.gap = '12px';
        
        const imgArma = document.createElement('img');
        imgArma.src = bandidos[i].imagem;
        imgArma.style.width = '65px';
        imgArma.style.height = '65px';
        imgArma.style.objectFit = 'cover';
        imgArma.style.borderRadius = '14px';
        imgArma.style.border = '2px solid #fff';
        
        const nomeArma = document.createElement('span');
        nomeArma.textContent = bandidos[i].nome;
        nomeArma.style.fontSize = '16px';
        nomeArma.style.fontWeight = 'bold';
        nomeArma.style.color = '#1a1a2e';
        
        container.appendChild(imgArma);
        container.appendChild(nomeArma);
        th.appendChild(container);
        linhaHeadB.appendChild(th);
    }
    theadB.appendChild(linhaHeadB);
    tabelaBandidos.appendChild(theadB);
    
    const tbodyB = document.createElement('tbody');
    
    for (let i = 0; i < gigantes.length; i++) {
        const linha = document.createElement('tr');
        
        const celulaDino = document.createElement('td');
        celulaDino.style.display = 'flex';
        celulaDino.style.alignItems = 'center';
        celulaDino.style.gap = '20px';
        celulaDino.style.padding = '16px 20px';
        celulaDino.style.backgroundColor = '#16213e';
        celulaDino.style.border = '1px solid #FF9800';
        
        const imgDino = document.createElement('img');
        imgDino.src = gigantes[i].imagem;
        imgDino.style.width = '70px';
        imgDino.style.height = '70px';
        imgDino.style.objectFit = 'cover';
        imgDino.style.borderRadius = '14px';
        imgDino.style.border = '2px solid #FF9800';
        
        const nomeDino = document.createElement('span');
        nomeDino.textContent = gigantes[i].nome;
        nomeDino.style.fontSize = '18px';
        nomeDino.style.fontWeight = 'bold';
        nomeDino.style.color = '#FF9800';
        
        celulaDino.appendChild(imgDino);
        celulaDino.appendChild(nomeDino);
        linha.appendChild(celulaDino);
        
        for (let j = 0; j < bandidos.length; j++) {
            const celulaContador = document.createElement('td');
            celulaContador.style.padding = '14px';
            celulaContador.style.border = '1px solid #FF9800';
            celulaContador.style.textAlign = 'center';
            celulaContador.style.backgroundColor = '#16213e';
            
            const contador = document.createElement('div');
            const valorInicial = carregarBandido(i, j);
            
            contador.textContent = valorInicial;
            contador.style.width = '80px';
            contador.style.height = '80px';
            contador.style.display = 'flex';
            contador.style.alignItems = 'center';
            contador.style.justifyContent = 'center';
            contador.style.backgroundColor = valorInicial > 0 ? '#4CAF50' : '#2a2a3a';
            contador.style.borderRadius = '18px';
            contador.style.fontSize = '32px';
            contador.style.fontWeight = 'bold';
            contador.style.color = 'white';
            contador.style.cursor = 'pointer';
            contador.style.border = valorInicial > 0 ? '3px solid #FF9800' : '2px solid #555';
            contador.style.margin = '0 auto';
            
            contador.dataset.gigante = i;
            contador.dataset.bandido = j;
            
            contador.onclick = function() {
                const g = Number(this.dataset.gigante);
                const b = Number(this.dataset.bandido);
                let valor = carregarBandido(g, b);
                valor++;
                salvarBandido(g, b, valor);
                this.textContent = valor;
                this.style.backgroundColor = valor > 0 ? '#4CAF50' : '#2a2a3a';
                this.style.borderColor = valor > 0 ? '#FF9800' : '#555';
            };
            
            contador.oncontextmenu = function(e) {
                e.preventDefault();
                const g = Number(this.dataset.gigante);
                const b = Number(this.dataset.bandido);
                let valor = carregarBandido(g, b);
                if (valor > 0) {
                    valor--;
                    salvarBandido(g, b, valor);
                    this.textContent = valor;
                    this.style.backgroundColor = valor > 0 ? '#4CAF50' : '#2a2a3a';
                    this.style.borderColor = valor > 0 ? '#FF9800' : '#555';
                }
                return false;
            };
            
            celulaContador.appendChild(contador);
            linha.appendChild(celulaContador);
        }
        
        tbodyB.appendChild(linha);
    }
    tabelaBandidos.appendChild(tbodyB);
    modal.appendChild(tabelaBandidos);
    
    // BOTÕES DO RODAPÉ (MAIORES)
    const containerBotoes = document.createElement('div');
    containerBotoes.style.display = 'flex';
    containerBotoes.style.gap = '20px';
    containerBotoes.style.marginTop = '40px';
    
    const btnLimpar = document.createElement('button');
    btnLimpar.textContent = '🗑️ LIMPAR TUDO';
    btnLimpar.style.flex = '1';
    btnLimpar.style.padding = '18px';
    btnLimpar.style.borderRadius = '40px';
    btnLimpar.style.backgroundColor = '#ff5252';
    btnLimpar.style.color = 'white';
    btnLimpar.style.border = 'none';
    btnLimpar.style.fontSize = '20px';
    btnLimpar.style.fontWeight = 'bold';
    btnLimpar.style.cursor = 'pointer';
    btnLimpar.style.transition = 'all 0.2s ease';
    btnLimpar.onmouseenter = () => btnLimpar.style.opacity = '0.9';
    btnLimpar.onmouseleave = () => btnLimpar.style.opacity = '1';
    btnLimpar.onclick = limparTodos;
    containerBotoes.appendChild(btnLimpar);
    
    const btnFechar = document.createElement('button');
    btnFechar.textContent = '✖️ FECHAR';
    btnFechar.style.flex = '1';
    btnFechar.style.padding = '18px';
    btnFechar.style.borderRadius = '40px';
    btnFechar.style.backgroundColor = '#555';
    btnFechar.style.color = 'white';
    btnFechar.style.border = 'none';
    btnFechar.style.fontSize = '20px';
    btnFechar.style.fontWeight = 'bold';
    btnFechar.style.cursor = 'pointer';
    btnFechar.style.transition = 'all 0.2s ease';
    btnFechar.onmouseenter = () => btnFechar.style.backgroundColor = '#777';
    btnFechar.onmouseleave = () => btnFechar.style.backgroundColor = '#555';
    btnFechar.onclick = () => overlay.remove();
    containerBotoes.appendChild(btnFechar);
    
    modal.appendChild(containerBotoes);
    overlay.appendChild(modal);
    
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.remove();
    };
    
    document.body.appendChild(overlay);
}

window.addEventListener('load', criarBotaoFlutuante);
// ==========================================
// 20. INIT
// ==========================================
window.onload = function() {
    // limparSpawnsAntigos(); // ← ADICIONE ESTA LINHA AQUI

    carregarDadosSalvos(); // ← ADICIONE ESTA LINHA
    
    
    setTimeout(() => {
        paginaCarregada = true;
        recuperarTimersAposRecarregar();
    }, 1000);
    // FORÇAR tamanho inicial do textarea SEMPRE
    const campoColar = document.getElementById('campo-colar');
    if (campoColar) {
        campoColar.style.removeProperty('resize');
        campoColar.setAttribute('style', '');
        campoColar.style.width = '600px';
        campoColar.style.height = '55px';
        console.log('Textarea resetado para tamanho inicial 600x55');
    }
    
    const container = document.querySelector('.colar-container');
    if (container && campoColar) {
        const style = getComputedStyle(container);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const borderLeft = parseFloat(style.borderLeftWidth) || 0;
        const borderRight = parseFloat(style.borderRightWidth) || 0;
        container.style.width = `${campoColar.offsetWidth + paddingLeft + paddingRight + borderLeft + borderRight}px`;
    }
};

// Faz o container acompanhar o textarea quando redimensionado
const colarContainer = document.querySelector('.colar-container');
if (campoColar && colarContainer && typeof ResizeObserver !== 'undefined') {
    const updateContainerWidth = () => {
        const style = getComputedStyle(colarContainer);
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const borderLeft = parseFloat(style.borderLeftWidth) || 0;
        const borderRight = parseFloat(style.borderRightWidth) || 0;
        const targetWidth = campoColar.offsetWidth + paddingLeft + paddingRight + borderLeft + borderRight;
        colarContainer.style.width = `${targetWidth}px`;
    };

    updateContainerWidth();
    const resizeObserver = new ResizeObserver(updateContainerWidth);
    resizeObserver.observe(campoColar);
}
});  // ← FECHA O DOMContentLoaded ou window.onload