const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'database.sqlite');

// Dados padrão
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

let db = null;

// Inicializar banco de dados
function inicializar() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Erro ao conectar ao banco de dados:', err);
                reject(err);
                return;
            }
            
            console.log('Conectado ao banco de dados SQLite');
            
            // Criar tabela se não existir
            db.run(`
                CREATE TABLE IF NOT EXISTS itens (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    categoria TEXT NOT NULL,
                    nome TEXT NOT NULL,
                    valor REAL NOT NULL,
                    valor_novo REAL,
                    valor_backup REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(categoria, nome)
                )
            `, (err) => {
                if (err) {
                    console.error('Erro ao criar tabela:', err);
                    reject(err);
                    return;
                }
                
                // Adicionar coluna valor_backup se não existir (para bancos já criados)
                db.run(`
                    ALTER TABLE itens ADD COLUMN valor_backup REAL
                `, (err) => {
                    // Ignorar erro se a coluna já existir
                    if (err && !err.message.includes('duplicate column name')) {
                        console.error('Erro ao adicionar coluna valor_backup:', err);
                    }
                });
                
                // Criar tabela de categorias para gerenciar ordem
                db.run(`
                    CREATE TABLE IF NOT EXISTS categorias (
                        nome TEXT PRIMARY KEY,
                        ordem INTEGER NOT NULL,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                `, (err) => {
                    if (err) {
                        console.error('Erro ao criar tabela categorias:', err);
                    }
                });
                
                // Verificar se há dados
                db.get('SELECT COUNT(*) as count FROM itens', (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    // Se não houver dados, inserir dados padrão
                    if (row.count === 0) {
                        inserirDadosPadrao().then(() => {
                            console.log('Dados padrão inseridos');
                            inicializarOrdemCategorias().then(() => {
                                resolve();
                            }).catch(reject);
                        }).catch(reject);
                    } else {
                        // Inicializar ordem de categorias se necessário
                        inicializarOrdemCategorias().then(() => {
                            resolve();
                        }).catch(reject);
                    }
                });
            });
        });
    });
}

// Inserir dados padrão
function inserirDadosPadrao() {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO itens (categoria, nome, valor, valor_backup) VALUES (?, ?, ?, ?)');
        
        let inseridos = 0;
        let total = 0;
        
        Object.keys(dadosPadrao).forEach(categoria => {
            dadosPadrao[categoria].forEach(item => {
                total++;
                // valor_backup inicia com o mesmo valor
                stmt.run([categoria, item.nome, item.valor, item.valor], (err) => {
                    if (err) {
                        console.error('Erro ao inserir item:', err);
                    }
                    inseridos++;
                    if (inseridos === total) {
                        stmt.finalize();
                        resolve();
                    }
                });
            });
        });
    });
}

// Inicializar ordem das categorias
function inicializarOrdemCategorias() {
    return new Promise((resolve, reject) => {
        // Obter todas as categorias únicas dos itens
        db.all('SELECT DISTINCT categoria FROM itens', (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Verificar quais categorias já têm ordem definida
            db.all('SELECT nome FROM categorias', (err, categoriasExistentes) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                const nomesExistentes = new Set(categoriasExistentes.map(c => c.nome));
                const categoriasParaInserir = rows
                    .map(row => row.categoria)
                    .filter(cat => !nomesExistentes.has(cat));
                
                if (categoriasParaInserir.length === 0) {
                    resolve();
                    return;
                }
                
                // Obter a maior ordem atual
                db.get('SELECT MAX(ordem) as maxOrdem FROM categorias', (err, result) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    let ordemInicial = (result && result.maxOrdem !== null) ? result.maxOrdem + 1 : 0;
                    const stmt = db.prepare('INSERT INTO categorias (nome, ordem) VALUES (?, ?)');
                    
                    let inseridas = 0;
                    categoriasParaInserir.forEach((categoria, index) => {
                        stmt.run([categoria, ordemInicial + index], (err) => {
                            if (err) {
                                console.error('Erro ao inserir categoria:', err);
                            }
                            inseridas++;
                            if (inseridas === categoriasParaInserir.length) {
                                stmt.finalize();
                                resolve();
                            }
                        });
                    });
                });
            });
        });
    });
}

// Obter todos os itens organizados por categoria (na ordem salva)
function obterTodosItens() {
    return new Promise((resolve, reject) => {
        // Primeiro obter a ordem das categorias (ordenar por ordem, depois por nome se ordem for NULL)
        db.all('SELECT nome, ordem FROM categorias ORDER BY CASE WHEN ordem IS NULL THEN 1 ELSE 0 END, ordem, nome', (err, categoriasOrdenadas) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Criar mapa de ordem (usar a ordem salva, não o índice)
            const ordemMap = {};
            categoriasOrdenadas.forEach((cat) => {
                ordemMap[cat.nome] = cat.ordem !== null && cat.ordem !== undefined ? cat.ordem : 999;
            });
            
            console.log('Ordem das categorias carregada:', ordemMap);
            
            // Obter todos os itens
            db.all('SELECT * FROM itens ORDER BY categoria, nome', (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Organizar por categoria e atualizar valor_backup se necessário
                const itensPorCategoria = {};
                const promessasAtualizacao = [];
                
                rows.forEach(row => {
                    if (!itensPorCategoria[row.categoria]) {
                        itensPorCategoria[row.categoria] = [];
                    }
                    
                    // Se não houver valor_backup, criar com o valor atual
                    if (row.valor_backup === null || row.valor_backup === undefined) {
                        promessasAtualizacao.push(
                            new Promise((resolveUpdate) => {
                                db.run(
                                    'UPDATE itens SET valor_backup = ? WHERE id = ?',
                                    [row.valor, row.id],
                                    (err) => {
                                        if (err) {
                                            console.error(`Erro ao atualizar valor_backup do item ${row.id}:`, err);
                                        }
                                        resolveUpdate();
                                    }
                                );
                            })
                        );
                    }
                    
                    itensPorCategoria[row.categoria].push({
                        id: row.id,
                        nome: row.nome,
                        valor: row.valor,
                        valorNovo: row.valor_novo,
                        valorBackup: row.valor_backup !== null && row.valor_backup !== undefined ? row.valor_backup : row.valor
                    });
                });
                
                // Incluir categorias que não têm itens (categorias vazias)
                categoriasOrdenadas.forEach(cat => {
                    if (!itensPorCategoria[cat.nome]) {
                        itensPorCategoria[cat.nome] = [];
                    }
                });
                
                // Ordenar categorias pela ordem salva
                // Primeiro, incluir todas as categorias que têm ordem definida
                const todasCategorias = new Set([
                    ...Object.keys(itensPorCategoria),
                    ...categoriasOrdenadas.map(cat => cat.nome)
                ]);
                
                const categoriasOrdenadasArray = Array.from(todasCategorias).sort((a, b) => {
                    const ordemA = ordemMap[a] !== undefined ? ordemMap[a] : 999;
                    const ordemB = ordemMap[b] !== undefined ? ordemMap[b] : 999;
                    return ordemA - ordemB;
                });
                
                // Criar objeto ordenado
                const itensPorCategoriaOrdenado = {};
                categoriasOrdenadasArray.forEach(categoria => {
                    itensPorCategoriaOrdenado[categoria] = itensPorCategoria[categoria];
                });
                
                // Aguardar atualizações de backup (mas não bloquear a resposta)
                Promise.all(promessasAtualizacao).then(() => {
                    resolve(itensPorCategoriaOrdenado);
                }).catch(() => {
                    resolve(itensPorCategoriaOrdenado);
                });
            });
        });
    });
}

// Obter item por ID
function obterItemPorId(id) {
    return new Promise((resolve, reject) => {
        db.get('SELECT * FROM itens WHERE id = ?', [id], (err, row) => {
            if (err) {
                reject(err);
                return;
            }
            
            if (!row) {
                resolve(null);
                return;
            }
            
            resolve({
                id: row.id,
                nome: row.nome,
                valor: row.valor,
                valorNovo: row.valor_novo
            });
        });
    });
}

// Obter itens por categoria
function obterItensPorCategoria(categoria) {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM itens WHERE categoria = ? ORDER BY nome', [categoria], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            resolve(rows.map(row => ({
                id: row.id,
                nome: row.nome,
                valor: row.valor,
                valorNovo: row.valor_novo
            })));
        });
    });
}

// Criar novo item
function criarItem(categoria, nome, valor) {
    return new Promise((resolve, reject) => {
        db.run(
            'INSERT INTO itens (categoria, nome, valor, valor_backup) VALUES (?, ?, ?, ?)',
            [categoria, nome, valor, valor], // valor_backup inicia com o mesmo valor
            function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                // Retornar o item criado
                db.get('SELECT * FROM itens WHERE id = ?', [this.lastID], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    resolve({
                        id: row.id,
                        nome: row.nome,
                        valor: row.valor,
                        valorNovo: row.valor_novo
                    });
                });
            }
        );
    });
}

// Atualizar item
function atualizarItem(id, nome, valor) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE itens SET nome = ?, valor = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [nome, valor, id],
            function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                if (this.changes === 0) {
                    resolve(null);
                    return;
                }
                
                // Retornar o item atualizado
                db.get('SELECT * FROM itens WHERE id = ?', [id], (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    resolve({
                        id: row.id,
                        nome: row.nome,
                        valor: row.valor,
                        valorNovo: row.valor_novo
                    });
                });
            }
        );
    });
}

// Deletar item
function deletarItem(id) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM itens WHERE id = ?', [id], function(err) {
            if (err) {
                reject(err);
                return;
            }
            
            resolve(this.changes > 0);
        });
    });
}

// Obter categorias
function obterCategorias() {
    return new Promise((resolve, reject) => {
        db.all('SELECT DISTINCT categoria FROM itens ORDER BY categoria', (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            resolve(rows.map(row => row.categoria));
        });
    });
}

// Atualizar valor novo (preço ajustado)
function atualizarValorNovo(id, valorNovo) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE itens SET valor_novo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [valorNovo, id],
            function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                resolve(this.changes > 0);
            }
        );
    });
}

// Salvar backup do valor antes de aplicar reajuste fixo
function salvarBackupValor(id, valorBackup) {
    return new Promise((resolve, reject) => {
        db.run(
            'UPDATE itens SET valor_backup = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [valorBackup, id],
            function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                resolve(this.changes > 0);
            }
        );
    });
}

// Resetar valores (restaurar valor a partir do backup)
function resetarValores() {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE itens 
             SET valor = valor_backup, 
                 valor_novo = NULL, 
                 updated_at = CURRENT_TIMESTAMP 
             WHERE valor_backup IS NOT NULL`,
            [],
            function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                
                resolve(this.changes);
            }
        );
    });
}

// Atualizar ordem das categorias
function atualizarOrdemCategorias(categorias) {
    return new Promise((resolve, reject) => {
        if (categorias.length === 0) {
            resolve();
            return;
        }
        
        // Primeiro, garantir que todas as categorias existem na tabela
        const stmtInsert = db.prepare('INSERT OR IGNORE INTO categorias (nome, ordem) VALUES (?, ?)');
        const stmtUpdate = db.prepare('UPDATE categorias SET ordem = ?, updated_at = CURRENT_TIMESTAMP WHERE nome = ?');
        
        let processadas = 0;
        const total = categorias.length;
        
        categorias.forEach((categoria, index) => {
            // Primeiro tentar inserir (se não existir)
            stmtInsert.run([categoria, index], (err) => {
                if (err && !err.message.includes('UNIQUE constraint') && !err.message.includes('SQLITE_CONSTRAINT')) {
                    console.error(`Erro ao inserir categoria ${categoria}:`, err);
                }
                
                // Depois atualizar a ordem (sempre, mesmo se foi inserida agora)
                stmtUpdate.run([index, categoria], (err) => {
                    if (err) {
                        console.error(`Erro ao atualizar ordem da categoria ${categoria}:`, err);
                        reject(err);
                        return;
                    }
                    processadas++;
                    if (processadas === total) {
                        stmtInsert.finalize();
                        stmtUpdate.finalize();
                        console.log(`Ordem das categorias atualizada: ${categorias.join(', ')}`);
                        resolve();
                    }
                });
            });
        });
    });
}

// Criar nova categoria
function criarCategoria(nome) {
    return new Promise((resolve, reject) => {
        // Obter a maior ordem atual
        db.get('SELECT MAX(ordem) as maxOrdem FROM categorias', (err, result) => {
            if (err) {
                reject(err);
                return;
            }
            
            const novaOrdem = (result && result.maxOrdem !== null) ? result.maxOrdem + 1 : 0;
            
            db.run(
                'INSERT INTO categorias (nome, ordem) VALUES (?, ?)',
                [nome, novaOrdem],
                function(err) {
                    if (err) {
                        // Se já existir, apenas retornar sucesso
                        if (err.message.includes('UNIQUE constraint')) {
                            resolve({ nome, ordem: novaOrdem });
                        } else {
                            reject(err);
                        }
                        return;
                    }
                    
                    resolve({ nome, ordem: novaOrdem });
                }
            );
        });
    });
}

// Fechar conexão
function fechar() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('Conexão com banco de dados fechada');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

module.exports = {
    inicializar,
    obterTodosItens,
    obterItensPorCategoria,
    obterItemPorId,
    criarItem,
    atualizarItem,
    deletarItem,
    obterCategorias,
    atualizarValorNovo,
    salvarBackupValor,
    resetarValores,
    atualizarOrdemCategorias,
    criarCategoria,
    fechar
};

