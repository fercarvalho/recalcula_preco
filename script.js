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
// Estado do drag and drop
let dragState = {
    lastDragOverElement: null,
    lastDragOverPosition: null,
    draggingItem: null
};
// Plataformas cadastradas
let plataformas = [];

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

function mostrarSelecaoCategoria(categoriaAtual = null) {
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
            
            // Destacar a categoria atual se fornecida
            if (categoriaAtual && categoria === categoriaAtual) {
                btnCategoria.classList.add('categoria-atual');
                btnCategoria.innerHTML = `${categoria} <span style="color: #999; font-size: 0.9em;">(atual)</span>`;
            }
            
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

async function atualizarItemAPI(id, nome, valor, categoria) {
    try {
        const body = { nome, valor };
        if (categoria !== undefined && categoria !== null) {
            body.categoria = categoria.trim();
        }
        
        console.log('[API] Atualizando item:', { id, nome, valor, categoria: body.categoria });
        
        const response = await fetch(`${API_BASE}/api/itens/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[API] Erro na resposta:', response.status, errorText);
            throw new Error('Erro ao atualizar item');
        }
        
        const result = await response.json();
        console.log('[API] Item atualizado com sucesso:', result);
        return result;
    } catch (error) {
        console.error('[API] Erro ao atualizar item:', error);
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

// Criar uma linha de item no modo múltiplo
function criarLinhaItem(container, categorias, categoriaPadrao = null, podeRemover = false) {
    const linha = document.createElement('div');
    linha.className = 'item-linha';
    
    // Campo Nome
    const grupoNome = document.createElement('div');
    grupoNome.className = 'form-group nome';
    const labelNome = document.createElement('label');
    labelNome.textContent = 'Nome';
    const inputNome = document.createElement('input');
    inputNome.type = 'text';
    inputNome.className = 'form-input';
    inputNome.placeholder = 'Digite o nome do item';
    grupoNome.appendChild(labelNome);
    grupoNome.appendChild(inputNome);
    
    // Campo Valor
    const grupoValor = document.createElement('div');
    grupoValor.className = 'form-group valor';
    const labelValor = document.createElement('label');
    labelValor.textContent = 'Preço (R$)';
    const inputValor = document.createElement('input');
    inputValor.type = 'number';
    inputValor.className = 'form-input';
    inputValor.step = '0.01';
    inputValor.min = '0';
    inputValor.placeholder = '0,00';
    grupoValor.appendChild(labelValor);
    grupoValor.appendChild(inputValor);
    
    // Campo Categoria - Label fora do grupo
    const labelCategoria = document.createElement('label');
    labelCategoria.textContent = 'Categoria';
    labelCategoria.className = 'label-categoria-externo';
    labelCategoria.draggable = false;
    
    const grupoCategoria = document.createElement('div');
    grupoCategoria.className = 'form-group categoria';
    const selectCategoria = document.createElement('select');
    selectCategoria.className = 'form-input';
    selectCategoria.draggable = false;
    
    // Adicionar opções de categoria
    categorias.forEach((categoria) => {
        const option = document.createElement('option');
        option.value = categoria;
        option.textContent = categoria;
        if (categoriaPadrao && categoria === categoriaPadrao) {
            option.selected = true;
        } else if (!categoriaPadrao && categorias.indexOf(categoria) === 0) {
            option.selected = true;
        }
        selectCategoria.appendChild(option);
    });
    
    grupoCategoria.appendChild(selectCategoria);
    
    // Botão Adicionar Linha
    const btnAdicionar = document.createElement('button');
    btnAdicionar.type = 'button';
    btnAdicionar.className = 'btn-adicionar-linha';
    btnAdicionar.innerHTML = '<i class="fas fa-plus"></i>';
    btnAdicionar.title = 'Adicionar outra linha';
    
    // Botão Remover Linha (se pode remover)
    let btnRemover = null;
    if (podeRemover) {
        btnRemover = document.createElement('button');
        btnRemover.type = 'button';
        btnRemover.className = 'btn-remover-linha';
        btnRemover.innerHTML = '<i class="fas fa-times"></i>';
        btnRemover.title = 'Remover esta linha';
        btnRemover.onclick = () => {
            linha.remove();
        };
    }
    
    linha.appendChild(grupoNome);
    linha.appendChild(grupoValor);
    // Criar container para categoria com label externo
    const containerCategoria = document.createElement('div');
    containerCategoria.className = 'categoria-container';
    containerCategoria.appendChild(labelCategoria);
    containerCategoria.appendChild(grupoCategoria);
    linha.appendChild(containerCategoria);
    linha.appendChild(btnAdicionar);
    if (btnRemover) {
        linha.appendChild(btnRemover);
    }
    
    // Adicionar nova linha ao clicar no botão +
    btnAdicionar.onclick = () => {
        const novaLinha = criarLinhaItem(container, categorias, null, true);
        container.appendChild(novaLinha);
        // Focar no campo nome da nova linha
        const novoInputNome = novaLinha.querySelector('.form-group.nome input');
        if (novoInputNome) {
            novoInputNome.focus();
        }
    };
    
    container.appendChild(linha);
    
    // Focar no campo nome ao criar
    inputNome.focus();
    
    return linha;
}

// Mostrar modal de edição/adição de item
function mostrarModalEditarItem(nomeAtual = '', categoriaAtual = null, valorAtual = null, modoAdicionar = false) {
    return new Promise((resolve) => {
        const modal = document.getElementById('modal-editar-item');
        const modalContent = document.getElementById('modal-editar-item-content');
        const titulo = document.getElementById('modal-editar-item-titulo');
        const formSimples = document.getElementById('modal-editar-item-form-simples');
        const formMultiplos = document.getElementById('modal-editar-item-form-multiplos');
        const containerLinhas = document.getElementById('modal-itens-linhas');
        const inputNome = document.getElementById('modal-editar-item-nome');
        const inputValor = document.getElementById('modal-editar-item-valor');
        const grupoValor = document.getElementById('modal-editar-item-valor-group');
        const selectCategoria = document.getElementById('modal-editar-item-categoria');
        const btnOk = document.getElementById('btn-editar-item-ok');
        const btnCancel = document.getElementById('btn-editar-item-cancel');
        
        // Obter categorias disponíveis
        const categorias = Object.keys(itensPorCategoria);
        
        if (categorias.length === 0) {
            mostrarAlert('Atenção', 'Não há categorias disponíveis. Por favor, crie uma categoria primeiro.');
            resolve(null);
            return;
        }
        
        // Configurar modal baseado no modo
        if (modoAdicionar) {
            // Modo adicionar múltiplos
            titulo.textContent = 'Adicionar Novos Produtos';
            btnOk.textContent = 'Adicionar Todos';
            formSimples.style.display = 'none';
            formMultiplos.style.display = 'block';
            modalContent.classList.add('modal-content-large');
            
            // Limpar container de linhas
            containerLinhas.innerHTML = '';
            
            // Criar primeira linha
            criarLinhaItem(containerLinhas, categorias, categoriaAtual, false);
        } else {
            // Modo edição simples
            titulo.textContent = 'Editar Item';
            btnOk.textContent = 'Salvar';
            formSimples.style.display = 'block';
            formMultiplos.style.display = 'none';
            modalContent.classList.remove('modal-content-large');
            
            grupoValor.style.display = 'none';
            inputValor.value = '';
            inputNome.value = nomeAtual;
            
            // Limpar e preencher dropdown de categorias
            selectCategoria.innerHTML = '<option value="">Selecione uma categoria...</option>';
            categorias.forEach((categoria) => {
                const option = document.createElement('option');
                option.value = categoria;
                option.textContent = categoria;
                
                if (categoriaAtual && categoria === categoriaAtual) {
                    option.selected = true;
                }
                
                selectCategoria.appendChild(option);
            });
        }
        
        const fechar = (resultado) => {
            modal.classList.remove('show');
            resolve(resultado);
        };
        
        const salvar = () => {
            if (modoAdicionar) {
                // Modo múltiplo: coletar todas as linhas
                const linhas = containerLinhas.querySelectorAll('.item-linha');
                const itens = [];
                
                try {
                    linhas.forEach((linha) => {
                        const inputNomeLinha = linha.querySelector('.form-group.nome input');
                        const inputValorLinha = linha.querySelector('.form-group.valor input');
                        const selectCategoriaLinha = linha.querySelector('.form-group.categoria select');
                        
                        const nome = inputNomeLinha.value.trim();
                        const valorStr = inputValorLinha.value.trim();
                        const categoria = selectCategoriaLinha.value.trim();
                        
                        // Validar linha (pular linhas vazias)
                        if (!nome && !valorStr && !categoria) {
                            return; // Linha vazia, pular
                        }
                        
                        // Validar campos obrigatórios
                        if (!nome) {
                            mostrarAlert('Atenção', 'O nome do item não pode estar vazio!');
                            inputNomeLinha.focus();
                            throw new Error('Nome vazio');
                        }
                        
                        if (!valorStr) {
                            mostrarAlert('Atenção', 'O preço do item não pode estar vazio!');
                            inputValorLinha.focus();
                            throw new Error('Valor vazio');
                        }
                        
                        if (!categoria) {
                            mostrarAlert('Atenção', 'Por favor, selecione uma categoria!');
                            selectCategoriaLinha.focus();
                            throw new Error('Categoria vazia');
                        }
                        
                        const valor = parseFloat(valorStr.replace(',', '.'));
                        if (isNaN(valor) || valor < 0) {
                            mostrarAlert('Atenção', 'O preço deve ser um número válido maior ou igual a zero!');
                            inputValorLinha.focus();
                            throw new Error('Valor inválido');
                        }
                        
                        itens.push({
                            nome: nome,
                            categoria: categoria,
                            valor: valor
                        });
                    });
                    
                    if (itens.length === 0) {
                        mostrarAlert('Atenção', 'Por favor, preencha pelo menos um item!');
                        return;
                    }
                    
                    fechar({
                        itens: itens
                    });
                } catch (error) {
                    // Erro já foi tratado com alert
                    return;
                }
            } else {
                // Modo edição simples
                const novoNome = inputNome.value.trim();
                if (!novoNome) {
                    mostrarAlert('Atenção', 'O nome do item não pode estar vazio!');
                    return;
                }
                
                const categoriaSelecionada = selectCategoria.value.trim();
                if (!categoriaSelecionada) {
                    mostrarAlert('Atenção', 'Por favor, selecione uma categoria!');
                    return;
                }
                
                fechar({
                    nome: novoNome,
                    categoria: categoriaSelecionada
                });
            }
        };
        
        btnOk.onclick = salvar;
        btnCancel.onclick = () => fechar(null);
        modal.querySelector('.close-modal').onclick = () => fechar(null);
        modal.onclick = (e) => {
            if (e.target === modal) fechar(null);
        };
        
        // Permitir salvar com Enter no campo de nome ou valor (modo simples)
        if (!modoAdicionar) {
            inputNome.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    salvar();
                }
            };
        }
        
        // Listener para ESC
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                fechar(null);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
        
        modal.classList.add('show');
        if (!modoAdicionar) {
            inputNome.focus();
            if (nomeAtual) {
                inputNome.select();
            }
        }
    });
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
    
    // Mostrar modal de edição
    const resultado = await mostrarModalEditarItem(item.nome, categoria);
    
    if (!resultado) {
        return; // Cancelado
    }
    
    const { nome: novoNome, categoria: novaCategoria } = resultado;
    
    // Verificar se houve mudanças
    const nomeMudou = novoNome !== item.nome;
    const categoriaMudou = novaCategoria !== categoria;
    
    if (!nomeMudou && !categoriaMudou) {
        return; // Nenhuma mudança
    }
    
    try {
        // Atualizar item com nome e categoria
        await atualizarItemAPI(id, novoNome, item.valor, novaCategoria);
        
        // Recarregar dados e interface
        await carregarDados();
        inicializarInterface();
        selecionarTodosItens();
        
        let mensagem = 'Item atualizado com sucesso!';
        if (categoriaMudou) {
            mensagem += `\nItem movido da categoria "${categoria}" para "${novaCategoria}".`;
        }
        
        await mostrarAlert('Sucesso', mensagem);
    } catch (error) {
        await mostrarAlert('Erro', 'Erro ao atualizar o item. Tente novamente.');
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
    // Verificar se há categorias disponíveis
    const categorias = Object.keys(itensPorCategoria);
    if (categorias.length === 0) {
        await mostrarAlert('Atenção', 'Não há categorias disponíveis. Por favor, crie uma categoria primeiro.');
        return;
    }
    
    // Mostrar modal de adição
    const resultado = await mostrarModalEditarItem('', null, '', true);
    
    if (!resultado) {
        return; // Cancelado
    }
    
    // Verificar se é modo múltiplo (array de itens) ou modo simples (objeto único)
    if (resultado.itens && Array.isArray(resultado.itens)) {
        // Modo múltiplo: adicionar todos os itens
        try {
            let sucessos = 0;
            let erros = 0;
            
            for (const item of resultado.itens) {
                try {
                    await criarItemAPI(item.categoria, item.nome, item.valor);
                    sucessos++;
                } catch (error) {
                    console.error('Erro ao adicionar item:', item, error);
                    erros++;
                }
            }
            
            // Recarregar dados e interface
            await carregarDados();
            inicializarInterface();
            selecionarTodosItens();
            
            if (erros === 0) {
                await mostrarAlert('Sucesso', `${sucessos} produto(s) adicionado(s) com sucesso!`);
            } else {
                await mostrarAlert('Atenção', `${sucessos} produto(s) adicionado(s) com sucesso, mas ${erros} falharam.`);
            }
        } catch (error) {
            await mostrarAlert('Erro', 'Erro ao adicionar os produtos. Tente novamente.');
        }
    } else {
        // Modo simples (compatibilidade)
        const { nome, categoria, valor } = resultado;
        
        try {
            await criarItemAPI(categoria, nome, valor);
            
            // Recarregar dados e interface
            await carregarDados();
            inicializarInterface();
            selecionarTodosItens();
            
            await mostrarAlert('Sucesso', `Produto "${nome}" adicionado com sucesso na categoria "${categoria}"!`);
        } catch (error) {
            await mostrarAlert('Erro', 'Erro ao adicionar o produto. Tente novamente.');
        }
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
    carregarPlataformas(); // Carregar plataformas do localStorage
    await carregarDados(); // Carregar dados da API primeiro
    inicializarInterface();
    inicializarEventos();
    selecionarTodosItens();
    aplicarConfiguracoesAdmin(); // Aplicar configurações do painel admin
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
    
    // Atualizar preços das plataformas após criar todos os itens
    setTimeout(() => {
        atualizarPrecosPlataformas();
    }, 100);
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
    
    // Adicionar event listeners no categoriaBody uma única vez (não por item)
    // Isso garante que o item nunca saia da categoria durante o drag
    body.addEventListener('dragover', (e) => {
        const dragging = dragState.draggingItem || document.querySelector('.item.dragging');
        if (dragging && dragging._isDragging) {
            const draggingCategoria = dragging._originalCategoria || dragging.dataset.categoria;
            if (draggingCategoria === categoria) {
                e.preventDefault();
                e.stopPropagation();
                
                // Garantir que o item está dentro do body
                if (!body.contains(dragging)) {
                    body.appendChild(dragging);
                }
            }
        }
    });
    
    body.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const dragging = dragState.draggingItem || document.querySelector('.item.dragging');
        if (dragging && dragging._isDragging) {
            const draggingCategoria = dragging._originalCategoria || dragging.dataset.categoria;
            if (draggingCategoria === categoria) {
                // Garantir que o item está dentro do body
                if (!body.contains(dragging)) {
                    body.appendChild(dragging);
                }
            }
        }
    });
    
    body.addEventListener('dragleave', (e) => {
        const relatedTarget = e.relatedTarget;
        // Se saiu completamente do categoriaBody
        if (relatedTarget && !body.contains(relatedTarget)) {
            const dragging = dragState.draggingItem || document.querySelector('.item.dragging');
            if (dragging && dragging._isDragging) {
                const draggingCategoria = dragging._originalCategoria || dragging.dataset.categoria;
                if (draggingCategoria === categoria) {
                    // Garantir que o item volta para dentro do body
                    if (!body.contains(dragging)) {
                        body.appendChild(dragging);
                    }
                }
            }
        }
    });

    itensPorCategoria[categoria].forEach((item, index) => {
        const itemDiv = criarItem(categoria, index, item);
        body.appendChild(itemDiv);
    });

    categoriaDiv.appendChild(header);
    categoriaDiv.appendChild(body);
    
    // Aplicar cores personalizadas
    const config = carregarConfiguracoesAdmin();
    header.style.background = config.corPrimaria;
    
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
    
    // Armazenar o ID diretamente no elemento para facilitar o acesso
    const itemKey = `${categoria}-${index}`;
    const itemId = itensIds[itemKey];
    if (itemId) {
        itemDiv.dataset.itemId = itemId;
    }

    // Handle de drag para reordenar itens
    const dragHandle = document.createElement('span');
    dragHandle.className = 'item-drag-handle';
    dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
    dragHandle.title = 'Arrastar para reordenar';
    dragHandle.draggable = true;
    
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
    
    // Adicionar preços das plataformas após criar o item completo
    // Será chamado após o item ser adicionado ao DOM

    // Botão de excluir item
    const btnExcluir = document.createElement('button');
    btnExcluir.className = 'btn-excluir-item';
    btnExcluir.innerHTML = '<i class="fas fa-trash"></i>';
    btnExcluir.title = 'Excluir item';
    btnExcluir.addEventListener('click', (e) => {
        e.stopPropagation(); // Impedir que o clique no item seja acionado
        excluirItem(categoria, index);
    });

    itemDiv.appendChild(dragHandle);
    itemDiv.appendChild(checkbox);
    itemDiv.appendChild(info);
    itemDiv.appendChild(btnExcluir);
    
    // Event listeners para drag and drop - versão melhorada e robusta
    dragHandle.addEventListener('dragstart', (e) => {
        e.stopPropagation(); // Evitar conflito com drag de categoria
        
        // Obter categoriaBody no momento do drag (já está no DOM)
        const categoriaBody = itemDiv.closest('.categoria-body');
        
        // Armazenar informações do item sendo arrastado
        itemDiv.classList.add('dragging');
        itemDiv._isDragging = true;
        itemDiv._originalCategoria = categoria;
        itemDiv._originalCategoriaBody = categoriaBody;
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', itemId || '');
        e.dataTransfer.setData('application/item-categoria', categoria);
        
        // Resetar estado do drag
        dragState.lastDragOverElement = null;
        dragState.lastDragOverPosition = null;
        dragState.draggingItem = itemDiv;
        
        // Garantir que o item sempre fique visível dentro da categoria
        if (categoriaBody) {
            categoriaBody.classList.add('dragging-active');
        }
    });
    
    dragHandle.addEventListener('dragend', (e) => {
        const dragging = dragState.draggingItem || document.querySelector('.item.dragging');
        
        if (dragging) {
            dragging.classList.remove('dragging');
            dragging._isDragging = false;
            
            // Garantir que o item está dentro do categoriaBody correto
            const originalBody = dragging._originalCategoriaBody;
            if (originalBody && !originalBody.contains(dragging)) {
                // Se o item saiu da categoria, colocá-lo de volta no final
                originalBody.appendChild(dragging);
            }
            
            // Remover classe do body
            if (originalBody) {
                originalBody.classList.remove('dragging-active');
            }
        }
        
        // Resetar estado do drag
        dragState.lastDragOverElement = null;
        dragState.lastDragOverPosition = null;
        dragState.draggingItem = null;
        
        // Limpar todas as classes de drag-over
        document.querySelectorAll('.item').forEach(item => {
            item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
        });
        
        // Limpar classe de dragging-active de todos os bodies
        document.querySelectorAll('.categoria-body').forEach(body => {
            body.classList.remove('dragging-active');
        });
        
        // Salvar ordem após o drag
        if (dragging && dragging._originalCategoria) {
            salvarOrdemItens(dragging._originalCategoria);
        }
    });
    
    // Permitir drop no item - versão melhorada e robusta
    itemDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        
        const dragging = dragState.draggingItem || document.querySelector('.item.dragging');
        if (!dragging || dragging === itemDiv || !dragging._isDragging) return;
        
        // Verificar se é da mesma categoria
        const draggingCategoria = dragging._originalCategoria || dragging.dataset.categoria;
        if (draggingCategoria !== categoria) return;
        
        // Obter categoriaBody no momento do dragover
        const categoriaBody = itemDiv.closest('.categoria-body');
        if (!categoriaBody) return;
        
        // Garantir que o item arrastado está dentro do categoriaBody
        if (!categoriaBody.contains(dragging)) {
            categoriaBody.appendChild(dragging);
        }
        
        // Calcular a posição relativa ao item atual
        const rect = itemDiv.getBoundingClientRect();
        const y = e.clientY;
        const midpoint = rect.top + rect.height / 2;
        const position = y < midpoint ? 'top' : 'bottom';
        
        // Só mover se mudou de elemento ou de posição
        if (dragState.lastDragOverElement === itemDiv && dragState.lastDragOverPosition === position) {
            return; // Já está na posição correta
        }
        
        dragState.lastDragOverElement = itemDiv;
        dragState.lastDragOverPosition = position;
        
        // Remover classes de drag-over de todos os itens nesta categoria
        categoriaBody.querySelectorAll('.item').forEach(item => {
            if (item !== dragging) {
                item.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
            }
        });
        
        // Adicionar classe visual apropriada
        itemDiv.classList.add('drag-over', position === 'top' ? 'drag-over-top' : 'drag-over-bottom');
        
        // Mover o item arrastado para a posição correta
        // Usar requestAnimationFrame para suavizar a animação
        requestAnimationFrame(() => {
            // Verificar novamente se o dragging ainda é válido
            if (!dragging._isDragging || !categoriaBody.contains(dragging)) {
                return;
            }
            
            // Obter todos os itens na ordem atual
            const todosItens = Array.from(categoriaBody.querySelectorAll('.item'));
            const indexDragging = todosItens.indexOf(dragging);
            const indexTarget = todosItens.indexOf(itemDiv);
            
            // Se já está na posição correta, não fazer nada
            if (indexDragging === indexTarget) return;
            
            // Quando você solta sobre um item, o item arrastado deve tomar o lugar desse item
            // Precisamos verificar a posição relativa para decidir se inserir antes ou depois
            if (dragging !== itemDiv) {
                if (indexDragging < indexTarget) {
                    // Item arrastado está ANTES do item alvo (arrastando para baixo)
                    // Para tomar o lugar do item alvo, precisamos inserir DEPOIS dele
                    const nextSibling = itemDiv.nextSibling;
                    if (nextSibling && nextSibling !== dragging) {
                        categoriaBody.insertBefore(dragging, nextSibling);
                    } else if (!nextSibling) {
                        // Se não há próximo irmão, adicionar no final
                        categoriaBody.appendChild(dragging);
                    }
                } else {
                    // Item arrastado está DEPOIS do item alvo (arrastando para cima)
                    // Para tomar o lugar do item alvo, precisamos inserir ANTES dele
                    categoriaBody.insertBefore(dragging, itemDiv);
                }
            }
        });
    });
    
    itemDiv.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dragging = dragState.draggingItem || document.querySelector('.item.dragging');
        if (dragging && dragging !== itemDiv) {
            const draggingCategoria = dragging._originalCategoria || dragging.dataset.categoria;
            const categoriaBody = itemDiv.closest('.categoria-body');
            if (draggingCategoria === categoria && categoriaBody) {
                categoriaBody.classList.add('dragging-active');
            }
        }
    });
    
    itemDiv.addEventListener('dragleave', (e) => {
        // Só remover se realmente saiu do item (não apenas passou para um filho)
        const relatedTarget = e.relatedTarget;
        if (!itemDiv.contains(relatedTarget) && !itemDiv.isSameNode(relatedTarget)) {
            itemDiv.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
            if (dragState.lastDragOverElement === itemDiv) {
                dragState.lastDragOverElement = null;
                dragState.lastDragOverPosition = null;
            }
        }
    });
    
    itemDiv.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const dragging = dragState.draggingItem || document.querySelector('.item.dragging');
        if (dragging && dragging._isDragging) {
            // Garantir que o item está na posição correta
            const categoriaBody = itemDiv.closest('.categoria-body');
            if (categoriaBody && categoriaBody.contains(dragging)) {
                // O item já foi posicionado pelo dragover, apenas limpar classes
                itemDiv.classList.remove('drag-over', 'drag-over-top', 'drag-over-bottom');
            }
        }
    });

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
                
                // Atualizar preços das plataformas
                atualizarPrecosItemPlataformas(itemDiv, item);
                
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
    
    // Adicionar preços das plataformas após o item estar completo
    setTimeout(() => {
        atualizarPrecosItemPlataformas(itemDiv, item);
    }, 0);

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

// Função auxiliar para drag and drop de categorias
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

// Função auxiliar para drag and drop de itens (mantida para compatibilidade, mas não mais usada)
function getDragAfterItem(container, y) {
    const draggableElements = [...container.querySelectorAll('.item:not(.dragging)')];
    
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

// Salvar ordem dos itens dentro de uma categoria
async function salvarOrdemItens(categoria) {
    const categoriaBody = document.querySelector(`#categoria-${categoria}`);
    if (!categoriaBody) {
        console.error('Corpo da categoria não encontrado!');
        return;
    }
    
    // Obter todos os itens na ordem atual (incluindo o que estava sendo arrastado)
    const itens = Array.from(categoriaBody.querySelectorAll('.item'));
    const itensIds = itens
        .map(item => {
            const itemId = item.dataset.itemId;
            return itemId ? parseInt(itemId) : null;
        })
        .filter(id => id !== null);
    
    if (itensIds.length === 0) {
        console.warn('Nenhum item encontrado para salvar');
        return;
    }
    
    console.log(`=== SALVANDO ORDEM DOS ITENS DA CATEGORIA: ${categoria} ===`);
    console.log('IDs dos itens na ordem:', itensIds);
    console.log('Quantidade de itens:', itensIds.length);
    
    try {
        const response = await fetch(`${API_BASE}/api/itens/categoria/${encodeURIComponent(categoria)}/ordem`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ itensIds })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Erro ao salvar ordem dos itens');
        }
        
        const result = await response.json();
        console.log('✓ Ordem dos itens salva com sucesso!');
        console.log('Resposta do servidor:', result);
        
        // Atualizar os índices locais sem recarregar tudo
        atualizarIndicesLocaisAposDrag(categoria);
    } catch (error) {
        console.error('✗ ERRO ao salvar ordem dos itens:', error);
    }
}

// Atualizar índices locais após reordenar (sem recarregar tudo)
function atualizarIndicesLocaisAposDrag(categoria) {
    const categoriaBody = document.querySelector(`#categoria-${categoria}`);
    if (!categoriaBody) return;
    
    const itens = Array.from(categoriaBody.querySelectorAll('.item'));
    
    // Atualizar os índices e IDs locais baseado na nova ordem
    itens.forEach((itemDiv, novoIndex) => {
        const itemId = itemDiv.dataset.itemId;
        if (!itemId) return;
        
        // Atualizar o índice no dataset
        itemDiv.dataset.index = novoIndex;
        
        // Atualizar o ID do checkbox
        const checkbox = itemDiv.querySelector('input[type="checkbox"]');
        if (checkbox) {
            checkbox.id = `item-${categoria}-${novoIndex}`;
        }
        
        // Atualizar o mapa de IDs
        const key = `${categoria}-${novoIndex}`;
        itensIds[key] = parseInt(itemId);
        
        // Atualizar o item selecionado se estava selecionado
        // Procurar pela chave antiga que apontava para este itemId
        const oldKeys = Array.from(itensSelecionados).filter(k => {
            const [cat, idx] = k.split('-');
            const oldId = itensIds[k];
            return cat === categoria && oldId === parseInt(itemId);
        });
        
        // Remover as chaves antigas e adicionar a nova
        oldKeys.forEach(oldKey => {
            itensSelecionados.delete(oldKey);
        });
        
        // Verificar se o item estava selecionado antes (pela presença de oldKeys)
        if (oldKeys.length > 0 || checkbox.checked) {
            itensSelecionados.add(key);
            if (checkbox) {
                checkbox.checked = true;
            }
        }
    });
    
    // Atualizar checkbox da categoria
    const categoriaDiv = document.querySelector(`.categoria[data-categoria="${categoria}"]`);
    if (categoriaDiv && categoriaDiv._atualizarCheckbox) {
        categoriaDiv._atualizarCheckbox();
    }
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
    
    // Botão painel admin
    document.getElementById('btn-painel-admin').addEventListener('click', abrirPainelAdmin);
    
    // Botão gerenciar plataformas
    document.getElementById('btn-gerenciar-plataformas').addEventListener('click', abrirGerenciarPlataformas);

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
            
            // Atualizar preços das plataformas
            atualizarPrecosItemPlataformas(itemElement, item);
            
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

// ========== PAINEL ADMINISTRATIVO ==========

// Carregar configurações salvas
function carregarConfiguracoesAdmin() {
    const config = {
        logo: localStorage.getItem('admin-logo') || 'logo.png',
        corPrimaria: localStorage.getItem('admin-cor-primaria') || '#FF6B35',
        corSecundaria: localStorage.getItem('admin-cor-secundaria') || '#2a2a2a',
        corFundo: localStorage.getItem('admin-cor-fundo') || '#1a1a1a'
    };
    return config;
}

// Aplicar configurações ao sistema
function aplicarConfiguracoesAdmin() {
    const config = carregarConfiguracoesAdmin();
    
    // Aplicar logo
    const logoImg = document.querySelector('.logo');
    if (logoImg && config.logo && config.logo !== 'logo.png') {
        logoImg.src = config.logo;
    }
    
    // Aplicar cores usando CSS variables
    document.documentElement.style.setProperty('--cor-primaria', config.corPrimaria);
    document.documentElement.style.setProperty('--cor-secundaria', config.corSecundaria);
    document.documentElement.style.setProperty('--cor-fundo', config.corFundo);
    
    // Aplicar cores diretamente nos elementos principais
    const corPrimaria = config.corPrimaria;
    const corSecundaria = config.corSecundaria;
    const corFundo = config.corFundo;
    
    // Header
    const header = document.querySelector('header');
    if (header) {
        header.style.background = corPrimaria;
    }
    
    // Botões primários
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.style.background = corPrimaria;
    });
    
    // Botões secundários
    document.querySelectorAll('.btn-secondary').forEach(btn => {
        btn.style.background = corSecundaria;
    });
    
    // Categoria header
    document.querySelectorAll('.categoria-header').forEach(header => {
        header.style.background = corPrimaria;
    });
    
    // Body background
    document.body.style.background = corFundo;
    
    // Botões de adicionar produto
    document.querySelectorAll('.btn-adicionar-produto').forEach(btn => {
        if (!btn.id || btn.id !== 'btn-painel-admin') {
            btn.style.background = corPrimaria;
        }
    });
    
    // Modal headers
    document.querySelectorAll('.modal-header').forEach(header => {
        header.style.background = corPrimaria;
    });
}

// Variável para controlar se os listeners já foram adicionados
let adminListenersInicializados = false;

// Abrir painel admin
function abrirPainelAdmin() {
    const modal = document.getElementById('modal-painel-admin');
    const config = carregarConfiguracoesAdmin();
    
    // Carregar valores atuais
    document.getElementById('admin-cor-primaria').value = config.corPrimaria;
    document.getElementById('admin-cor-primaria-text').value = config.corPrimaria;
    document.getElementById('admin-cor-secundaria').value = config.corSecundaria;
    document.getElementById('admin-cor-secundaria-text').value = config.corSecundaria;
    document.getElementById('admin-cor-fundo').value = config.corFundo;
    document.getElementById('admin-cor-fundo-text').value = config.corFundo;
    
    // Atualizar preview
    atualizarPreviewCores();
    atualizarPreviewLogo();
    
    // Inicializar listeners apenas uma vez
    if (!adminListenersInicializados) {
        const corPrimariaInput = document.getElementById('admin-cor-primaria');
        const corPrimariaText = document.getElementById('admin-cor-primaria-text');
        const corSecundariaInput = document.getElementById('admin-cor-secundaria');
        const corSecundariaText = document.getElementById('admin-cor-secundaria-text');
        const corFundoInput = document.getElementById('admin-cor-fundo');
        const corFundoText = document.getElementById('admin-cor-fundo-text');
        const logoUpload = document.getElementById('admin-logo-upload');
        const btnRemoverLogo = document.getElementById('btn-remover-logo');
        const btnSalvar = document.getElementById('btn-admin-salvar');
        const btnCancel = document.getElementById('btn-admin-cancel');
        const btnResetar = document.getElementById('btn-admin-resetar');
        
        // Event listeners para color pickers
        corPrimariaInput.addEventListener('input', (e) => {
            corPrimariaText.value = e.target.value;
            atualizarPreviewCores();
        });
        
        corPrimariaText.addEventListener('input', (e) => {
            const valor = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(valor)) {
                corPrimariaInput.value = valor;
                atualizarPreviewCores();
            }
        });
        
        corSecundariaInput.addEventListener('input', (e) => {
            corSecundariaText.value = e.target.value;
            atualizarPreviewCores();
        });
        
        corSecundariaText.addEventListener('input', (e) => {
            const valor = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(valor)) {
                corSecundariaInput.value = valor;
                atualizarPreviewCores();
            }
        });
        
        corFundoInput.addEventListener('input', (e) => {
            corFundoText.value = e.target.value;
            atualizarPreviewCores();
        });
        
        corFundoText.addEventListener('input', (e) => {
            const valor = e.target.value;
            if (/^#[0-9A-F]{6}$/i.test(valor)) {
                corFundoInput.value = valor;
                atualizarPreviewCores();
            }
        });
        
        // Upload de logo
        logoUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const logoUrl = event.target.result;
                    document.getElementById('logo-preview-img').src = logoUrl;
                    localStorage.setItem('admin-logo', logoUrl);
                };
                reader.readAsDataURL(file);
            }
        });
        
        // Remover logo
        btnRemoverLogo.addEventListener('click', () => {
            localStorage.removeItem('admin-logo');
            document.getElementById('logo-preview-img').src = 'logo.png';
            logoUpload.value = '';
        });
        
        // Salvar
        btnSalvar.addEventListener('click', async () => {
            salvarConfiguracoesAdmin();
            modal.classList.remove('show');
            aplicarConfiguracoesAdmin();
            await mostrarAlert('Sucesso', 'Configurações salvas com sucesso!');
        });
        
        // Cancelar
        btnCancel.addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        // Resetar
        btnResetar.addEventListener('click', async () => {
            const confirmado = await mostrarConfirm('Resetar Configurações', 'Tem certeza que deseja resetar todas as configurações para os valores padrão?');
            if (confirmado) {
                resetarConfiguracoesAdmin();
                modal.classList.remove('show');
                aplicarConfiguracoesAdmin();
                await mostrarAlert('Sucesso', 'Configurações resetadas para os valores padrão!');
            }
        });
        
        // Fechar modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.classList.remove('show');
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        });
        
        adminListenersInicializados = true;
    }
    
    modal.classList.add('show');
}

// Atualizar preview das cores
function atualizarPreviewCores() {
    const corPrimariaEl = document.getElementById('admin-cor-primaria');
    const corSecundariaEl = document.getElementById('admin-cor-secundaria');
    const corFundoEl = document.getElementById('admin-cor-fundo');
    
    if (!corPrimariaEl || !corSecundariaEl || !corFundoEl) return;
    
    const corPrimaria = corPrimariaEl.value;
    const corSecundaria = corSecundariaEl.value;
    const corFundo = corFundoEl.value;
    
    const previewPrimaria = document.getElementById('preview-primaria');
    const previewSecundaria = document.getElementById('preview-secundaria');
    const previewFundo = document.getElementById('preview-fundo');
    
    if (previewPrimaria) previewPrimaria.style.background = corPrimaria;
    if (previewSecundaria) previewSecundaria.style.background = corSecundaria;
    if (previewFundo) previewFundo.style.background = corFundo;
}

// Atualizar preview da logo
function atualizarPreviewLogo() {
    const config = carregarConfiguracoesAdmin();
    const logoImg = document.getElementById('logo-preview-img');
    if (config.logo && config.logo !== 'logo.png') {
        logoImg.src = config.logo;
    } else {
        logoImg.src = 'logo.png';
    }
}

// Salvar configurações
function salvarConfiguracoesAdmin() {
    const corPrimariaEl = document.getElementById('admin-cor-primaria');
    const corSecundariaEl = document.getElementById('admin-cor-secundaria');
    const corFundoEl = document.getElementById('admin-cor-fundo');
    
    if (!corPrimariaEl || !corSecundariaEl || !corFundoEl) return;
    
    const corPrimaria = corPrimariaEl.value;
    const corSecundaria = corSecundariaEl.value;
    const corFundo = corFundoEl.value;
    const logo = localStorage.getItem('admin-logo') || 'logo.png';
    
    localStorage.setItem('admin-cor-primaria', corPrimaria);
    localStorage.setItem('admin-cor-secundaria', corSecundaria);
    localStorage.setItem('admin-cor-fundo', corFundo);
    if (logo !== 'logo.png') {
        localStorage.setItem('admin-logo', logo);
    }
}

// Resetar configurações
function resetarConfiguracoesAdmin() {
    localStorage.removeItem('admin-cor-primaria');
    localStorage.removeItem('admin-cor-secundaria');
    localStorage.removeItem('admin-cor-fundo');
    localStorage.removeItem('admin-logo');
}

// ========== GERENCIAMENTO DE PLATAFORMAS ==========

// Carregar plataformas do localStorage
function carregarPlataformas() {
    const plataformasSalvas = localStorage.getItem('plataformas');
    if (plataformasSalvas) {
        plataformas = JSON.parse(plataformasSalvas);
    } else {
        plataformas = [];
    }
}

// Salvar plataformas no localStorage
function salvarPlataformas() {
    localStorage.setItem('plataformas', JSON.stringify(plataformas));
}

// Calcular taxa baseada em vendas e cobrança
function calcularTaxa(vendas, cobranca) {
    if (!vendas || vendas === 0) return 0;
    return (cobranca / vendas) * 100;
}

// Calcular preço com taxa da plataforma
function calcularPrecoPlataforma(precoBase, taxaPercentual) {
    return precoBase * (1 + taxaPercentual / 100);
}

// Abrir modal de gerenciar plataformas
function abrirGerenciarPlataformas() {
    const modal = document.getElementById('modal-plataformas');
    atualizarListaPlataformas();
    
    // Botão adicionar plataforma
    document.getElementById('btn-adicionar-plataforma').onclick = () => {
        modal.classList.remove('show');
        abrirFormPlataforma();
    };
    
    // Botão fechar
    document.getElementById('btn-plataformas-fechar').onclick = () => {
        modal.classList.remove('show');
    };
    
    modal.querySelector('.close-modal').onclick = () => {
        modal.classList.remove('show');
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    };
    
    modal.classList.add('show');
}

// Atualizar lista de plataformas
function atualizarListaPlataformas() {
    const container = document.getElementById('plataformas-lista');
    container.innerHTML = '';
    
    if (plataformas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">Nenhuma plataforma cadastrada. Clique em "Adicionar Plataforma" para começar.</p>';
        return;
    }
    
    plataformas.forEach((plataforma, index) => {
        const item = document.createElement('div');
        item.className = 'plataforma-item';
        
        const info = document.createElement('div');
        info.className = 'plataforma-info';
        info.innerHTML = `
            <div class="plataforma-nome">${plataforma.nome}</div>
            <div class="plataforma-taxa">Taxa: ${plataforma.taxa.toFixed(2)}%</div>
        `;
        
        const actions = document.createElement('div');
        actions.className = 'plataforma-actions';
        
        const btnEditar = document.createElement('button');
        btnEditar.className = 'btn-editar-plataforma';
        btnEditar.innerHTML = '<i class="fas fa-edit"></i> Editar';
        btnEditar.onclick = () => {
            document.getElementById('modal-plataformas').classList.remove('show');
            abrirFormPlataforma(index);
        };
        
        const btnExcluir = document.createElement('button');
        btnExcluir.className = 'btn-excluir-plataforma';
        btnExcluir.innerHTML = '<i class="fas fa-trash"></i> Excluir';
        btnExcluir.onclick = async () => {
            const confirmado = await mostrarConfirm('Excluir Plataforma', `Tem certeza que deseja excluir a plataforma "${plataforma.nome}"?`);
            if (confirmado) {
                plataformas.splice(index, 1);
                salvarPlataformas();
                atualizarListaPlataformas();
                atualizarPrecosPlataformas(); // Atualizar preços dos itens
            }
        };
        
        actions.appendChild(btnEditar);
        actions.appendChild(btnExcluir);
        
        item.appendChild(info);
        item.appendChild(actions);
        container.appendChild(item);
    });
}

// Abrir formulário de plataforma
function abrirFormPlataforma(index = null) {
    const modal = document.getElementById('modal-plataforma-form');
    const titulo = document.getElementById('modal-plataforma-titulo');
    const nomeInput = document.getElementById('plataforma-nome');
    const vendasInput = document.getElementById('plataforma-vendas');
    const cobrancaInput = document.getElementById('plataforma-cobranca');
    const taxaInput = document.getElementById('plataforma-taxa');
    const grupoCalcular = document.getElementById('grupo-calcular-taxa');
    const grupoDireto = document.getElementById('grupo-taxa-direta');
    const campos1Mes = document.getElementById('campos-1-mes');
    const campos3Meses = document.getElementById('campos-3-meses');
    const taxaCalculada = document.getElementById('taxa-calculada');
    const taxaDetalhes = document.getElementById('taxa-detalhes');
    const metodoRadios = document.querySelectorAll('input[name="metodo-taxa"]');
    const periodoRadios = document.querySelectorAll('input[name="periodo-calculo"]');
    
    // Limpar campos
    nomeInput.value = '';
    vendasInput.value = '';
    cobrancaInput.value = '';
    taxaInput.value = '';
    taxaCalculada.textContent = '0%';
    taxaDetalhes.textContent = '';
    
    // Limpar campos de 3 meses
    for (let i = 1; i <= 3; i++) {
        document.getElementById(`plataforma-vendas-mes${i}`).value = '';
        document.getElementById(`plataforma-cobranca-mes${i}`).value = '';
    }
    
    // Se está editando, preencher valores
    if (index !== null && plataformas[index]) {
        const plataforma = plataformas[index];
        titulo.textContent = 'Editar Plataforma';
        nomeInput.value = plataforma.nome;
        taxaInput.value = plataforma.taxa;
        metodoRadios[1].checked = true; // Método direto
        grupoCalcular.style.display = 'none';
        grupoDireto.style.display = 'block';
    } else {
        titulo.textContent = 'Adicionar Plataforma';
        metodoRadios[0].checked = true; // Método calcular
        periodoRadios[0].checked = true; // 1 mês
        grupoCalcular.style.display = 'block';
        grupoDireto.style.display = 'none';
        campos1Mes.style.display = 'block';
        campos3Meses.style.display = 'none';
    }
    
    // Event listeners para método de cálculo
    metodoRadios.forEach(radio => {
        radio.onchange = () => {
            if (radio.value === 'calcular') {
                grupoCalcular.style.display = 'block';
                grupoDireto.style.display = 'none';
            } else {
                grupoCalcular.style.display = 'none';
                grupoDireto.style.display = 'block';
            }
        };
    });
    
    // Event listeners para período de cálculo
    periodoRadios.forEach(radio => {
        radio.onchange = () => {
            if (radio.value === '1') {
                campos1Mes.style.display = 'block';
                campos3Meses.style.display = 'none';
            } else {
                campos1Mes.style.display = 'none';
                campos3Meses.style.display = 'block';
            }
            atualizarTaxaCalculada();
        };
    });
    
    // Calcular taxa em tempo real - 1 mês
    vendasInput.addEventListener('input', atualizarTaxaCalculada);
    cobrancaInput.addEventListener('input', atualizarTaxaCalculada);
    
    // Calcular taxa em tempo real - 3 meses
    for (let i = 1; i <= 3; i++) {
        const vendasMes = document.getElementById(`plataforma-vendas-mes${i}`);
        const cobrancaMes = document.getElementById(`plataforma-cobranca-mes${i}`);
        vendasMes.addEventListener('input', atualizarTaxaCalculada);
        cobrancaMes.addEventListener('input', atualizarTaxaCalculada);
    }
    
    function atualizarTaxaCalculada() {
        const periodoSelecionado = document.querySelector('input[name="periodo-calculo"]:checked').value;
        let taxa = 0;
        let detalhes = '';
        
        if (periodoSelecionado === '1') {
            // Cálculo de 1 mês
            const vendas = parseFloat(vendasInput.value) || 0;
            const cobranca = parseFloat(cobrancaInput.value) || 0;
            if (vendas > 0) {
                taxa = calcularTaxa(vendas, cobranca);
            }
        } else {
            // Cálculo de 3 meses (média)
            const taxas = [];
            const detalhesMeses = [];
            
            for (let i = 1; i <= 3; i++) {
                const vendas = parseFloat(document.getElementById(`plataforma-vendas-mes${i}`).value) || 0;
                const cobranca = parseFloat(document.getElementById(`plataforma-cobranca-mes${i}`).value) || 0;
                
                if (vendas > 0) {
                    const taxaMes = calcularTaxa(vendas, cobranca);
                    taxas.push(taxaMes);
                    detalhesMeses.push(`Mês ${i}: ${taxaMes.toFixed(2)}%`);
                }
            }
            
            if (taxas.length > 0) {
                taxa = taxas.reduce((a, b) => a + b, 0) / taxas.length;
                detalhes = detalhesMeses.join(' | ') + ` | Média: ${taxa.toFixed(2)}%`;
            }
        }
        
        taxaCalculada.textContent = `${taxa.toFixed(2)}%`;
        taxaDetalhes.textContent = detalhes;
    }
    
    // Salvar
    document.getElementById('btn-plataforma-salvar').onclick = () => {
        const nome = nomeInput.value.trim();
        if (!nome) {
            mostrarAlert('Atenção', 'Por favor, informe o nome da plataforma.');
            return;
        }
        
        const metodoSelecionado = document.querySelector('input[name="metodo-taxa"]:checked').value;
        let taxa = 0;
        
        if (metodoSelecionado === 'calcular') {
            const periodoSelecionado = document.querySelector('input[name="periodo-calculo"]:checked').value;
            
            if (periodoSelecionado === '1') {
                // Cálculo de 1 mês
                const vendas = parseFloat(vendasInput.value) || 0;
                const cobranca = parseFloat(cobrancaInput.value) || 0;
                if (vendas === 0) {
                    mostrarAlert('Atenção', 'Por favor, informe o valor total vendido.');
                    return;
                }
                taxa = calcularTaxa(vendas, cobranca);
            } else {
                // Cálculo de 3 meses (média)
                const taxas = [];
                let temDados = false;
                
                for (let i = 1; i <= 3; i++) {
                    const vendas = parseFloat(document.getElementById(`plataforma-vendas-mes${i}`).value) || 0;
                    const cobranca = parseFloat(document.getElementById(`plataforma-cobranca-mes${i}`).value) || 0;
                    
                    if (vendas > 0) {
                        temDados = true;
                        const taxaMes = calcularTaxa(vendas, cobranca);
                        taxas.push(taxaMes);
                    }
                }
                
                if (!temDados || taxas.length === 0) {
                    mostrarAlert('Atenção', 'Por favor, informe os dados de pelo menos um mês.');
                    return;
                }
                
                taxa = taxas.reduce((a, b) => a + b, 0) / taxas.length;
            }
        } else {
            taxa = parseFloat(taxaInput.value) || 0;
            if (taxa === 0) {
                mostrarAlert('Atenção', 'Por favor, informe a taxa da plataforma.');
                return;
            }
        }
        
        if (index !== null) {
            // Editar
            plataformas[index] = { nome, taxa };
        } else {
            // Adicionar
            plataformas.push({ nome, taxa });
        }
        
        salvarPlataformas();
        modal.classList.remove('show');
        atualizarPrecosPlataformas(); // Atualizar preços dos itens
        mostrarAlert('Sucesso', `Plataforma "${nome}" ${index !== null ? 'atualizada' : 'adicionada'} com sucesso!`);
    };
    
    // Cancelar
    document.getElementById('btn-plataforma-cancel').onclick = () => {
        modal.classList.remove('show');
    };
    
    modal.querySelector('.close-modal').onclick = () => {
        modal.classList.remove('show');
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    };
    
    modal.classList.add('show');
    nomeInput.focus();
}

// Atualizar preços das plataformas em todos os itens
function atualizarPrecosPlataformas() {
    document.querySelectorAll('.item').forEach(itemDiv => {
        const categoria = itemDiv.dataset.categoria;
        const index = parseInt(itemDiv.dataset.index);
        const item = itensPorCategoria[categoria] && itensPorCategoria[categoria][index];
        
        if (item) {
            atualizarPrecosItemPlataformas(itemDiv, item);
        }
    });
}

// Atualizar preços das plataformas em um item específico
function atualizarPrecosItemPlataformas(itemDiv, item) {
    // Remover seção de preços de plataformas existente
    const plataformasSection = itemDiv.querySelector('.item-precos-plataformas');
    if (plataformasSection) {
        plataformasSection.remove();
    }
    
    // Se não há plataformas, não mostrar nada
    if (plataformas.length === 0) {
        return;
    }
    
    // Obter o valor atual do input (pode ter sido editado)
    const valorAntigoInput = itemDiv.querySelector('.item-valor-antigo');
    const precoBase = valorAntigoInput ? parseFloat(valorAntigoInput.value) : (item.valor || 0);
    
    if (isNaN(precoBase) || precoBase <= 0) {
        return;
    }
    
    // Criar seção de preços das plataformas
    const plataformasDiv = document.createElement('div');
    plataformasDiv.className = 'item-precos-plataformas';
    
    plataformas.forEach(plataforma => {
        const precoPlataforma = calcularPrecoPlataforma(precoBase, plataforma.taxa);
        const precoDiv = document.createElement('div');
        precoDiv.className = 'item-preco-plataforma';
        precoDiv.innerHTML = `
            <label>${plataforma.nome}:</label>
            <span class="preco-plataforma-valor">R$ ${precoPlataforma.toFixed(2)}</span>
        `;
        plataformasDiv.appendChild(precoDiv);
    });
    
    // Adicionar após os valores existentes
    const valoresDiv = itemDiv.querySelector('.item-valores');
    if (valoresDiv) {
        valoresDiv.appendChild(plataformasDiv);
    }
}

