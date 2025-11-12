// Dados padrão dos itens por categoria
const dadosPadrao = {
    'HotDogs': [
        { nome: 'Simples', valor: 14.00 },
        { nome: 'Simples picles', valor: 16.00 },
        { nome: 'Calabresa', valor: 20.00 },
        { nome: 'Frango', valor: 20.00 },
        { nome: 'Misto', valor: 22.00 },
        { nome: 'Calabresa acebolada', valor: 22.00 },
        { nome: 'Bacon', valor: 22.00 },
        { nome: 'Queijos', valor: 22.00 },
        { nome: 'Da casa', valor: 23.00 },
        { nome: 'Calabresa com bacon', valor: 23.00 },
        { nome: 'Frango com bacon', valor: 23.00 },
        { nome: 'Brutus', valor: 25.00 },
        { nome: 'Brutus com catupiry', valor: 27.00 },
        { nome: 'Super Brutus', valor: 30.00 }
    ],
    'Lanches': [
        { nome: 'Misto quente', valor: 19.00 },
        { nome: 'X-Burger', valor: 21.00 },
        { nome: 'X-Salada', valor: 22.00 },
        { nome: 'X-Frango', valor: 22.00 },
        { nome: 'X-Calabresa', valor: 24.00 },
        { nome: 'X-Burger duplo', valor: 26.00 },
        { nome: 'X-Egg', valor: 24.00 },
        { nome: 'X-Bacon', valor: 26.00 },
        { nome: 'X-Frango com Bacon', valor: 25.00 },
        { nome: 'X-Tudo', valor: 35.00 }
    ],
    'Bebidas': [
        { nome: 'Água', valor: 3.00 },
        { nome: 'Água com gás', valor: 3.50 },
        { nome: 'Refrigerante lata', valor: 5.00 },
        { nome: 'H20', valor: 6.00 },
        { nome: 'Refrigerante 600Ml', valor: 8.00 },
        { nome: 'Refrigerante 1L vidro', valor: 9.00 },
        { nome: 'Refrigerante 1L descartável', valor: 10.00 },
        { nome: 'Refrigerante 2L descartável', valor: 13.00 },
        { nome: 'Cerveja lata', valor: 5.00 }
    ],
    'Sucos': [
        { nome: 'Laranja', valor: 12.00 },
        { nome: 'Maracujá', valor: 8.00 },
        { nome: 'Acerola', valor: 8.00 },
        { nome: 'Caju', valor: 8.00 },
        { nome: 'Abacaxi', valor: 8.00 },
        { nome: 'Abacaxi com Hortelã', valor: 8.00 },
        { nome: 'Morango', valor: 8.00 }
    ],
    'Complementos': [
        { nome: 'Cebola / Ovo / Salsicha / Picles', valor: 2.00 },
        { nome: 'Purê de Batata / Presunto / Mussarela', valor: 4.00 },
        { nome: 'Catupiry / Cheddar / Calabresa / Frango', valor: 6.00 },
        { nome: 'Bacon / Blend de Queijos', valor: 8.00 },
        { nome: 'Hambúrguer Artesanal', valor: 10.00 }
    ],
    'Personalize seu suco': [
        { nome: 'Adicionar um segundo sabor', valor: 2.00 },
        { nome: 'Substituir a água por leite', valor: 1.50 }
    ]
};

// URL base da API
const API_BASE = window.location.origin;

// Dados dos itens por categoria (será carregado da API)
let itensPorCategoria = {};
// Mapa de IDs dos itens: { "categoria-index": id }
let itensIds = {};

// Estado da aplicação
let itensSelecionados = new Set();
let categoriasColapsadas = {};
let ultimoReajuste = { tipo: null, valor: null };

// Funções de modal customizadas
function mostrarAlert(titulo, mensagem) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-alert');
        const tituloEl = document.getElementById('modal-alert-titulo');
        const mensagemEl = document.getElementById('modal-alert-mensagem');
        const btnOk = document.getElementById('btn-alert-ok');
        
        tituloEl.textContent = titulo || 'Aviso';
        mensagemEl.textContent = mensagem;
        
        const fechar = () => {
            modal.classList.remove('show');
            resolve();
        };
        
        btnOk.onclick = fechar;
        modal.querySelector('.close-modal').onclick = fechar;
        modal.onclick = (e) => {
            if (e.target === modal) fechar();
        };
        
        modal.classList.add('show');
        btnOk.focus();
    });
}

function mostrarConfirm(titulo, mensagem) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-confirm');
        const tituloEl = document.getElementById('modal-confirm-titulo');
        const mensagemEl = document.getElementById('modal-confirm-mensagem');
        const btnOk = document.getElementById('btn-confirm-ok');
        const btnCancel = document.getElementById('btn-confirm-cancel');
        
        tituloEl.textContent = titulo || 'Confirmar';
        mensagemEl.textContent = mensagem;
        
        const fechar = (resultado) => {
            modal.classList.remove('show');
            resolve(resultado);
        };
        
        btnOk.onclick = () => fechar(true);
        btnCancel.onclick = () => fechar(false);
        modal.querySelector('.close-modal').onclick = () => fechar(false);
        modal.onclick = (e) => {
            if (e.target === modal) fechar(false);
        };
        
        modal.classList.add('show');
        btnOk.focus();
    });
}

function mostrarPrompt(titulo, mensagem, valorPadrao = '') {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-prompt');
        const tituloEl = document.getElementById('modal-prompt-titulo');
        const mensagemEl = document.getElementById('modal-prompt-mensagem');
        const input = document.getElementById('modal-prompt-input');
        const btnOk = document.getElementById('btn-prompt-ok');
        const btnCancel = document.getElementById('btn-prompt-cancel');
        
        tituloEl.textContent = titulo || 'Informe';
        mensagemEl.textContent = mensagem;
        input.value = valorPadrao;
        input.type = 'text';
        
        const fechar = (resultado) => {
            modal.classList.remove('show');
            resolve(resultado);
        };
        
        const confirmar = () => {
            fechar(input.value);
        };
        
        btnOk.onclick = confirmar;
        btnCancel.onclick = () => fechar(null);
        modal.querySelector('.close-modal').onclick = () => fechar(null);
        modal.onclick = (e) => {
            if (e.target === modal) fechar(null);
        };
        
        input.onkeypress = (e) => {
            if (e.key === 'Enter') confirmar();
        };
        
        modal.classList.add('show');
        input.focus();
        input.select();
    });
}

function mostrarPromptNumber(titulo, mensagem, valorPadrao = '') {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-prompt');
        const tituloEl = document.getElementById('modal-prompt-titulo');
        const mensagemEl = document.getElementById('modal-prompt-mensagem');
        const input = document.getElementById('modal-prompt-input');
        const btnOk = document.getElementById('btn-prompt-ok');
        const btnCancel = document.getElementById('btn-prompt-cancel');
        
        tituloEl.textContent = titulo || 'Informe';
        mensagemEl.textContent = mensagem;
        input.value = valorPadrao;
        input.type = 'number';
        input.step = '0.01';
        input.min = '0';
        
        const fechar = (resultado) => {
            modal.classList.remove('show');
            resolve(resultado);
        };
        
        const confirmar = () => {
            fechar(input.value);
        };
        
        btnOk.onclick = confirmar;
        btnCancel.onclick = () => fechar(null);
        modal.querySelector('.close-modal').onclick = () => fechar(null);
        modal.onclick = (e) => {
            if (e.target === modal) fechar(null);
        };
        
        input.onkeypress = (e) => {
            if (e.key === 'Enter') confirmar();
        };
        
        modal.classList.add('show');
        input.focus();
        input.select();
    });
}

function mostrarSelecaoCategoria() {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-selecao-categoria');
        const lista = document.getElementById('modal-categorias-lista');
        const btnCancel = document.getElementById('btn-selecao-cancel');
        
        lista.innerHTML = '';
        const categorias = Object.keys(itensPorCategoria);
        
        categorias.forEach((categoria, index) => {
            const btnCategoria = document.createElement('button');
            btnCategoria.className = 'btn-categoria-opcao';
            btnCategoria.textContent = categoria;
            btnCategoria.onclick = () => {
                modal.classList.remove('show');
                resolve(categoria);
            };
            lista.appendChild(btnCategoria);
        });
        
        const fechar = () => {
            modal.classList.remove('show');
            resolve(null);
        };
        
        btnCancel.onclick = fechar;
        modal.querySelector('.close-modal').onclick = fechar;
        modal.onclick = (e) => {
            if (e.target === modal) fechar();
        };
        
        modal.classList.add('show');
    });
}

// Funções de API
async function carregarDados() {
    try {
        const response = await fetch(`${API_BASE}/api/itens`);
        if (!response.ok) {
            throw new Error('Erro ao carregar dados da API');
        }
        const dados = await response.json();
        
        // Organizar dados e criar mapa de IDs
        itensPorCategoria = {};
        itensIds = {};
        
        Object.keys(dados).forEach(categoria => {
            itensPorCategoria[categoria] = [];
            dados[categoria].forEach((item, index) => {
                itensPorCategoria[categoria].push({
                    nome: item.nome,
                    valor: item.valor,
                    valorNovo: item.valorNovo
                });
                // Criar mapa de IDs
                const key = `${categoria}-${index}`;
                itensIds[key] = item.id;
            });
        });
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        await mostrarAlert('Erro', 'Erro ao carregar dados do servidor. Verifique se o servidor está rodando.');
    }
}

async function atualizarItemAPI(id, nome, valor) {
    try {
        const response = await fetch(`${API_BASE}/api/itens/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome, valor })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar item');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao atualizar item:', error);
        throw error;
    }
}

async function criarItemAPI(categoria, nome, valor) {
    try {
        const response = await fetch(`${API_BASE}/api/itens`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ categoria, nome, valor })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao criar item');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao criar item:', error);
        throw error;
    }
}

async function deletarItemAPI(id) {
    try {
        const response = await fetch(`${API_BASE}/api/itens/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Erro ao deletar item');
        }
        
        return true;
    } catch (error) {
        console.error('Erro ao deletar item:', error);
        throw error;
    }
}

async function atualizarValorNovoAPI(id, valorNovo) {
    try {
        const response = await fetch(`${API_BASE}/api/itens/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ valorNovo })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao atualizar valor novo');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao atualizar valor novo:', error);
        throw error;
    }
}

async function resetarDados() {
    const confirmado = await mostrarConfirm('Confirmar Reset', 'Tem certeza que deseja resetar todos os valores para os padrões? Esta ação não pode ser desfeita.');
    if (confirmado) {
        await mostrarAlert('Aviso', 'A funcionalidade de reset ainda não está implementada na API. Por favor, recarregue a página para usar os valores padrão.');
        // Recarregar dados
        await carregarDados();
        inicializarInterface();
        selecionarTodosItens();
    }
}

// Editar item
async function editarItem(categoria, index) {
    const item = itensPorCategoria[categoria][index];
    const key = `${categoria}-${index}`;
    const id = itensIds[key];
    
    if (!id) {
        await mostrarAlert('Erro', 'Erro ao identificar o item. Por favor, recarregue a página.');
        return;
    }
    
    const novoNome = await mostrarPrompt('Editar Nome', 'Digite o novo nome do item:', item.nome);
    
    if (novoNome && novoNome.trim() !== '' && novoNome.trim() !== item.nome) {
        try {
            await atualizarItemAPI(id, novoNome.trim(), item.valor);
            
            // Recarregar dados e interface
            await carregarDados();
            inicializarInterface();
            selecionarTodosItens();
            
            await mostrarAlert('Sucesso', 'Nome do item atualizado com sucesso!');
        } catch (error) {
            await mostrarAlert('Erro', 'Erro ao atualizar o item. Tente novamente.');
        }
    }
}

// Excluir item
async function excluirItem(categoria, index) {
    const item = itensPorCategoria[categoria][index];
    const key = `${categoria}-${index}`;
    const id = itensIds[key];
    
    if (!id) {
        await mostrarAlert('Erro', 'Erro ao identificar o item. Por favor, recarregue a página.');
        return;
    }
    
    const confirmado = await mostrarConfirm('Confirmar Exclusão', `Tem certeza que deseja excluir "${item.nome}"?`);
    if (confirmado) {
        try {
            await deletarItemAPI(id);
            
            // Recarregar dados e interface
            await carregarDados();
            inicializarInterface();
            selecionarTodosItens();
            
            await mostrarAlert('Sucesso', 'Item excluído com sucesso!');
        } catch (error) {
            await mostrarAlert('Erro', 'Erro ao excluir o item. Tente novamente.');
        }
    }
}

// Adicionar item (com categoria já definida)
async function adicionarItem(categoria) {
    const nome = await mostrarPrompt('Adicionar Item', 'Digite o nome do novo item:');
    if (!nome || nome.trim() === '') {
        return; // Cancelado ou vazio
    }
    
    const valorStr = await mostrarPromptNumber('Adicionar Item', 'Digite o preço do item (ex: 10.50):');
    if (!valorStr) {
        return; // Cancelado
    }
    
    const valor = parseFloat(valorStr);
    
    if (isNaN(valor) || valor < 0) {
        await mostrarAlert('Erro', 'Valor inválido! O item não foi adicionado.');
        return;
    }
    
    try {
        await criarItemAPI(categoria, nome.trim(), valor);
        
        // Recarregar dados e interface
        await carregarDados();
        inicializarInterface();
        selecionarTodosItens();
        
        await mostrarAlert('Sucesso', 'Item adicionado com sucesso!');
    } catch (error) {
        await mostrarAlert('Erro', 'Erro ao adicionar o item. Tente novamente.');
    }
}

// Adicionar novo produto (escolhendo categoria)
async function adicionarNovoProduto() {
    // Escolher categoria
    const categoria = await mostrarSelecaoCategoria();
    if (!categoria) {
        return; // Cancelado
    }
    
    // Pedir nome do produto
    const nome = await mostrarPrompt('Adicionar Produto', 'Digite o nome do novo produto:');
    if (!nome || nome.trim() === '') {
        await mostrarAlert('Erro', 'Nome não pode estar vazio! Operação cancelada.');
        return;
    }
    
    // Pedir valor do produto
    const valorStr = await mostrarPromptNumber('Adicionar Produto', 'Digite o preço do produto (ex: 10.50):');
    if (!valorStr) {
        return; // Cancelado
    }
    
    const valor = parseFloat(valorStr);
    
    if (isNaN(valor) || valor < 0) {
        await mostrarAlert('Erro', 'Valor inválido! O produto não foi adicionado.');
        return;
    }
    
    try {
        await criarItemAPI(categoria, nome.trim(), valor);
        
        // Recarregar dados e interface
        await carregarDados();
        inicializarInterface();
        selecionarTodosItens();
        
        await mostrarAlert('Sucesso', `Produto "${nome.trim()}" adicionado com sucesso na categoria "${categoria}"!`);
    } catch (error) {
        await mostrarAlert('Erro', 'Erro ao adicionar o produto. Tente novamente.');
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', async () => {
    await carregarDados(); // Carregar dados da API primeiro
    inicializarInterface();
    inicializarEventos();
    selecionarTodosItens();
});

// Inicializar interface
function inicializarInterface() {
    const container = document.getElementById('categorias-container');
    container.innerHTML = '';
    
    // Limpar itens selecionados ao recarregar (para evitar problemas com índices)
    itensSelecionados.clear();

    Object.keys(itensPorCategoria).forEach(categoria => {
        const categoriaDiv = criarCategoria(categoria);
        container.appendChild(categoriaDiv);
    });

}

// Mapeamento de ícones para categorias
const iconesCategorias = {
    'HotDogs': '<i class="fas fa-hotdog"></i>',
    'Lanches': '<i class="fas fa-hamburger"></i>',
    'Bebidas': '<i class="fas fa-glass-water"></i>',
    'Sucos': '<i class="fas fa-wine-glass"></i>',
    'Complementos': '<i class="fas fa-utensils"></i>',
    'Personalize seu suco': '<i class="fas fa-cog"></i>'
};

// Criar elemento de categoria
function criarCategoria(categoria) {
    const categoriaDiv = document.createElement('div');
    categoriaDiv.className = 'categoria';
    categoriaDiv.dataset.categoria = categoria;

    const header = document.createElement('div');
    header.className = 'categoria-header';
    const icone = iconesCategorias[categoria] || '<i class="fas fa-tag"></i>';
    header.innerHTML = `
        <span class="categoria-titulo">${icone} ${categoria}</span>
        <div class="categoria-actions">
            <button class="btn-adicionar-item" title="Adicionar item" data-categoria="${categoria}">
                <i class="fas fa-plus"></i>
            </button>
            <span class="toggle-icon">▼</span>
        </div>
    `;
    
    // Event listener para o toggle (não acionar quando clicar no botão)
    const toggleIcon = header.querySelector('.toggle-icon');
    toggleIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCategoria(categoria);
    });
    
    // Event listener para o header (exceto botões)
    header.addEventListener('click', (e) => {
        if (!e.target.closest('.categoria-actions')) {
            toggleCategoria(categoria);
        }
    });
    
    // Event listener para o botão adicionar
    const btnAdicionar = header.querySelector('.btn-adicionar-item');
    btnAdicionar.addEventListener('click', (e) => {
        e.stopPropagation();
        adicionarItem(categoria);
    });

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
    
    // Container do nome com botão de editar
    const nomeContainer = document.createElement('div');
    nomeContainer.className = 'item-nome-container';
    
    const nomeDiv = document.createElement('div');
    nomeDiv.className = 'item-nome';
    nomeDiv.textContent = item.nome;
    
    // Botão de editar item (ao lado do nome)
    const btnEditar = document.createElement('button');
    btnEditar.className = 'btn-editar-item';
    btnEditar.innerHTML = '<i class="fas fa-edit"></i>';
    btnEditar.title = 'Editar nome do item';
    btnEditar.addEventListener('click', (e) => {
        e.stopPropagation(); // Impedir que o clique no item seja acionado
        editarItem(categoria, index);
    });
    
    nomeContainer.appendChild(nomeDiv);
    nomeContainer.appendChild(btnEditar);
    
    const valoresDiv = document.createElement('div');
    valoresDiv.className = 'item-valores';
    
    const valorAntigoDiv = document.createElement('div');
    valorAntigoDiv.className = 'item-valor-antigo-container';
    valorAntigoDiv.innerHTML = `
        <label>Preço:</label>
        <input type="number" class="item-valor-antigo" value="${item.valor.toFixed(2)}" step="0.01" min="0">
    `;
    
    const valorNovoDiv = document.createElement('div');
    valorNovoDiv.className = 'item-valor-novo-container';
    
    // Calcular preço ajustado: se houver valorNovo salvo, usar ele; senão, calcular com 12% padrão
    let valorAjustado;
    if (item.valorNovo !== undefined && item.valorNovo !== null) {
        valorAjustado = item.valorNovo;
    } else {
        // Calcular com percentual padrão de 12% (valor fixo = 0)
        valorAjustado = calcularNovoValor(item.valor, 0, 12);
    }
    
    const valorNovoTexto = `R$ ${valorAjustado.toFixed(2)}`;
    valorNovoDiv.innerHTML = `
        <label>Preço Ajustado:</label>
        <span class="item-valor-novo visible">${valorNovoTexto}</span>
    `;
    
    valoresDiv.appendChild(valorAntigoDiv);
    valoresDiv.appendChild(valorNovoDiv);
    
    info.appendChild(nomeContainer);
    info.appendChild(valoresDiv);

    // Botão de excluir item
    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn-excluir-item';
    btnExcluir.innerHTML = '<i class="fas fa-trash"></i>';
    btnExcluir.title = 'Excluir item';
    btnExcluir.addEventListener('click', (e) => {
        e.stopPropagation(); // Impedir que o clique no item seja acionado
        excluirItem(categoria, index);
    });

    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(info);
    itemDiv.appendChild(btnExcluir);

    // Adicionar ao conjunto de selecionados
    itensSelecionados.add(`${categoria}-${index}`);

    // Event listener para edição do preço antigo
    const inputValorAntigo = valorAntigoDiv.querySelector('.item-valor-antigo');
    const key = `${categoria}-${index}`;
    const id = itensIds[key];
    
    // Salvar quando o campo perder o foco (change)
    inputValorAntigo.addEventListener('change', async (e) => {
        const novoValor = parseFloat(e.target.value);
        if (!isNaN(novoValor) && novoValor >= 0) {
            if (!id) {
                await mostrarAlert('Erro', 'Erro ao identificar o item. Por favor, recarregue a página.');
                e.target.value = item.valor.toFixed(2);
                return;
            }
            
            try {
                // Atualizar o valor do item no banco
                await atualizarItemAPI(id, item.nome, novoValor);
                
                // Atualizar o valor do item localmente
                item.valor = novoValor;
                
                // Limpar preço novo quando o antigo for alterado manualmente
                if (item.valorNovo !== undefined) {
                    delete item.valorNovo;
                    // Limpar no banco também
                    await atualizarValorNovoAPI(id, null);
                }
                
                // Recalcular preço ajustado com percentual padrão de 12%
                const valorAjustado = calcularNovoValor(novoValor, 0, 12);
                
                // Atualizar interface
                const valorNovoElement = itemDiv.querySelector('.item-valor-novo');
                valorNovoElement.textContent = `R$ ${valorAjustado.toFixed(2)}`;
                valorNovoElement.classList.add('visible');
                
                // Feedback visual
                inputValorAntigo.style.borderColor = '#28a745';
                setTimeout(() => {
                    inputValorAntigo.style.borderColor = '#ddd';
                }, 1000);
            } catch (error) {
                // Erro ao salvar, restaurar valor
                e.target.value = item.valor.toFixed(2);
                inputValorAntigo.style.borderColor = '#dc3545';
                setTimeout(() => {
                    inputValorAntigo.style.borderColor = '#ddd';
                }, 1000);
                await mostrarAlert('Erro', 'Erro ao salvar o valor. Tente novamente.');
            }
        } else {
            // Valor inválido, restaurar o valor anterior
            e.target.value = item.valor.toFixed(2);
            inputValorAntigo.style.borderColor = '#dc3545';
            setTimeout(() => {
                inputValorAntigo.style.borderColor = '#ddd';
            }, 1000);
        }
    });
    
    // Também salvar quando pressionar Enter
    inputValorAntigo.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.target.blur(); // Força o evento change
        }
    });

    // Permitir clicar no item inteiro para marcar/desmarcar (exceto inputs)
    itemDiv.addEventListener('click', (e) => {
        if (e.target.type !== 'checkbox' && e.target.type !== 'number') {
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

// Calcular novo valor (primeiro aplica valor fixo, depois percentual)
function calcularNovoValor(valorAntigo, valorFixo, valorPercentual) {
    // Primeiro: soma o valor fixo
    let valorAposFixo = valorAntigo + valorFixo;
    
    // Depois: aplica o percentual sobre o resultado
    let valorFinal = valorAposFixo * (1 + valorPercentual / 100);
    
    return valorFinal;
}

// Obter item selecionado
function obterItem(categoria, index) {
    return itensPorCategoria[categoria][index];
}

// Inicializar eventos
function inicializarEventos() {
    // Botões de seleção
    document.getElementById('btn-selecionar-todos').addEventListener('click', selecionarTodosItens);
    document.getElementById('btn-deselecionar-todos').addEventListener('click', deselecionarTodosItens);
    
    // Botão resetar dados
    document.getElementById('btn-resetar-dados').addEventListener('click', resetarDados);
    
    // Botão adicionar novo produto
    document.getElementById('btn-adicionar-produto').addEventListener('click', adicionarNovoProduto);

    // Botão aplicar reajuste
    document.getElementById('btn-aplicar-reajuste').addEventListener('click', () => {
        const valorFixoInput = document.getElementById('valor-fixo');
        const valorPercentualInput = document.getElementById('valor-percentual');
        
        const valorFixo = parseFloat(valorFixoInput.value) || 0;
        const valorPercentual = parseFloat(valorPercentualInput.value) || 0;

        // Verificar se pelo menos um dos valores foi informado
        if (valorFixo === 0 && valorPercentual === 0) {
            mostrarAlert('Atenção', 'Por favor, informe pelo menos um valor (fixo ou percentual) para o reajuste.');
            return;
        }

        if (itensSelecionados.size === 0) {
            mostrarAlert('Atenção', 'Por favor, selecione pelo menos um item para reajustar.');
            return;
        }

        mostrarModalConfirmacao(valorFixo, valorPercentual);
    });

    // Modal
    const modal = document.getElementById('modal-confirmacao');
    const closeModal = document.querySelector('.close-modal');
    const btnCancelar = document.getElementById('btn-cancelar');
    const btnConfirmar = document.getElementById('btn-confirmar');

    closeModal.addEventListener('click', fecharModal);
    btnCancelar.addEventListener('click', fecharModal);
    btnConfirmar.addEventListener('click', async () => {
        fecharModal();
        await aplicarReajuste();
    });

    // Fechar modal ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    });
}

// Mostrar modal de confirmação
function mostrarModalConfirmacao(valorFixo, valorPercentual) {
    const modal = document.getElementById('modal-confirmacao');
    const modalValorFixo = document.getElementById('modal-valor-fixo');
    const modalValorPercentual = document.getElementById('modal-valor-percentual');
    const modalItensLista = document.getElementById('modal-itens-lista');

    if (!modal || !modalValorFixo || !modalValorPercentual || !modalItensLista) {
        console.error('Elementos do modal não encontrados!');
        mostrarAlert('Erro', 'Erro ao abrir o modal. Verifique o console para mais detalhes.');
        return;
    }

    // Atualizar informações do modal
    modalValorFixo.textContent = `R$ ${valorFixo.toFixed(2)}`;
    modalValorPercentual.textContent = `${valorPercentual.toFixed(2)}%`;

    // Criar lista de itens no modal
    modalItensLista.innerHTML = '';
    const itensArray = Array.from(itensSelecionados);

    itensArray.forEach(key => {
        const [categoria, index] = key.split('-');
        const item = obterItem(categoria, parseInt(index));
        
        // Obter o valor atual do input (pode ter sido editado)
        const itemElement = document.querySelector(`[data-categoria="${categoria}"][data-index="${index}"]`);
        const valorAntigoInput = itemElement ? itemElement.querySelector('.item-valor-antigo') : null;
        const valorAntigo = valorAntigoInput ? parseFloat(valorAntigoInput.value) : item.valor;
        
        const novoValor = calcularNovoValor(valorAntigo, valorFixo, valorPercentual);

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
                <span class="modal-item-valor-antigo">Preço: R$ ${valorAntigo.toFixed(2)}</span>
                <span class="modal-item-valor-novo">Ajustado: R$ ${novoValor.toFixed(2)}</span>
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
async function aplicarReajuste() {
    const valorFixo = parseFloat(document.getElementById('valor-fixo').value) || 0;
    const valorPercentual = parseFloat(document.getElementById('valor-percentual').value) || 0;

    if (itensSelecionados.size === 0) {
        await mostrarAlert('Atenção', 'Nenhum item selecionado para reajustar.');
        return;
    }

    // Atualizar valores dos itens selecionados
    const promessas = [];
    
    itensSelecionados.forEach(key => {
        const [categoria, index] = key.split('-');
        const item = obterItem(categoria, parseInt(index));
        const id = itensIds[key];
        
        if (!id) {
            console.error(`ID não encontrado para item ${key}`);
            return;
        }
        
        // Obter o valor atual do input (pode ter sido editado)
        const itemElement = document.querySelector(`[data-categoria="${categoria}"][data-index="${index}"]`);
        const valorAntigoInput = itemElement ? itemElement.querySelector('.item-valor-antigo') : null;
        const valorAntigo = valorAntigoInput ? parseFloat(valorAntigoInput.value) : item.valor;
        
        // Se houver valor fixo, atualizar o preço (item.valor) primeiro
        let valorAposFixo = valorAntigo;
        if (valorFixo > 0) {
            valorAposFixo = valorAntigo + valorFixo;
            // Atualizar o valor no banco
            promessas.push(atualizarItemAPI(id, item.nome, valorAposFixo));
            // Atualizar localmente
            item.valor = valorAposFixo;
            // Atualizar o input do preço na interface
            if (valorAntigoInput) {
                valorAntigoInput.value = valorAposFixo.toFixed(2);
            }
        }
        
        // Calcular preço ajustado aplicando o percentual sobre o novo valor
        // Se houver valor fixo, usar o novo valor (preço + fixo); senão, usar o valor atual
        const valorBaseParaPercentual = valorFixo > 0 ? valorAposFixo : valorAntigo;
        // Aplicar apenas o percentual sobre esse valor (sem somar valor fixo novamente)
        const valorAjustado = valorBaseParaPercentual * (1 + valorPercentual / 100);
        
        // Atualizar o valor novo (preço ajustado) no banco
        promessas.push(atualizarValorNovoAPI(id, valorAjustado));
        
        // Salvar o valor ajustado localmente
        item.valorNovo = valorAjustado;

        // Atualizar na interface
        if (itemElement) {
            const valorNovoElement = itemElement.querySelector('.item-valor-novo');
            
            // Atualizar o preço ajustado
            valorNovoElement.textContent = `R$ ${valorAjustado.toFixed(2)}`;
            valorNovoElement.classList.add('visible');
        }
    });

    try {
        // Aguardar todas as atualizações
        await Promise.all(promessas);
        
        // Limpar campos de reajuste (manter 12% como padrão no percentual)
        document.getElementById('valor-fixo').value = '0.00';
        document.getElementById('valor-percentual').value = '12.00';

        await mostrarAlert('Sucesso', `Reajuste aplicado com sucesso em ${itensSelecionados.size} item(ns)!`);
    } catch (error) {
        console.error('Erro ao aplicar reajuste:', error);
        await mostrarAlert('Erro', 'Erro ao salvar alguns valores. Verifique o console para mais detalhes.');
    }
}

