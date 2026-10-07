const nomeInput = document.getElementById('nomeInput');
const listaInput = document.getElementById('listaInput');
const adicionarBtn = document.getElementById('adicionarBtn');
const adicionarListaBtn = document.getElementById('adicionarListaBtn');
const sortearBtn = document.getElementById('sortearBtn');
const reiniciarBtn = document.getElementById('reiniciarBtn');
const limparBtn = document.getElementById('limparBtn');

const listaParticipantes = document.getElementById('listaParticipantes');
const contadorParticipantes = document.getElementById('contadorParticipantes');
const roleta = document.getElementById('roleta');
const nomeSorteado = document.getElementById('nomeSorteado');
const resultado = document.getElementById('resultado');
const historico = document.getElementById('historico');

let participantes = [];
let participantesOriginais = [];
let sorteados = [];
let rotacaoAtual = 0;
let sorteando = false;
let vencedorPendente = null;

function gerarCor(index, total) {
    const cores = [
        '#0f3d2b', '#c8972a', '#176044', '#b33a3a', '#315c4a',
        '#d1a94d', '#246b50', '#9b6f1f', '#3d765e', '#b85c3d',
        '#15513a', '#d6b45a', '#28775a', '#8f542f', '#4a8068',
        '#c18d27', '#1c6045', '#a94a3a', '#367b60', '#d0a33d',
        '#235640', '#9c7827', '#2f6d54', '#b66a45', '#174a36'
    ];

    return cores[index % cores.length];
}

/* =========================
   PARTICIPANTES
   ========================= */

function adicionarNome(nome) {
    const nomeLimpo = nome.trim();

    if (!nomeLimpo) {
        return false;
    }

    if (
        participantes.some(
            participante => participante.toLowerCase() === nomeLimpo.toLowerCase()
        )
    ) {
        return false;
    }

    participantes.push(nomeLimpo);
    return true;
}

function atualizarInterface() {
    contadorParticipantes.textContent = participantes.length;

    renderizarLista();
    renderizarRoleta();

    sortearBtn.disabled = participantes.length < 2 || sorteando;
}

function renderizarLista() {
    if (participantes.length === 0) {
        listaParticipantes.innerHTML = `
            <div class="lista-vazia">
                <span>👥</span>
                <p>Nenhum participante adicionado.</p>
            </div>
        `;
        return;
    }

    listaParticipantes.innerHTML = participantes
        .map((nome, index) => `
            <div class="participante">
                <span class="participante-nome">${escaparHTML(nome)}</span>
                <button
                    class="remover-participante"
                    data-index="${index}"
                    title="Remover participante"
                    aria-label="Remover ${escaparHTML(nome)}"
                >
                    ×
                </button>
            </div>
        `)
        .join('');

    document.querySelectorAll('.remover-participante').forEach(botao => {
        botao.addEventListener('click', () => {
            if (sorteando) {
                return;
            }

            const index = Number(botao.dataset.index);

            participantes.splice(index, 1);
            atualizarInterface();
        });
    });
}

function adicionarNomeDigitado() {
    const nome = nomeInput.value.trim();

    if (!nome) {
        nomeInput.focus();
        return;
    }

    if (!adicionarNome(nome)) {
        nomeInput.value = '';
        nomeInput.placeholder = 'Nome já adicionado';
        setTimeout(() => {
            nomeInput.placeholder = 'Digite o nome do participante';
        }, 1500);
        nomeInput.focus();
        return;
    }

    participantesOriginais = [...new Set([...participantesOriginais, nome])];

    nomeInput.value = '';
    nomeInput.focus();

    atualizarInterface();
}

function adicionarLista() {
    const nomes = listaInput.value
        .split(/\r?\n/)
        .map(nome => nome.trim())
        .filter(Boolean);

    if (nomes.length === 0) {
        listaInput.focus();
        return;
    }

    nomes.forEach(nome => adicionarNome(nome));

    participantesOriginais = [...new Set([
        ...participantesOriginais,
        ...participantes
    ])];

    listaInput.value = '';

    atualizarInterface();
}

/* =========================
   ROLETA
   ========================= */

function renderizarRoleta() {
    roleta.innerHTML = '';

    if (participantes.length === 0) {
        roleta.style.background = '#eef3ef';
        roleta.style.transform = 'rotate(0deg)';

        roleta.innerHTML = `
            <div class="roleta-vazia">
                <span>🎲</span>
                <small>Adicione participantes</small>
            </div>
        `;

        return;
    }

    const quantidade = participantes.length;
    const angulo = 360 / quantidade;

    const partes = participantes.map((_, index) => {
        const inicio = index * angulo;
        const fim = (index + 1) * angulo;
        const cor = gerarCor(index, quantidade);

        return `${cor} ${inicio}deg ${fim}deg`;
    });

    roleta.style.background =
        `conic-gradient(from 0deg, ${partes.join(', ')})`;

 participantes.forEach((nome, index) => {
    const anguloCentro = (index * angulo) + (angulo / 2);

    const fatia = document.createElement('div');
    fatia.className = 'fatia';

    fatia.style.transform = `rotate(${anguloCentro - 90}deg)`;
    fatia.style.transformOrigin = '0 50%';

    const texto = document.createElement('span');
    texto.textContent = nome;

    /*
     * O texto fica exatamente no eixo central
     * da sua fatia.
     */
    texto.style.left = '72%';
    texto.style.top = '50%';
    texto.style.transform = 'translate(-50%, -50%)';

    /*
     * Mantém a leitura correta na metade inferior.
     */
    if (anguloCentro > 90 && anguloCentro < 270) {
        texto.style.transform =
            'translate(-50%, -50%) rotate(180deg)';
    }

    if (quantidade <= 8) {
        texto.style.fontSize = '18px';
    } else if (quantidade <= 15) {
        texto.style.fontSize = '16px';
    } else if (quantidade <= 25) {
        texto.style.fontSize = '14px';
    } else if (quantidade <= 35) {
        texto.style.fontSize = '12px';
    } else {
        texto.style.fontSize = '10px';
    }

    fatia.appendChild(texto);
    roleta.appendChild(fatia);
});

    roleta.style.transform = `rotate(${rotacaoAtual}deg)`;
}

/* =========================
   SORTEIO
   ========================= */

function sortear() {
    /*
     * Se existe um vencedor aguardando confirmação,
     * ele é removido somente quando o usuário inicia
     * o próximo sorteio.
     */
    if (vencedorPendente && !sorteando) {
        participantes = participantes.filter(
            participante => participante !== vencedorPendente
        );

        vencedorPendente = null;
        atualizarInterface();

        if (participantes.length < 2) {
            return;
        }
    }

    if (sorteando || participantes.length < 2) {
        return;
    }

    sorteando = true;
    sortearBtn.disabled = true;

    resultado.classList.remove('vencedor');
    nomeSorteado.textContent = '...';

    const quantidade = participantes.length;
    const angulo = 360 / quantidade;

    const indiceVencedor = Math.floor(Math.random() * quantidade);
    const vencedor = participantes[indiceVencedor];

    /*
     * O ponteiro fica no topo.
     * O centro da fatia vencedora será levado até ele.
     */
    const centroFatia = (indiceVencedor * angulo) + (angulo / 2);
    const destino = -centroFatia;

    /*
     * Giro mais longo e cinematográfico.
     * 8 a 10 voltas completas.
     */
    const voltas = 8 + Math.floor(Math.random() * 3);

    const rotacaoDestino =
        rotacaoAtual +
        (voltas * 360) +
        normalizarAngulo(destino - rotacaoAtual);

    rotacaoAtual = rotacaoDestino;

    roleta.classList.add('girando');
    roleta.style.transform = `rotate(${rotacaoDestino}deg)`;

    /*
     * Tempo sincronizado com a animação CSS.
     */
    setTimeout(() => {
        finalizarSorteio(vencedor);
    }, 9000);
}


function soltarConfetes() {
    const container = document.getElementById('confetes');

    if (!container) return;

    container.innerHTML = '';

    const cores = ['#0f3d2b', '#c8972a', '#ffffff'];

    for (let i = 0; i < 90; i++) {
        const confete = document.createElement('span');

        confete.className = 'confete';

        confete.style.left = `${Math.random() * 100}%`;
        confete.style.background = cores[i % cores.length];
        confete.style.setProperty(
            '--deslocamento',
            `${(Math.random() - 0.5) * 260}px`
        );
        confete.style.setProperty(
            '--rotacao',
            `${Math.random() * 1080 - 540}deg`
        );
        confete.style.animationDelay = `${Math.random() * 0.7}s`;
        confete.style.width = `${6 + Math.random() * 7}px`;
        confete.style.height = `${10 + Math.random() * 12}px`;

        container.appendChild(confete);
    }

    setTimeout(() => {
        container.innerHTML = '';
    }, 4500);
}

function finalizarSorteio(vencedor) {
    nomeSorteado.textContent = vencedor;
    soltarConfetes();
    resultado.classList.add('vencedor');

    sorteados.push(vencedor);
    vencedorPendente = vencedor;

    atualizarHistorico();

    sorteando = false;

    /*
     * O vencedor continua visível na roleta.
     * Ele só será removido no próximo clique em SORTEAR.
     */
    roleta.classList.remove('girando');

    if (participantes.length >= 2) {
        sortearBtn.disabled = false;
        sortearBtn.innerHTML = '<span>🎯</span> SORTEAR NOVAMENTE';
    } else {
        sortearBtn.disabled = true;
        sortearBtn.innerHTML = '<span>🏆</span> SORTEIO FINALIZADO';
    }
}

function normalizarAngulo(angulo) {
    let resultadoAngulo = angulo % 360;

    if (resultadoAngulo < 0) {
        resultadoAngulo += 360;
    }

    return resultadoAngulo;
}

/* =========================
   HISTÓRICO
   ========================= */

function atualizarHistorico() {
    if (sorteados.length === 0) {
        historico.innerHTML = `
            <div class="historico-vazio">
                Nenhum sorteio realizado ainda.
            </div>
        `;
        return;
    }

    historico.innerHTML = sorteados
        .map((nome, index) => `
            <div class="historico-item" title="Sorteado em ${index + 1}º lugar">
                ${index + 1}º ${escaparHTML(nome)}
            </div>
        `)
        .join('');
}

/* =========================
   CONTROLES
   ========================= */

function reiniciarRodada() {
    if (sorteando) {
        return;
    }

    if (participantesOriginais.length === 0) {
        return;
    }

    participantes = [...participantesOriginais];
    sorteados = [];
    rotacaoAtual = 0;

    nomeSorteado.textContent = '—';
    resultado.classList.remove('vencedor');
    vencedorPendente = null;
    sortearBtn.innerHTML = '<span>🎯</span> SORTEAR';

    atualizarHistorico();
    atualizarInterface();
}

function limparTudo() {
    if (sorteando) {
        return;
    }

    participantes = [];
    participantesOriginais = [];
    sorteados = [];
    rotacaoAtual = 0;

    nomeSorteado.textContent = '—';
    resultado.classList.remove('vencedor');
    vencedorPendente = null;
    sortearBtn.innerHTML = '<span>🎯</span> SORTEAR';

    atualizarHistorico();
    atualizarInterface();

    nomeInput.value = '';
    listaInput.value = '';
    nomeInput.focus();
}

/* =========================
   SEGURANÇA
   ========================= */

function escaparHTML(texto) {
    const elemento = document.createElement('div');
    elemento.textContent = texto;
    return elemento.innerHTML;
}

/* =========================
   EVENTOS
   ========================= */

adicionarBtn.addEventListener('click', adicionarNomeDigitado);

adicionarListaBtn.addEventListener('click', adicionarLista);

sortearBtn.addEventListener('click', sortear);

reiniciarBtn.addEventListener('click', reiniciarRodada);

limparBtn.addEventListener('click', limparTudo);

nomeInput.addEventListener('keydown', evento => {
    if (evento.key === 'Enter') {
        evento.preventDefault();
        adicionarNomeDigitado();
    }
});

listaInput.addEventListener('keydown', evento => {
    if ((evento.ctrlKey || evento.metaKey) && evento.key === 'Enter') {
        evento.preventDefault();
        adicionarLista();
    }
});

/* =========================
   INICIALIZAÇÃO
   ========================= */

atualizarInterface();
atualizarHistorico();