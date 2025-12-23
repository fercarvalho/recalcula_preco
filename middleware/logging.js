const db = require('../database');

// Classificar automaticamente o nível de detalhamento baseado na ação
function classificarNivelDetalhamento(acao, entidade) {
    // Ações críticas sempre mantidas permanentemente
    const acoesCriticas = [
        'criar_usuario',
        'deletar_usuario',
        'alterar_permissao',
        'alterar_admin_level',
        'alterar_plano',
        'criar_plano',
        'deletar_plano'
    ];

    // Ações importantes que devem ser detalhadas por 30 dias
    const acoesImportantes = [
        'criar',
        'editar',
        'deletar',
        'login',
        'logout',
        'alterar_senha',
        'alterar_email'
    ];

    const acaoCompleta = `${acao}_${entidade}`.toLowerCase();

    if (acoesCriticas.some(ac => acaoCompleta.includes(ac) || acao === ac)) {
        return 'critico';
    }

    if (acoesImportantes.some(ac => acao === ac)) {
        return 'detalhado';
    }

    return 'resumido';
}

// Middleware para registrar ações do usuário
async function logUserAction(req, res, next) {
    // Esta função será chamada após a ação ser executada
    // Não intercepta a requisição, apenas registra após sucesso
    return next();
}

// Função auxiliar para registrar ação (chamada manualmente após ações)
async function registrarAcao(dados) {
    try {
        const {
            usuarioId,
            acao,
            entidade,
            entidadeId,
            dadosAnteriores,
            dadosNovos,
            detalhes,
            req
        } = dados;

        // Obter IP e User Agent da requisição se disponível
        const ipAddress = req ? (
            req.headers['x-forwarded-for']?.split(',')[0] ||
            req.headers['x-real-ip'] ||
            req.connection?.remoteAddress ||
            req.socket?.remoteAddress ||
            'desconhecido'
        ) : null;

        const userAgent = req ? req.headers['user-agent'] : null;

        // Classificar nível de detalhamento
        const nivelDetalhamento = classificarNivelDetalhamento(acao, entidade);

        // Registrar no histórico
        await db.registrarAcaoHistorico({
            usuario_id: usuarioId,
            acao,
            entidade,
            entidade_id: entidadeId,
            dados_anteriores: dadosAnteriores,
            dados_novos: dadosNovos,
            detalhes,
            ip_address: ipAddress,
            user_agent: userAgent,
            nivel_detalhamento: nivelDetalhamento
        });
    } catch (error) {
        // Não falhar a requisição se o log falhar
        console.error('Erro ao registrar ação no histórico:', error);
    }
}

// Wrapper para rotas que registram ações automaticamente
function withLogging(handler, config = {}) {
    return async (req, res, next) => {
        try {
            // Executar handler original
            const originalJson = res.json.bind(res);
            let responseData = null;

            res.json = function(data) {
                responseData = data;
                return originalJson(data);
            };

            await handler(req, res, next);

            // Se a resposta foi bem-sucedida, registrar ação
            if (res.statusCode >= 200 && res.statusCode < 300 && responseData) {
                const usuarioId = req.userId || req.user?.id;
                
                if (usuarioId && config.acao) {
                    // Preparar dados para registro
                    const dadosAnteriores = config.getDadosAnteriores ? await config.getDadosAnteriores(req) : null;
                    const dadosNovos = config.getDadosNovos ? await config.getDadosNovos(req, responseData) : responseData;
                    const entidadeId = config.getEntidadeId ? await config.getEntidadeId(req, responseData) : req.params?.id || req.body?.id;

                    await registrarAcao({
                        usuarioId,
                        acao: config.acao,
                        entidade: config.entidade,
                        entidadeId,
                        dadosAnteriores,
                        dadosNovos,
                        detalhes: config.getDetalhes ? await config.getDetalhes(req, responseData) : null,
                        req
                    });
                }
            }
        } catch (error) {
            next(error);
        }
    };
}

module.exports = {
    logUserAction,
    registrarAcao,
    withLogging,
    classificarNivelDetalhamento
};

