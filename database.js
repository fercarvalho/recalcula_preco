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
                            resolve();
                        }).catch(reject);
                    } else {
                        resolve();
                    }
                });
            });
        });
    });
}

// Inserir dados padrão
function inserirDadosPadrao() {
    return new Promise((resolve, reject) => {
        const stmt = db.prepare('INSERT INTO itens (categoria, nome, valor) VALUES (?, ?, ?)');
        
        let inseridos = 0;
        let total = 0;
        
        Object.keys(dadosPadrao).forEach(categoria => {
            dadosPadrao[categoria].forEach(item => {
                total++;
                stmt.run([categoria, item.nome, item.valor], (err) => {
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

// Obter todos os itens organizados por categoria
function obterTodosItens() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM itens ORDER BY categoria, nome', (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            
            // Organizar por categoria e processar valores
            const itensPorCategoria = {};
            const promessasAtualizacao = [];
            
            rows.forEach(row => {
                if (!itensPorCategoria[row.categoria]) {
                    itensPorCategoria[row.categoria] = [];
                }
                
                // Se houver valor_novo, ele vira o valor (preço ajustado vira preço antigo)
                let valor = row.valor;
                let valorNovo = row.valor_novo;
                
                if (row.valor_novo !== null && row.valor_novo !== undefined) {
                    // O valor novo vira o valor antigo
                    valor = row.valor_novo;
                    valorNovo = null;
                    
                    // Atualizar no banco (assíncrono, não bloqueia a resposta)
                    promessasAtualizacao.push(
                        new Promise((resolveUpdate, rejectUpdate) => {
                            db.run(
                                'UPDATE itens SET valor = ?, valor_novo = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                                [row.valor_novo, row.id],
                                (err) => {
                                    if (err) {
                                        console.error(`Erro ao atualizar item ${row.id}:`, err);
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
                    valor: valor,
                    valorNovo: valorNovo
                });
            });
            
            // Aguardar todas as atualizações (mas não bloquear a resposta)
            Promise.all(promessasAtualizacao).then(() => {
                resolve(itensPorCategoria);
            }).catch(() => {
                // Mesmo com erro, retornar os dados
                resolve(itensPorCategoria);
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
            'INSERT INTO itens (categoria, nome, valor) VALUES (?, ?, ?)',
            [categoria, nome, valor],
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
    fechar
};

