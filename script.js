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

// Função utilitária para fechar qualquer modal aberto
function fecharModalAberto() {
    const modais = document.querySelectorAll('.modal.show');
    modais.forEach(modal => {
        modal.classList.remove('show');
    });
}

// Listener global para ESC - fecha qualquer modal aberto
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharModalAberto();
    }
});

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
        
        // Listener para ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                fechar();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
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
        
        // Listener para ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                fechar(false);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
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
        
        // Listener para ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                fechar(null);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
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
        
        // Listener para ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                fechar(null);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
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
        
        // Listener para ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                fechar();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
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
        // IMPORTANTE: Preservar a ordem das chaves do objeto retornado
        itensPorCategoria = {};
        itensIds = {};
        
        // Usar Object.keys() que preserva a ordem de inserção em JavaScript moderno
        const categoriasOrdenadas = Object.keys(dados);
        console.log('Categorias recebidas da API (ordem):', categoriasOrdenadas);
        
        categoriasOrdenadas.forEach(categoria => {
            // Garantir que a categoria existe no objeto, mesmo se estiver vazia
            if (!itensPorCategoria[categoria]) {
                itensPorCategoria[categoria] = [];
            }
            
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
        
        console.log('Categorias após processamento (ordem):', Object.keys(itensPorCategoria));
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

async function salvarBackupValorAPI(id, valorBackup) {
    try {
        const response = await fetch(`${API_BASE}/api/itens/${id}/backup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ valorBackup })
        });
        
        if (!response.ok) {
            throw new Error('Erro ao salvar backup do valor');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao salvar backup do valor:', error);
        throw error;
    }
}

async function criarCategoriaAPI(nome) {
    try {
        const response = await fetch(`${API_BASE}/api/categorias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nome })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar categoria');
        }
        
        return await response.json();
    } catch (error) {
        console.error('Erro ao criar categoria:', error);
        throw error;
    }
}

async function resetarDados() {
    const confirmado = await mostrarConfirm('Confirmar Reset', 'Tem certeza que deseja resetar todos os valores para os valores antes do reajuste fixo? Esta ação irá restaurar os preços originais.');
    if (confirmado) {
        try {
            const response = await fetch(`${API_BASE}/api/resetar-valores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Erro ao resetar valores');
            }
            
            const resultado = await response.json();
            
            // Recarregar dados e interface
            await carregarDados();
            inicializarInterface();
            selecionarTodosItens();
            
            await mostrarAlert('Sucesso', `Valores resetados com sucesso! ${resultado.itensAtualizados} item(ns) foram restaurados.`);
        } catch (error) {
            console.error('Erro ao resetar valores:', error);
            await mostrarAlert('Erro', 'Erro ao resetar os valores. Tente novamente.');
        }
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

// Adicionar nova categoria
async function adicionarNovaCategoria() {
    // Pedir nome da categoria
    const nome = await mostrarPrompt('Adicionar Categoria', 'Digite o nome da nova categoria:');
    if (!nome || nome.trim() === '') {
        return; // Cancelado ou vazio
    }
    
    // Verificar se a categoria já existe
    if (itensPorCategoria[nome.trim()]) {
        await mostrarAlert('Erro', 'Esta categoria já existe!');
        return;
    }
    
    try {
        await criarCategoriaAPI(nome.trim());
        
        // Inicializar a categoria vazia localmente
        itensPorCategoria[nome.trim()] = [];
        
        // Recarregar dados e interface para garantir sincronização
        await carregarDados();
        inicializarInterface();
        selecionarTodosItens();
        
        await mostrarAlert('Sucesso', `Categoria "${nome.trim()}" criada com sucesso!`);
    } catch (error) {
        const mensagemErro = error.message.includes('UNIQUE') 
            ? 'Esta categoria já existe!' 
            : 'Erro ao criar a categoria. Tente novamente.';
        await mostrarAlert('Erro', mensagemErro);
    }
}

// Deletar categoria
async function deletarCategoria(categoria) {
    // Contar quantos itens a categoria tem
    const itensDaCategoria = itensPorCategoria[categoria] || [];
    const quantidadeItens = itensDaCategoria.length;
    
    // Mensagem de confirmação
    const mensagem = quantidadeItens > 0
        ? `Tem certeza que deseja deletar a categoria "${categoria}"?\n\nEsta ação irá deletar a categoria e todos os ${quantidadeItens} item(ns) contidos nela.\n\n⚠️ Esta ação NÃO pode ser desfeita!`
        : `Tem certeza que deseja deletar a categoria "${categoria}"?\n\n⚠️ Esta ação NÃO pode ser desfeita!`;
    
    const confirmado = await mostrarConfirm('Confirmar Exclusão de Categoria', mensagem);
    
    if (!confirmado) {
        return;
    }
    
    try {
        const url = `${API_BASE}/api/categorias/${encodeURIComponent(categoria)}`;
        console.log('Tentando deletar categoria:', categoria);
        console.log('URL da requisição:', url);
        
        const response = await fetch(url, {
            method: 'DELETE'
        });
        
        console.log('Status da resposta:', response.status);
        console.log('Response OK?', response.ok);
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                errorData = { error: `Erro HTTP ${response.status}: ${response.statusText}` };
            }
            console.error('Erro na resposta:', errorData);
            throw new Error(errorData.error || `Erro ao deletar categoria (${response.status})`);
        }
        
        const result = await response.json();
        console.log('Resposta do servidor:', result);
        
        // Remover a categoria do objeto local
        delete itensPorCategoria[categoria];
        
        // Remover o elemento do DOM
        const categoriaDiv = document.querySelector(`.categoria[data-categoria="${categoria}"]`);
        if (categoriaDiv) {
            categoriaDiv.remove();
        }
        
        await mostrarAlert('Sucesso', `Categoria "${categoria}" e todos os seus itens foram deletados com sucesso!`);
    } catch (error) {
        console.error('Erro ao deletar categoria:', error);
        console.error('Stack trace:', error.stack);
        const mensagemErro = error.message || 'Erro ao deletar a categoria. Tente novamente.';
        await mostrarAlert('Erro', mensagemErro);
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

    // Garantir que iteramos na ordem correta das chaves do objeto
    // Object.keys() preserva a ordem de inserção em JavaScript moderno
    const categoriasOrdenadas = Object.keys(itensPorCategoria);
    console.log('Categorias para renderizar (ordem):', categoriasOrdenadas);
    
    categoriasOrdenadas.forEach(categoria => {
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
        <div class="categoria-header-left">
            <input type="checkbox" class="categoria-checkbox" id="categoria-checkbox-${categoria}" title="Selecionar/Deselecionar todos os itens desta categoria">
            <span class="drag-handle" title="Arrastar para reordenar" draggable="true">
                <i class="fas fa-grip-vertical"></i>
            </span>
        </div>
        <span class="categoria-titulo">${icone} ${categoria}</span>
        <div class="categoria-actions">
            <button class="btn-adicionar-item" title="Adicionar item" data-categoria="${categoria}">
                <i class="fas fa-plus"></i>
            </button>
            <button class="btn-deletar-categoria" title="Deletar categoria" data-categoria="${categoria}">
                <i class="fas fa-trash"></i>
            </button>
            <span class="toggle-icon">▼</span>
        </div>
    `;
    
    // Checkbox da categoria para selecionar/deselecionar todos os itens
    const categoriaCheckbox = header.querySelector('.categoria-checkbox');
    
    // Função para atualizar o estado do checkbox da categoria
    const atualizarCheckboxCategoria = () => {
        const itensDaCategoria = itensPorCategoria[categoria] || [];
        if (itensDaCategoria.length === 0) {
            categoriaCheckbox.checked = false;
            categoriaCheckbox.disabled = true;
            return;
        }
        categoriaCheckbox.disabled = false;
        
        // Verificar quantos itens estão selecionados
        let selecionados = 0;
        itensDaCategoria.forEach((item, index) => {
            const key = `${categoria}-${index}`;
            if (itensSelecionados.has(key)) {
                selecionados++;
            }
        });
        
        // Se todos estão selecionados, marcar como checked
        // Se nenhum está selecionado, marcar como unchecked
        // Se alguns estão selecionados, marcar como indeterminate (estado parcial)
        if (selecionados === itensDaCategoria.length) {
            categoriaCheckbox.checked = true;
            categoriaCheckbox.indeterminate = false;
        } else if (selecionados === 0) {
            categoriaCheckbox.checked = false;
            categoriaCheckbox.indeterminate = false;
        } else {
            categoriaCheckbox.checked = false;
            categoriaCheckbox.indeterminate = true;
        }
    };
    
    // Event listener para o checkbox da categoria
    categoriaCheckbox.addEventListener('change', (e) => {
        e.stopPropagation();
        const isChecked = e.target.checked;
        const itensDaCategoria = itensPorCategoria[categoria] || [];
        
        itensDaCategoria.forEach((item, index) => {
            const key = `${categoria}-${index}`;
            const itemCheckbox = document.getElementById(`item-${categoria}-${index}`);
            
            if (itemCheckbox) {
                itemCheckbox.checked = isChecked;
                if (isChecked) {
                    itensSelecionados.add(key);
                } else {
                    itensSelecionados.delete(key);
                }
            }
        });
        
        categoriaCheckbox.indeterminate = false;
    });
    
    // Armazenar referência para atualizar quando itens forem selecionados/deselecionados
    categoriaDiv._atualizarCheckbox = atualizarCheckboxCategoria;
    
    // Event listeners para drag and drop
    const dragHandle = header.querySelector('.drag-handle');
    
    dragHandle.addEventListener('dragstart', (e) => {
        // Marcar a categoria como sendo arrastada
        categoriaDiv.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', categoria);
        // Armazenar referência à categoria no elemento
        e.dataTransfer.setData('application/categoria-element', categoriaDiv.outerHTML);
    });
    
    dragHandle.addEventListener('dragend', () => {
        categoriaDiv.classList.remove('dragging');
        document.querySelectorAll('.categoria').forEach(cat => {
            cat.classList.remove('drag-over');
        });
        salvarOrdemCategorias();
    });
    
    // Permitir drop na categoria inteira
    categoriaDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const dragging = document.querySelector('.dragging');
        if (!dragging || dragging === categoriaDiv) return;
        
        const container = categoriaDiv.parentElement;
        const afterElement = getDragAfterElement(container, e.clientY);
        
        if (afterElement == null) {
            container.appendChild(dragging);
        } else {
            container.insertBefore(dragging, afterElement);
        }
    });
    
    categoriaDiv.addEventListener('dragenter', (e) => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        if (dragging && dragging !== categoriaDiv) {
            categoriaDiv.classList.add('drag-over');
        }
    });
    
    categoriaDiv.addEventListener('dragleave', (e) => {
        // Só remover se realmente saiu da categoria
        if (!categoriaDiv.contains(e.relatedTarget)) {
            categoriaDiv.classList.remove('drag-over');
        }
    });
    
    categoriaDiv.addEventListener('drop', (e) => {
        e.preventDefault();
        categoriaDiv.classList.remove('drag-over');
    });
    
    // Event listener para o toggle (não acionar quando clicar no botão)
    const toggleIcon = header.querySelector('.toggle-icon');
    toggleIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleCategoria(categoria);
    });
    
    // Event listener para o header (exceto botões, drag handle e checkbox)
    header.addEventListener('click', (e) => {
        if (!e.target.closest('.categoria-actions') && 
            !e.target.closest('.drag-handle') && 
            !e.target.closest('.categoria-header-left') &&
            !e.target.closest('.categoria-checkbox') &&
            e.target !== categoriaCheckbox &&
            e.target.type !== 'checkbox') {
            toggleCategoria(categoria);
        }
    });
    
    // Event listener para o botão adicionar
    const btnAdicionar = header.querySelector('.btn-adicionar-item');
    btnAdicionar.addEventListener('click', (e) => {
        e.stopPropagation();
        adicionarItem(categoria);
    });
    
    // Event listener para o botão deletar categoria
    const btnDeletar = header.querySelector('.btn-deletar-categoria');
    btnDeletar.addEventListener('click', (e) => {
        e.stopPropagation();
        deletarCategoria(categoria);
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
    
    // Atualizar estado inicial do checkbox da categoria
    setTimeout(() => {
        atualizarCheckboxCategoria();
    }, 0);

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
        
        // Atualizar checkbox da categoria
        const categoriaDiv = itemDiv.closest('.categoria');
        if (categoriaDiv && categoriaDiv._atualizarCheckbox) {
            categoriaDiv._atualizarCheckbox();
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
    
    // Removido: exibição do preço ajustado (será usado no futuro)
    
    valoresDiv.appendChild(valorAntigoDiv);
    
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
                
                // Limpar preço novo quando o antigo for alterado manualmente (se existir)
                if (item.valorNovo !== undefined) {
                    delete item.valorNovo;
                    // Limpar no banco também
                    await atualizarValorNovoAPI(id, null);
                }
                
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

// Função auxiliar para drag and drop
function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.categoria:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Salvar ordem das categorias
async function salvarOrdemCategorias() {
    const container = document.getElementById('categorias-container');
    if (!container) {
        console.error('Container de categorias não encontrado!');
        return;
    }
    
    const categorias = Array.from(container.querySelectorAll('.categoria')).map(cat => cat.dataset.categoria);
    
    if (categorias.length === 0) {
        console.warn('Nenhuma categoria encontrada para salvar');
        return;
    }
    
    console.log('=== SALVANDO ORDEM DAS CATEGORIAS ===');
    console.log('Ordem atual no DOM:', categorias);
    
    try {
        const response = await fetch(`${API_BASE}/api/categorias/ordem`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ categorias })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erro ao salvar ordem das categorias');
        }
        
        const result = await response.json();
        console.log('✓ Ordem das categorias salva com sucesso!');
        console.log('Resposta do servidor:', result);
        console.log('Ordem salva:', categorias);
    } catch (error) {
        console.error('✗ ERRO ao salvar ordem das categorias:', error);
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
    
    // Atualizar checkboxes das categorias
    document.querySelectorAll('.categoria').forEach(catDiv => {
        if (catDiv._atualizarCheckbox) {
            catDiv._atualizarCheckbox();
        }
    });
}

// Deselecionar todos os itens
function deselecionarTodosItens() {
    itensSelecionados.clear();
    document.querySelectorAll('.item input[type="checkbox"]').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    // Atualizar checkboxes das categorias
    document.querySelectorAll('.categoria').forEach(catDiv => {
        if (catDiv._atualizarCheckbox) {
            catDiv._atualizarCheckbox();
        }
    });
}

// Calcular novo valor baseado no tipo de reajuste
function calcularNovoValor(valorAntigo, tipoReajuste, valor) {
    if (!valorAntigo || isNaN(valorAntigo)) {
        console.error('Valor antigo inválido:', valorAntigo);
        return valorAntigo || 0;
    }
    
    if (!valor || isNaN(valor)) {
        console.error('Valor de reajuste inválido:', valor);
        return valorAntigo;
    }
    
    if (tipoReajuste === 'fixo') {
        // Valor fixo: soma ao valor atual
        return valorAntigo + valor;
    } else if (tipoReajuste === 'percentual') {
        // Percentual: aplica sobre o valor atual
        return valorAntigo * (1 + valor / 100);
    } else {
        console.error('Tipo de reajuste inválido:', tipoReajuste);
        return valorAntigo;
    }
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
    
    // Botão adicionar categoria
    document.getElementById('btn-adicionar-categoria').addEventListener('click', adicionarNovaCategoria);

    // Botão aplicar reajuste
    document.getElementById('btn-aplicar-reajuste').addEventListener('click', () => {
        const tipoReajuste = document.querySelector('input[name="tipo-reajuste"]:checked').value;
        const valorInputId = tipoReajuste === 'fixo' ? 'valor-reajuste-fixo' : 'valor-reajuste-percentual';
        const valorInput = document.getElementById(valorInputId);
        const valor = parseFloat(valorInput.value.replace(',', '.')) || 0;

        // Verificar se o valor foi informado
        if (valor === 0) {
            mostrarAlert('Atenção', 'Por favor, informe um valor para o reajuste.');
            return;
        }

        if (itensSelecionados.size === 0) {
            mostrarAlert('Atenção', 'Por favor, selecione pelo menos um item para reajustar.');
            return;
        }

        mostrarModalConfirmacao(tipoReajuste, valor);
    });
    
    // Alternar entre valor fixo e percentual
    document.querySelectorAll('input[name="tipo-reajuste"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            const tipo = e.target.value;
            const grupoFixo = document.getElementById('grupo-valor-fixo');
            const grupoPercentual = document.getElementById('grupo-valor-percentual');
            const valorInputFixo = document.getElementById('valor-reajuste-fixo');
            const valorInputPercentual = document.getElementById('valor-reajuste-percentual');
            
            if (tipo === 'fixo') {
                grupoFixo.style.display = 'block';
                grupoPercentual.style.display = 'none';
                valorInputFixo.focus();
            } else {
                grupoFixo.style.display = 'none';
                grupoPercentual.style.display = 'block';
                valorInputPercentual.focus();
            }
        });
    });
    
    // Configurar placeholders para os campos de reajuste
    const valorInputFixo = document.getElementById('valor-reajuste-fixo');
    const valorInputPercentual = document.getElementById('valor-reajuste-percentual');
    
    [valorInputFixo, valorInputPercentual].forEach(input => {
        if (!input) return;
        
        // Ao focar, limpar se for apenas o placeholder
        input.addEventListener('focus', () => {
            if (input.value === '' || input.value === '0' || input.value === '0,00' || input.value === '0.00') {
                input.value = '';
            }
        });
        
        // Ao perder o foco, restaurar placeholder se vazio
        input.addEventListener('blur', () => {
            if (input.value === '' || input.value === '0' || input.value === '0,00' || input.value === '0.00') {
                input.value = '';
            }
        });
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
    
    // Fechar modal ao pressionar ESC (já está coberto pelo listener global, mas adicionando aqui também para garantir)
}

// Mostrar modal de confirmação
function mostrarModalConfirmacao(tipoReajuste, valor) {
    const modal = document.getElementById('modal-confirmacao');
    const modalValorFixo = document.getElementById('modal-valor-fixo');
    const modalValorPercentual = document.getElementById('modal-valor-percentual');
    const modalItensLista = document.getElementById('modal-itens-lista');

    if (!modal || !modalValorFixo || !modalValorPercentual || !modalItensLista) {
        console.error('Elementos do modal não encontrados!');
        mostrarAlert('Erro', 'Erro ao abrir o modal. Verifique o console para mais detalhes.');
        return;
    }

    // Atualizar informações do modal baseado no tipo
    const modalValorFixoContainer = document.getElementById('modal-valor-fixo-container');
    const modalValorPercentualContainer = document.getElementById('modal-valor-percentual-container');
    
    if (tipoReajuste === 'fixo') {
        modalValorFixo.textContent = `R$ ${valor.toFixed(2)}`;
        // Mostrar apenas valor fixo
        modalValorFixoContainer.style.display = '';
        modalValorPercentualContainer.style.display = 'none';
    } else {
        // Esconder completamente o valor fixo quando for percentual
        modalValorFixoContainer.style.display = 'none';
        modalValorPercentual.textContent = `${valor.toFixed(2)}%`;
        modalValorPercentualContainer.style.display = '';
    }

    // Criar lista de itens no modal
    modalItensLista.innerHTML = '';
    const itensArray = Array.from(itensSelecionados);

    itensArray.forEach(key => {
        const [categoria, index] = key.split('-');
        const item = obterItem(categoria, parseInt(index));
        
        // Obter o valor atual do input (pode ter sido editado)
        const itemElement = document.querySelector(`[data-categoria="${categoria}"][data-index="${index}"]`);
        const valorAntigoInput = itemElement ? itemElement.querySelector('.item-valor-antigo') : null;
        const valorAntigo = valorAntigoInput ? parseFloat(valorAntigoInput.value) : (item.valor || 0);
        
        // Validar valor antigo
        if (isNaN(valorAntigo) || valorAntigo < 0) {
            console.error(`Valor antigo inválido para item ${key}:`, valorAntigo);
            return;
        }
        
        const novoValor = calcularNovoValor(valorAntigo, tipoReajuste, valor);
        
        // Validar novo valor
        if (isNaN(novoValor)) {
            console.error(`Erro ao calcular novo valor para item ${key}. Valor antigo: ${valorAntigo}, Tipo: ${tipoReajuste}, Valor: ${valor}`);
            return;
        }

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
                <span class="modal-item-valor-antigo">Preço Atual: R$ ${valorAntigo.toFixed(2)}</span>
                <span class="modal-item-valor-novo">Novo Preço: R$ ${novoValor.toFixed(2)}</span>
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

    // Fechar modal ao clicar fora (se ainda não tiver)
    if (!modal.hasAttribute('data-click-listener')) {
        modal.setAttribute('data-click-listener', 'true');
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                fecharModal();
            }
        });
    }

    modal.classList.add('show');
}

// Fechar modal
function fecharModal() {
    const modal = document.getElementById('modal-confirmacao');
    modal.classList.remove('show');
}

// Aplicar reajuste
async function aplicarReajuste() {
    const tipoReajuste = document.querySelector('input[name="tipo-reajuste"]:checked').value;
    const valorInputId = tipoReajuste === 'fixo' ? 'valor-reajuste-fixo' : 'valor-reajuste-percentual';
    const valorInput = document.getElementById(valorInputId);
    const valor = parseFloat(valorInput.value.replace(',', '.')) || 0;

    if (itensSelecionados.size === 0) {
        await mostrarAlert('Atenção', 'Nenhum item selecionado para reajustar.');
        return;
    }

    const promessas = [];
    
    // Atualizar valores dos itens selecionados
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
        const valorAtual = valorAntigoInput ? parseFloat(valorAntigoInput.value) : (item.valor || 0);
        
        // Validar valor atual
        if (isNaN(valorAtual) || valorAtual < 0) {
            console.error(`Valor atual inválido para item ${key}:`, valorAtual);
            return;
        }
        
        // Calcular novo valor baseado no tipo de reajuste
        const novoValor = calcularNovoValor(valorAtual, tipoReajuste, valor);
        
        // Validar novo valor
        if (isNaN(novoValor) || novoValor < 0) {
            console.error(`Erro ao calcular novo valor para item ${key}. Valor atual: ${valorAtual}, Tipo: ${tipoReajuste}, Valor: ${valor}`);
            return;
        }
        
        // Atualizar o preço no banco de dados
        promessas.push(atualizarItemAPI(id, item.nome, novoValor));
        
        // Atualizar localmente
        item.valor = novoValor;

        // Atualizar na interface
        if (itemElement && valorAntigoInput) {
            valorAntigoInput.value = novoValor.toFixed(2);
            
            // Feedback visual
            valorAntigoInput.style.borderColor = '#28a745';
            setTimeout(() => {
                valorAntigoInput.style.borderColor = '#ddd';
            }, 1000);
        }
    });

    try {
        // Aguardar todas as atualizações
        await Promise.all(promessas);
        
        // Limpar campo de reajuste
        const valorInputId = tipoReajuste === 'fixo' ? 'valor-reajuste-fixo' : 'valor-reajuste-percentual';
        const valorInput = document.getElementById(valorInputId);
        if (valorInput) {
            valorInput.value = '';
        }

        await mostrarAlert('Sucesso', `Reajuste aplicado com sucesso em ${itensSelecionados.size} item(ns)!`);
    } catch (error) {
        console.error('Erro ao aplicar reajuste:', error);
        await mostrarAlert('Erro', 'Erro ao salvar alguns valores. Verifique o console para mais detalhes.');
    }
}

