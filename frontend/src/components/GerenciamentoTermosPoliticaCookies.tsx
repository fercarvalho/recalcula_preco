import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import { getToken } from '../services/auth';
import { FaEdit, FaTrash, FaPlus, FaSave, FaTimes, FaCookie } from 'react-icons/fa';
import './GerenciamentoTermosPoliticaCookies.css';

interface GerenciamentoTermosPoliticaCookiesProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CookieCategoria {
  id: number;
  chave: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  obrigatorio: boolean;
  ordem: number;
}

interface CookieBannerConfig {
  titulo: string;
  texto: string;
  texto_botao_aceitar: string;
  texto_botao_rejeitar: string;
  texto_botao_personalizar: string;
  texto_descricao_gerenciamento: string;
}

const GerenciamentoTermosPoliticaCookies = ({ isOpen, onClose }: GerenciamentoTermosPoliticaCookiesProps) => {
  const [abaAtiva, setAbaAtiva] = useState<'termos' | 'politica' | 'cookies'>('termos');
  const [termosConteudo, setTermosConteudo] = useState('');
  const [politicaConteudo, setPoliticaConteudo] = useState('');
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);
  
  // Estados para configuração do banner de cookies
  const [cookieConfig, setCookieConfig] = useState<CookieBannerConfig>({
    titulo: 'Política de Cookies',
    texto: '',
    texto_botao_aceitar: 'Aceitar Todos',
    texto_botao_rejeitar: 'Rejeitar Todos',
    texto_botao_personalizar: 'Personalizar',
    texto_descricao_gerenciamento: ''
  });
  
  // Estados para categorias de cookies
  const [categorias, setCategorias] = useState<CookieCategoria[]>([]);
  const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<CookieCategoria | null>(null);
  const [formCategoria, setFormCategoria] = useState({
    chave: '',
    nome: '',
    descricao: '',
    ativo: true,
    obrigatorio: false,
    ordem: 0
  });

  // Rastrear quais dados já foram carregados para evitar recarregamentos desnecessários
  const dadosCarregados = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      // Resetar dados carregados quando o modal é aberto
      dadosCarregados.current.clear();
      carregarDados();
    } else {
      // Limpar dados carregados quando o modal é fechado
      dadosCarregados.current.clear();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && !dadosCarregados.current.has(abaAtiva)) {
      carregarDados();
    }
  }, [isOpen, abaAtiva]);

  const carregarDados = async () => {
    // Evitar carregar dados já carregados
    if (dadosCarregados.current.has(abaAtiva)) {
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
        await mostrarAlert('Erro', 'Você precisa estar autenticado para acessar esta página.');
        onClose();
        return;
      }

      if (abaAtiva === 'termos') {
        const response = await fetch('/api/admin/termos-uso', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Se não houver conteúdo, deixar vazio para o usuário preencher
          setTermosConteudo(data?.conteudo ? String(data.conteudo) : '');
          dadosCarregados.current.add('termos');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Erro ao carregar termos de uso:', response.status, response.statusText, errorData);
        }
      } else if (abaAtiva === 'politica') {
        const response = await fetch('/api/admin/politica-privacidade', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Se não houver conteúdo, deixar vazio para o usuário preencher
          setPoliticaConteudo(data?.conteudo ? String(data.conteudo) : '');
          dadosCarregados.current.add('politica');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Erro ao carregar política de privacidade:', response.status, response.statusText, errorData);
        }
      } else if (abaAtiva === 'cookies') {
        // Carregar configuração do banner e categorias em paralelo
        const [configResponse, categoriasResponse] = await Promise.all([
          fetch('/api/admin/cookie-banner-config', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }),
          fetch('/api/admin/cookie-categorias', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        ]);

        if (configResponse.ok) {
          const configData = await configResponse.json();
          if (configData) {
            setCookieConfig(configData);
          }
        }
        
        if (categoriasResponse.ok) {
          const categoriasData = await categoriasResponse.json();
          setCategorias(categoriasData || []);
        }

        dadosCarregados.current.add('cookies');
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      await mostrarAlert('Erro', 'Erro ao carregar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const salvarTermos = async () => {
    setSalvando(true);
    try {
      const token = getToken();
      const response = await fetch('/api/admin/termos-uso', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conteudo: termosConteudo })
      });

      if (response.ok) {
        await mostrarAlert('Sucesso', 'Termos de uso atualizados com sucesso!');
      } else {
        const error = await response.json();
        await mostrarAlert('Erro', error.error || 'Erro ao salvar termos de uso.');
      }
    } catch (error) {
      console.error('Erro ao salvar termos:', error);
      await mostrarAlert('Erro', 'Erro ao salvar termos de uso. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const salvarPolitica = async () => {
    setSalvando(true);
    try {
      const token = getToken();
      const response = await fetch('/api/admin/politica-privacidade', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conteudo: politicaConteudo })
      });

      if (response.ok) {
        await mostrarAlert('Sucesso', 'Política de privacidade atualizada com sucesso!');
      } else {
        const error = await response.json();
        await mostrarAlert('Erro', error.error || 'Erro ao salvar política de privacidade.');
      }
    } catch (error) {
      console.error('Erro ao salvar política:', error);
      await mostrarAlert('Erro', 'Erro ao salvar política de privacidade. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const salvarCookieConfig = async () => {
    setSalvando(true);
    try {
      const token = getToken();
      const response = await fetch('/api/admin/cookie-banner-config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cookieConfig)
      });

      if (response.ok) {
        await mostrarAlert('Sucesso', 'Configuração do banner de cookies atualizada com sucesso!');
      } else {
        const error = await response.json();
        await mostrarAlert('Erro', error.error || 'Erro ao salvar configuração.');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      await mostrarAlert('Erro', 'Erro ao salvar configuração. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const salvarCategoria = async () => {
    if (!formCategoria.chave || !formCategoria.nome || !formCategoria.descricao) {
      await mostrarAlert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setSalvando(true);
    try {
      const token = getToken();
      const url = categoriaEditando 
        ? `/api/admin/cookie-categorias/${categoriaEditando.id}`
        : '/api/admin/cookie-categorias';
      const method = categoriaEditando ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formCategoria)
      });

      if (response.ok) {
        await mostrarAlert('Sucesso', categoriaEditando ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
        setMostrarFormCategoria(false);
        setCategoriaEditando(null);
        setFormCategoria({
          chave: '',
          nome: '',
          descricao: '',
          ativo: true,
          obrigatorio: false,
          ordem: 0
        });
        // Recarregar apenas categorias, não todos os dados
        dadosCarregados.current.delete('cookies');
        carregarDados();
      } else {
        const error = await response.json();
        await mostrarAlert('Erro', error.error || 'Erro ao salvar categoria.');
      }
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      await mostrarAlert('Erro', 'Erro ao salvar categoria. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const deletarCategoria = async (id: number) => {
    const confirmado = await mostrarConfirm(
      'Confirmar exclusão',
      'Tem certeza que deseja remover esta categoria? Esta ação não pode ser desfeita.'
    );
    
    if (!confirmado) return;

    setSalvando(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/admin/cookie-categorias/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await mostrarAlert('Sucesso', 'Categoria removida com sucesso!');
        // Recarregar apenas categorias, não todos os dados
        dadosCarregados.current.delete('cookies');
        carregarDados();
      } else {
        const error = await response.json();
        await mostrarAlert('Erro', error.error || 'Erro ao remover categoria.');
      }
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      await mostrarAlert('Erro', 'Erro ao remover categoria. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const editarCategoria = (categoria: CookieCategoria) => {
    setCategoriaEditando(categoria);
    setFormCategoria({
      chave: categoria.chave,
      nome: categoria.nome,
      descricao: categoria.descricao,
      ativo: categoria.ativo,
      obrigatorio: categoria.obrigatorio,
      ordem: categoria.ordem
    });
    setMostrarFormCategoria(true);
  };

  const cancelarFormCategoria = () => {
    setMostrarFormCategoria(false);
    setCategoriaEditando(null);
    setFormCategoria({
      chave: '',
      nome: '',
      descricao: '',
      ativo: true,
      obrigatorio: false,
      ordem: 0
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gerenciar Termos, Política e Cookies"
      size="large"
      className="modal-nested"
    >
      <div className="gerenciamento-termos-politica-cookies">
        <div className="abas">
          <button
            className={`aba ${abaAtiva === 'termos' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('termos')}
          >
            Termos de Uso
          </button>
          <button
            className={`aba ${abaAtiva === 'politica' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('politica')}
          >
            Política de Privacidade
          </button>
          <button
            className={`aba ${abaAtiva === 'cookies' ? 'ativa' : ''}`}
            onClick={() => setAbaAtiva('cookies')}
          >
            <FaCookie /> Cookies
          </button>
        </div>

        <div className={`conteudo-aba ${loading ? 'loading' : ''}`}>
          {loading && !dadosCarregados.current.has(abaAtiva) ? (
            <div className="loading">Carregando...</div>
          ) : (
            <>
            {abaAtiva === 'termos' && (
              <div className="editor-conteudo">
                <h3>Termos de Uso</h3>
                <textarea
                  value={termosConteudo}
                  onChange={(e) => setTermosConteudo(e.target.value)}
                  placeholder="Digite o conteúdo dos termos de uso aqui..."
                  className="editor-textarea"
                  rows={20}
                />
                <button
                  onClick={salvarTermos}
                  disabled={salvando}
                  className="btn-salvar"
                >
                  <FaSave /> {salvando ? 'Salvando...' : 'Salvar Termos de Uso'}
                </button>
              </div>
            )}

            {abaAtiva === 'politica' && (
              <div className="editor-conteudo">
                <h3>Política de Privacidade</h3>
                <textarea
                  value={politicaConteudo}
                  onChange={(e) => setPoliticaConteudo(e.target.value)}
                  placeholder="Digite o conteúdo da política de privacidade aqui..."
                  className="editor-textarea"
                  rows={20}
                />
                <button
                  onClick={salvarPolitica}
                  disabled={salvando}
                  className="btn-salvar"
                >
                  <FaSave /> {salvando ? 'Salvando...' : 'Salvar Política de Privacidade'}
                </button>
              </div>
            )}

            {abaAtiva === 'cookies' && (
              <div className="config-cookies">
                <div className="secao-banner">
                  <h3>Configuração do Banner de Cookies</h3>
                  <div className="form-group">
                    <label>Título do Banner</label>
                    <input
                      type="text"
                      value={cookieConfig.titulo}
                      onChange={(e) => setCookieConfig({ ...cookieConfig, titulo: e.target.value })}
                      placeholder="Política de Cookies"
                    />
                  </div>
                  <div className="form-group">
                    <label>Texto do Banner</label>
                    <textarea
                      value={cookieConfig.texto}
                      onChange={(e) => setCookieConfig({ ...cookieConfig, texto: e.target.value })}
                      placeholder="Utilizamos cookies para melhorar sua experiência..."
                      rows={4}
                    />
                  </div>
                  <div className="form-group">
                    <label>Texto do Botão "Aceitar Todos"</label>
                    <input
                      type="text"
                      value={cookieConfig.texto_botao_aceitar}
                      onChange={(e) => setCookieConfig({ ...cookieConfig, texto_botao_aceitar: e.target.value })}
                      placeholder="Aceitar Todos"
                    />
                  </div>
                  <div className="form-group">
                    <label>Texto do Botão "Rejeitar Todos"</label>
                    <input
                      type="text"
                      value={cookieConfig.texto_botao_rejeitar}
                      onChange={(e) => setCookieConfig({ ...cookieConfig, texto_botao_rejeitar: e.target.value })}
                      placeholder="Rejeitar Todos"
                    />
                  </div>
                  <div className="form-group">
                    <label>Texto do Botão "Personalizar"</label>
                    <input
                      type="text"
                      value={cookieConfig.texto_botao_personalizar}
                      onChange={(e) => setCookieConfig({ ...cookieConfig, texto_botao_personalizar: e.target.value })}
                      placeholder="Personalizar"
                    />
                  </div>
                  <div className="form-group">
                    <label>Descrição no Modal de Gerenciamento</label>
                    <textarea
                      value={cookieConfig.texto_descricao_gerenciamento}
                      onChange={(e) => setCookieConfig({ ...cookieConfig, texto_descricao_gerenciamento: e.target.value })}
                      placeholder="Escolha quais tipos de cookies você deseja aceitar..."
                      rows={3}
                    />
                  </div>
                  <button
                    onClick={salvarCookieConfig}
                    disabled={salvando}
                    className="btn-salvar"
                  >
                    <FaSave /> {salvando ? 'Salvando...' : 'Salvar Configuração do Banner'}
                  </button>
                </div>

                <div className="secao-categorias">
                  <div className="header-categorias">
                    <h3>Categorias de Cookies</h3>
                    <button
                      onClick={() => {
                        cancelarFormCategoria();
                        setMostrarFormCategoria(true);
                      }}
                      className="btn-adicionar"
                    >
                      <FaPlus /> Adicionar Categoria
                    </button>
                  </div>

                  {mostrarFormCategoria && (
                    <div className="form-categoria">
                      <h4>{categoriaEditando ? 'Editar Categoria' : 'Nova Categoria'}</h4>
                      <div className="form-group">
                        <label>Chave (identificador único) {categoriaEditando && '(não pode ser alterada)'}</label>
                        <input
                          type="text"
                          value={formCategoria.chave}
                          onChange={(e) => setFormCategoria({ ...formCategoria, chave: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                          placeholder="analytics"
                          disabled={!!categoriaEditando}
                        />
                      </div>
                      <div className="form-group">
                        <label>Nome</label>
                        <input
                          type="text"
                          value={formCategoria.nome}
                          onChange={(e) => setFormCategoria({ ...formCategoria, nome: e.target.value })}
                          placeholder="Cookies de Análise"
                        />
                      </div>
                      <div className="form-group">
                        <label>Descrição</label>
                        <textarea
                          value={formCategoria.descricao}
                          onChange={(e) => setFormCategoria({ ...formCategoria, descricao: e.target.value })}
                          placeholder="Nos ajudam a entender como os visitantes interagem com o site..."
                          rows={3}
                        />
                      </div>
                      <div className="form-group-checkbox">
                        <label>
                          <input
                            type="checkbox"
                            checked={formCategoria.ativo}
                            onChange={(e) => setFormCategoria({ ...formCategoria, ativo: e.target.checked })}
                          />
                          Ativo
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={formCategoria.obrigatorio}
                            onChange={(e) => setFormCategoria({ ...formCategoria, obrigatorio: e.target.checked })}
                          />
                          Obrigatório (não pode ser desativado pelo usuário)
                        </label>
                      </div>
                      <div className="form-group">
                        <label>Ordem</label>
                        <input
                          type="number"
                          value={formCategoria.ordem}
                          onChange={(e) => setFormCategoria({ ...formCategoria, ordem: parseInt(e.target.value) || 0 })}
                          min="0"
                        />
                      </div>
                      <div className="botoes-form">
                        <button
                          onClick={salvarCategoria}
                          disabled={salvando}
                          className="btn-salvar"
                        >
                          <FaSave /> {salvando ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button
                          onClick={cancelarFormCategoria}
                          className="btn-cancelar"
                        >
                          <FaTimes /> Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="lista-categorias">
                    {categorias.map((categoria) => (
                      <div key={categoria.id} className="categoria-item">
                        <div className="categoria-info">
                          <div className="categoria-header">
                            <h4>{categoria.nome}</h4>
                            <div className="categoria-badges">
                              {categoria.obrigatorio && <span className="badge obrigatorio">Obrigatório</span>}
                              {!categoria.ativo && <span className="badge inativo">Inativo</span>}
                            </div>
                          </div>
                          <p className="categoria-chave">Chave: <code>{categoria.chave}</code></p>
                          <p className="categoria-descricao">{categoria.descricao}</p>
                          <p className="categoria-ordem">Ordem: {categoria.ordem}</p>
                        </div>
                        <div className="categoria-acoes">
                          <button
                            onClick={() => editarCategoria(categoria)}
                            className="btn-editar"
                            title="Editar"
                          >
                            <FaEdit />
                          </button>
                          {!categoria.obrigatorio && (
                            <button
                              onClick={() => deletarCategoria(categoria.id)}
                              className="btn-deletar"
                              title="Remover"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {categorias.length === 0 && (
                      <p className="sem-categorias">Nenhuma categoria cadastrada. Clique em "Adicionar Categoria" para criar uma.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default GerenciamentoTermosPoliticaCookies;

