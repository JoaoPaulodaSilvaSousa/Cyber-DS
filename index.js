// LÓGICA DO BOTÃO DE ALTERNAR TEMA
const themeBtn = document.getElementById('toggle-theme');

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
});


// SEU CÓDIGO ORIGINAL DE CÁLCULO DE HORAS MANTIDO ABAIXO:
const hrInputs = document.querySelectorAll('.horasv');

// Função para salvar todos os inputs no localStorage
function salvarHoras() {
    const dados = {};
    hrInputs.forEach(input => {
        const mapa = input.dataset.mapa;
        dados[mapa] = input.value;
    });
    localStorage.setItem('horasServer', JSON.stringify(dados));
}

// Função para carregar os dados salvos
function carregarHoras() {
    const dados = JSON.parse(localStorage.getItem('horasServer') || '{}');
    hrInputs.forEach(input => {
        const mapa = input.dataset.mapa;
        if (dados[mapa]) input.value = dados[mapa];

        // Atualiza a hora Brasil
        const horaBrasilInput = document.querySelector(`.horabr[data-mapa="${mapa}"]`);
        if (!horaBrasilInput) return;

        let valor = input.value.trim();
        if (valor === "") {
            horaBrasilInput.value = "";
            return;
        }

        const parts = valor.split(":").map(Number);
        let [h, m, s] = parts;
        if (s === undefined) s = 0;
        h = (h + 1) % 24;

        horaBrasilInput.value = `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
    });
}

// Evento para atualizar hora Brasil e salvar sempre que digitar
hrInputs.forEach(input => {
    input.addEventListener('input', () => {
        const mapa = input.dataset.mapa;
        const horaBrasilInput = document.querySelector(`.horabr[data-mapa="${mapa}"]`);
        if (!horaBrasilInput) return;

        let valor = input.value.trim();
        if (valor === "") {
            horaBrasilInput.value = "";
        } else {
            const parts = valor.split(":").map(Number);
            let [h, m, s] = parts;
            if (s === undefined) s = 0;
            h = (h + 1) % 24;
            horaBrasilInput.value = `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
        }

        salvarHoras(); // salva sempre que houver alteração
    });
});

// Carrega os dados salvos ao iniciar
carregarHoras();