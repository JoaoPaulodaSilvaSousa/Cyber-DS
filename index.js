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

// Mapeamento de mapas
const mapaMapping = {
    'GF': 'GF', 'GOLDFIELDS': 'GF', 'GOLD FIELDS': 'GF', 'GOLD': 'GF',
    'MW': 'MW', 'MOKON WOODS': 'MW', 'MOKONWOODS': 'MW', 'MOKON': 'MW', 'WOODS': 'MW', 'MK': 'MW',
    'GV': 'GV', 'GREEN VOLCANO': 'GV', 'GREENVOLCANO': 'GV', 'GREEN': 'GV', 'VOLCANO': 'GV',
    'CCV': 'CCV', 'CV': 'CCV', 'COLDCLAW VALLEY': 'CCV', 'COLDCLAWVALLEY': 'CCV', 'COLDCLAW': 'CCV', 'VALLEY': 'CCV', 'COLD': 'CCV',
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
    // NOVO FORMATO ESTRUTURADO (Morte Gigante: Morto – 19:36:08)
    // ==========================================
    
    // Morte Gigante: Morto – 19:36:08
    let morteGiganteMatch = linhaLimpa.match(/Morte\s+Gigante:\s*Morto\s*[–\-]\s*(\d{1,2}:\d{2}:\d{2})/i);
    if (morteGiganteMatch) {
        return { horaGigante: converterHoraPara24h(morteGiganteMatch[1]) };
    }
    
    // Morte Bandido: Morto – 19:39:50
    let morteBandidoMatch = linhaLimpa.match(/Morte\s+Bandido:\s*Morto\s*[–\-]\s*(\d{1,2}:\d{2}:\d{2})/i);
    if (morteBandidoMatch) {
        return { horaBandido: converterHoraPara24h(morteBandidoMatch[1]) };
    }
    
    // Respawn Gigante (Server): 22:36:08 (ignorar)
    let respGiganteMatch = linhaLimpa.match(/Respawn\s+Gigante\s*\(Server\):\s*(\d{1,2}:\d{2}:\d{2})/i);
    if (respGiganteMatch) {
        return null;
    }
    
    // Respawn Bandido (Server): 22:39:50 (ignorar)
    let respBandidoMatch = linhaLimpa.match(/Respawn\s+Bandido\s*\(Server\):\s*(\d{1,2}:\d{2}:\d{2})/i);
    if (respBandidoMatch) {
        return null;
    }
    
    // ==========================================
    // FORMATO MAPA (GF, MW, GV, CCV, MM)
    // ==========================================
    let mapaMatch = linhaLimpa.match(/^(GF|MW|GV|CCV|MM)$/i);
    if (mapaMatch) {
        return { mapa: normalizarMapa(mapaMatch[1]), pending: true };
    }
    
    // ==========================================
    // FORMATO CSV: GF,21:46:36,21:51:20
    // ==========================================
    let csvMatch = linhaLimpa.match(/^([A-Za-z]{2,3}),(\d{1,2}:\d{2}:\d{2}),(\d{1,2}:\d{2}:\d{2})$/i);
    if (csvMatch) {
        return {
            mapa: normalizarMapa(csvMatch[1]),
            horaGigante: converterHoraPara24h(csvMatch[2]),
            horaBandido: converterHoraPara24h(csvMatch[3])
        };
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
    // FORMATO SIMPLES: GF 14:30:00 15:30:00
    // ==========================================
    let match = linhaLimpa.match(/^([A-Za-z\s\-]{2,10})\s+(\d{1,2}:\d{2}:\d{2}(?:\s*[ap]\.?\s*m\.?)?)\s+(\d{1,2}:\d{2}:\d{2}(?:\s*[ap]\.?\s*m\.?)?)/i);
    if (match) {
        return {
            mapa: normalizarMapa(match[1]),
            horaGigante: converterHoraPara24h(match[2]),
            horaBandido: converterHoraPara24h(match[3])
        };
    }
    
    // ==========================================
    // FORMATO INVERTIDO: 14:30:00 15:30:00 GF
    // ==========================================
    match = linhaLimpa.match(/(\d{1,2}:\d{2}:\d{2}(?:\s*[ap]\.?\s*m\.?)?)\s+(\d{1,2}:\d{2}:\d{2}(?:\s*[ap]\.?\s*m\.?)?)\s+([A-Za-z\s\-]{2,10})$/i);
    if (match) {
        return {
            mapa: normalizarMapa(match[3]),
            horaGigante: converterHoraPara24h(match[1]),
            horaBandido: converterHoraPara24h(match[2])
        };
    }
    
    // ==========================================
    // FORMATO TEXTO LIVRE: GF as 21:46:36 e 21:51:20
    // ==========================================
    let mapaLivro = linhaLimpa.match(/\b(GF|MW|GV|CCV|MM|Gf|Mw|Gv|Ccv|Mm)\b/i);
    let horas = linhaLimpa.match(/(\d{1,2}:\d{2}:\d{2})/g);
    if (mapaLivro && horas && horas.length >= 2) {
        return {
            mapa: normalizarMapa(mapaLivro[1]),
            horaGigante: converterHoraPara24h(horas[0]),
            horaBandido: converterHoraPara24h(horas[1])
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

function processarTextoColado(texto) {
    console.log('Processando texto...');
    const linhas = texto.split('\n');
    let encontrados = 0;
    const mapasEncontrados = [];
    let mapaAtual = null;
    let horaGiganteAtual = null;
    let horaBandidoAtual = null;
    
    for (const linha of linhas) {
        if (linha.trim().length === 0) continue;
        
        // Pular linhas que contém "RESP." ou "TEMPO RESTANTE" (não são horários de morte)
        if (linha.match(/RESP\.|TEMPO RESTANTE|RESPAWN/i)) {
            continue;
        }
        
        const dados = extrairDados(linha);
        if (!dados) continue;
        
        // Se tem mapa pendente
        if (dados.pending && dados.mapa) {
            if (mapaAtual && horaGiganteAtual && horaBandidoAtual) {
                preencherMapa(mapaAtual, horaGiganteAtual, horaBandidoAtual, mapasEncontrados);
                encontrados += 2;
            }
            mapaAtual = dados.mapa;
            horaGiganteAtual = null;
            horaBandidoAtual = null;
            continue;
        }
        
        // Acumular horas
        if (dados.horaGigante) horaGiganteAtual = dados.horaGigante;
        if (dados.horaBandido) horaBandidoAtual = dados.horaBandido;
        
        // Se tem tudo junto
        if (dados.mapa && dados.horaGigante && dados.horaBandido) {
            preencherMapa(dados.mapa, dados.horaGigante, dados.horaBandido, mapasEncontrados);
            encontrados += 2;
            continue;
        }
        
        // Se acumulou tudo
        if (mapaAtual && horaGiganteAtual && horaBandidoAtual) {
            preencherMapa(mapaAtual, horaGiganteAtual, horaBandidoAtual, mapasEncontrados);
            encontrados += 2;
            mapaAtual = null;
            horaGiganteAtual = null;
            horaBandidoAtual = null;
        }
    }
    
    // Final pendente
    if (mapaAtual && horaGiganteAtual && horaBandidoAtual) {
        preencherMapa(mapaAtual, horaGiganteAtual, horaBandidoAtual, mapasEncontrados);
        encontrados += 2;
    }
    
    if (typeof calcular === 'function') calcular();
    
    const container = campoColar ? campoColar.parentNode : document.body;
    const statusDiv = document.createElement('div');
    if (encontrados > 0) {
        statusDiv.innerHTML = `✅ ${encontrados} horários preenchidos (${mapasEncontrados.length} mapas)`;
        statusDiv.style.color = '#4CAF50';
    } else {
        statusDiv.innerHTML = `❌ Nenhum horário encontrado. Tente outro formato.`;
        statusDiv.style.color = '#ff5252';
    }
    statusDiv.style.cssText = 'font-size: 12px; margin-top: 8px; text-align: center; font-weight: bold; padding: 5px; border-radius: 8px;';
    container.appendChild(statusDiv);
    setTimeout(() => statusDiv.remove(), 5000);
    
    if (campoColar) campoColar.value = '';
    console.log(`Processamento concluído: ${encontrados} horários`);
    return encontrados;
}

// Evento do botão PREENCHER HORÁRIOS
if (btnColarTexto) {
    const novoBtn = btnColarTexto.cloneNode(true);
    btnColarTexto.parentNode.replaceChild(novoBtn, btnColarTexto);
    
    novoBtn.onclick = function() {
        console.log('Botão PREENCHER HORÁRIOS clicado');
        if (!campoColar) {
            console.error('campoColar não encontrado');
            return;
        }
        const texto = campoColar.value.trim();
        if (!texto) {
            alert('⚠️ Cole o texto primeiro!');
            return;
        }
        processarTextoColado(texto);
    };
}

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
        if (pilha.length === 0 || pilha[pilha.length - 1] !== valor) {
            pilha.push(valor);
            if (pilha.length > 30) pilha.shift();
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

    // Limpar futuro (quando faz uma nova ação)
    function limparFuturo() {
        historicoFuturoCampos[idCampo] = [];
    }

    // Desfazer (Ctrl+Z)
    function desfazer() {
        const pilha = historicoCampos[idCampo];
        const pilhaFuturo = historicoFuturoCampos[idCampo];
        
        if (pilha.length > 1) {
            // Salvar valor atual no futuro antes de desfazer
            const valorAtual = input.value;
            if (valorAtual) {
                pilhaFuturo.push(valorAtual);
            }
            
            // Voltar para o anterior
            pilha.pop();
            const valorAnterior = pilha[pilha.length - 1];
            input.value = valorAnterior || "";
            
            // Forçar atualização
            input.dispatchEvent(new CustomEvent('input', { detail: { isUndo: true } }));
            calcular();
        }
    }

    // Refazer (Ctrl+Y)
    function refazer() {
        const pilhaFuturo = historicoFuturoCampos[idCampo];
        
        if (pilhaFuturo.length > 0) {
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

        // Limpar futuro quando faz nova digitação
        limparFuturo();

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

        // Salvar no histórico após formatação
        if (formatado) {
            salvarNoHistorico(formatado);
        }
        
        calcular();
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

        salvarNoHistorico(e.target.value);
        limparFuturo();
    });
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
// 20. INIT
// ==========================================
window.onload = function() {
    carregarDadosSalvos();
    setTimeout(() => {
        paginaCarregada = true;
    }, 100);

    // FORÇAR tamanho inicial do textarea SEMPRE
    const campoColar = document.getElementById('campo-colar');
    if (campoColar) {
        // Resetar qualquer estilo inline que tenha sido salvo
        campoColar.style.removeProperty('resize');
        
        // Garantir que não tem tamanho fixo conflitante
        campoColar.setAttribute('style', '');
        campoColar.style.width = '600px';
        campoColar.style.height = '55px';
        
        console.log('Textarea resetado para tamanho inicial 600x55');
    }
    
    // Também resetar o container
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


