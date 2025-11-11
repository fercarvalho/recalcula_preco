// Dados dos itens por categoria
const itensPorCategoria = {
    'HotDogs': [
        { nome: 'Hot Dog Simples', valor: 8.00 },
        { nome: 'Hot Dog Completo', valor: 12.00 },
        { nome: 'Hot Dog Especial', valor: 15.00 },
        { nome: 'Hot Dog Premium', valor: 18.00 }
    ],
    'Lanches': [
        { nome: 'X-Burger', valor: 15.00 },
        { nome: 'X-Bacon', valor: 18.00 },
        { nome: 'X-Salada', valor: 16.00 },
        { nome: 'X-Tudo', valor: 22.00 },
        { nome: 'X-Frango', valor: 17.00 }
    ],
    'Bebidas': [
        { nome: 'Coca-Cola 350ml', valor: 5.00 },
        { nome: 'Coca-Cola 600ml', valor: 7.00 },
        { nome: 'Guaraná 350ml', valor: 4.50 },
        { nome: 'Guaraná 600ml', valor: 6.50 },
        { nome: 'Água Mineral', valor: 3.00 }
    ],
    'Sucos': [
        { nome: 'Suco de Laranja', valor: 6.00 },
        { nome: 'Suco de Maracujá', valor: 6.50 },
        { nome: 'Suco de Abacaxi', valor: 6.00 },
        { nome: 'Vitamina de Banana', valor: 7.00 },
        { nome: 'Açaí', valor: 10.00 }
    ],
    'Complementos': [
        { nome: 'Batata Frita P', valor: 8.00 },
        { nome: 'Batata Frita M', valor: 12.00 },
        { nome: 'Batata Frita G', valor: 16.00 },
        { nome: 'Anel de Cebola', valor: 10.00 },
        { nome: 'Nuggets (6 un)', valor: 12.00 }
    ],
    'Outros': [
        { nome: 'Salgado Assado', valor: 4.50 },
        { nome: 'Salgado Frito', valor: 5.00 },
        { nome: 'Pastel', valor: 6.00 },
        { nome: 'Coxinha', valor: 5.50 }
    ]
};

// Estado da aplicação
let itensSelecionados = new Set();
let categoriasColapsadas = {};
let ultimoReajuste = { tipo: null, valor: null };

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    inicializarInterface();
    inicializarEventos();
    selecionarTodosItens();
});

// Inicializar interface
function inicializarInterface() {
    const container = document.getElementById('categorias-container');
    container.innerHTML = '';

    Object.keys(itensPorCategoria).forEach(categoria => {
        const categoriaDiv = criarCategoria(categoria);
        container.appendChild(categoriaDiv);
    });

    // Atualizar label do input baseado no tipo de reajuste
    atualizarLabelValor();
}

// Criar elemento de categoria
function criarCategoria(categoria) {
    const categoriaDiv = document.createElement('div');
    categoriaDiv.className = 'categoria';
    categoriaDiv.dataset.categoria = categoria;

    const header = document.createElement('div');
    header.className = 'categoria-header';
    header.innerHTML = `
        <span>${categoria}</span>
        <span class="toggle-icon">▼</span>
    `;
    header.addEventListener('click', () => toggleCategoria(categoria));

    const body = document.createElement('div');
    body.className = 'categoria-body';
    body.id = `categoria-${categoria}`;

    itensPorCategoria[categoria].forEach((item, index) => {
        const itemDiv = criarItem(categoria, index, item);
        body.appendChild(itemDiv);
    });

    categoriaDiv.appendChild(header);
    categoriaDiv.appendChild(body);

    return categoriaDiv;
}

// Criar elemento de item
function criarItem(categoria, index, item) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'item';
    itemDiv.dataset.categoria = categoria;
    itemDiv.dataset.index = index;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `item-${categoria}-${index}`;
    checkbox.checked = true;
    checkbox.addEventListener('change', (e) => {
        const key = `${categoria}-${index}`;
        if (e.target.checked) {
            itensSelecionados.add(key);
        } else {
            itensSelecionados.delete(key);
        }
    });

    const info = document.createElement('div');
    info.className = 'item-info';
    info.innerHTML = `
        <div class="item-nome">${item.nome}</div>
        <div class="item-valor">R$ ${item.valor.toFixed(2)}</div>
        <div class="item-valor-novo"></div>
    `;

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(info);

    // Adicionar ao conjunto de selecionados
    itensSelecionados.add(`${categoria}-${index}`);

    // Permitir clicar no item inteiro para marcar/desmarcar
    itemDiv.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox') {
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        }
    });

    return itemDiv;
}

// Toggle categoria (expandir/colapsar)
function toggleCategoria(categoria) {
    const body = document.getElementById(`categoria-${categoria}`);
    const header = body.previousElementSibling;
    
    if (categoriasColapsadas[categoria]) {
        body.style.display = 'grid';
        header.classList.remove('collapsed');
        categoriasColapsadas[categoria] = false;
    } else {
        body.style.display = 'none';
        header.classList.add('collapsed');
        categoriasColapsadas[categoria] = true;
    }
}

// Selecionar todos os itens
function selecionarTodosItens() {
    itensSelecionados.clear();
    document.querySelectorAll('.item input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = true;
        const categoria = checkbox.closest('.item').dataset.categoria;
        const index = checkbox.closest('.item').dataset.index;
        itensSelecionados.add(`${categoria}-${index}`);
    });
}

// Deselecionar todos os itens
function deselecionarTodosItens() {
    itensSelecionados.clear();
    document.querySelectorAll('.item input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Atualizar label do valor baseado no tipo
function atualizarLabelValor() {
    const tipo = document.getElementById('tipo-reajuste').value;
    const label = document.getElementById('label-valor');
    const input = document.getElementById('valor-reajuste');
    
    if (tipo === 'percentual') {
        label.textContent = 'Percentual de Reajuste (%):';
        input.placeholder = 'Ex: 10.5';
    } else {
        label.textContent = 'Valor Fixo de Reajuste (R$):';
        input.placeholder = 'Ex: 2.50';
    }
}

// Calcular novo valor
function calcularNovoValor(valorAntigo, tipoReajuste, valorReajuste) {
    if (tipoReajuste === 'percentual') {
        return valorAntigo * (1 + valorReajuste / 100);
    } else {
        return valorAntigo + valorReajuste;
    }
}

// Obter item selecionado
function obterItem(categoria, index) {
    return itensPorCategoria[categoria][index];
}

// Inicializar eventos
function inicializarEventos() {
    // Mudança no tipo de reajuste
    document.getElementById('tipo-reajuste').addEventListener('change', atualizarLabelValor);

    // Botões de seleção
    document.getElementById('btn-selecionar-todos').addEventListener('click', selecionarTodosItens);
    document.getElementById('btn-deselecionar-todos').addEventListener('click', deselecionarTodosItens);

    // Botão aplicar reajuste
    document.getElementById('btn-aplicar-reajuste').addEventListener('click', () => {
        const tipoReajuste = document.getElementById('tipo-reajuste').value;
        const valorReajuste = parseFloat(document.getElementById('valor-reajuste').value);

        if (!valorReajuste || valorReajuste <= 0) {
            alert('Por favor, informe um valor válido para o reajuste.');
            return;
        }

        if (itensSelecionados.size === 0) {
            alert('Por favor, selecione pelo menos um item para reajustar.');
            return;
        }

        mostrarModalConfirmacao(tipoReajuste, valorReajuste);
    });

    // Modal
    const modal = document.getElementById('modal-confirmacao');
    const closeModal = document.querySelector('.close-modal');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnConfirmar = document.getElementById('btn-confirmar');

    closeModal.addEventListener('click', fecharModal);
    btnCancelar.addEventListener('click', fecharModal);
    btnConfirmar.addEventListener('click', () => {
        aplicarReajuste();
        fecharModal();
    });

    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });
}

// Mostrar modal de confirmação
function mostrarModalConfirmacao(tipoReajuste, valorReajuste) {
    const modal = document.getElementById('modal-confirmacao');
    const modalTipo = document.getElementById('modal-tipo');
    const modalValor = document.getElementById('modal-valor');
    const modalItensLista = document.getElementById('modal-itens-lista');

    // Atualizar informações do modal
    modalTipo.textContent = tipoReajuste === 'percentual' ? 'Percentual' : 'Valor Fixo';
    modalValor.textContent = tipoReajuste === 'percentual' 
        ? `${valorReajuste}%` 
        : `R$ ${valorReajuste.toFixed(2)}`;

    // Criar lista de itens no modal
    modalItensLista.innerHTML = '';
    const itensArray = Array.from(itensSelecionados);

    itensArray.forEach(key => {
        const [categoria, index] = key.split('-');
        const item = obterItem(categoria, parseInt(index));
        const novoValor = calcularNovoValor(item.valor, tipoReajuste, valorReajuste);

        const itemDiv = document.createElement('div');
        itemDiv.className = 'modal-item';
        itemDiv.dataset.key = key;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true;
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                itensSelecionados.add(key);
            } else {
                itensSelecionados.delete(key);
            }
        });

        const info = document.createElement('div');
        info.className = 'modal-item-info';
        info.innerHTML = `
            <div class="modal-item-nome">${item.nome}</div>
            <div class="modal-item-valores">
                <span class="modal-item-valor-antigo">Antigo: R$ ${item.valor.toFixed(2)}</span>
                <span class="modal-item-valor-novo">Novo: R$ ${novoValor.toFixed(2)}</span>
            </div>
        `;

        itemDiv.appendChild(checkbox);
        itemDiv.appendChild(info);

        // Permitir clicar no item inteiro
        itemDiv.addEventListener('click', (e) => {
            if (e.target.type !== 'checkbox') {
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });

        modalItensLista.appendChild(itemDiv);
    });

    modal.classList.add('show');
}

// Fechar modal
function fecharModal() {
    const modal = document.getElementById('modal-confirmacao');
    modal.classList.remove('show');
}

// Aplicar reajuste
function aplicarReajuste() {
    const tipoReajuste = document.getElementById('tipo-reajuste').value;
    const valorReajuste = parseFloat(document.getElementById('valor-reajuste').value);

    if (itensSelecionados.size === 0) {
        alert('Nenhum item selecionado para reajustar.');
        return;
    }

    // Atualizar valores dos itens selecionados
    itensSelecionados.forEach(key => {
        const [categoria, index] = key.split('-');
        const item = obterItem(categoria, parseInt(index));
        const novoValor = calcularNovoValor(item.valor, tipoReajuste, valorReajuste);

        // Atualizar no objeto
        item.valor = novoValor;

        // Atualizar na interface
        const itemElement = document.querySelector(`[data-categoria="${categoria}"][data-index="${index}"]`);
        if (itemElement) {
            const valorElement = itemElement.querySelector('.item-valor');
            const valorNovoElement = itemElement.querySelector('.item-valor-novo');
            
            valorElement.textContent = `R$ ${novoValor.toFixed(2)}`;
            valorNovoElement.textContent = `Novo: R$ ${novoValor.toFixed(2)}`;
            valorNovoElement.classList.add('visible');
        }
    });

    // Limpar campo de reajuste
    document.getElementById('valor-reajuste').value = '';

    alert(`Reajuste aplicado com sucesso em ${itensSelecionados.size} item(ns)!`);
}

