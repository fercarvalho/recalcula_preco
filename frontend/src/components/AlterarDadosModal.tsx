import { useState, useEffect } from 'react';
import { FaCamera, FaSpinner } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import { apiService } from '../services/api';
import './AlterarDadosModal.css';

interface AlterarDadosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DadosUsuario {
  nome: string;
  sobrenome: string;
  telefone: string;
  cpf: string;
  data_nascimento: string;
  genero: string;
  nome_estabelecimento: string;
  cep_residencial: string;
  endereco_residencial: string;
  numero_residencial: string;
  complemento_residencial: string;
  cidade_residencial: string;
  estado_residencial: string;
  cep_comercial: string;
  endereco_comercial: string;
  numero_comercial: string;
  complemento_comercial: string;
  cidade_comercial: string;
  estado_comercial: string;
  foto_perfil: string | null;
}

const AlterarDadosModal = ({ isOpen, onClose }: AlterarDadosModalProps) => {
  const [loading, setLoading] = useState(false);
  const [carregandoDados, setCarregandoDados] = useState(false);
  const [buscandoCepResidencial, setBuscandoCepResidencial] = useState(false);
  const [buscandoCepComercial, setBuscandoCepComercial] = useState(false);
  const [mesmoEndereco, setMesmoEndereco] = useState(false);
  const [cepResidencialBuscado, setCepResidencialBuscado] = useState(false);
  const [cepComercialBuscado, setCepComercialBuscado] = useState(false);
  const [dados, setDados] = useState<DadosUsuario>({
    nome: '',
    sobrenome: '',
    telefone: '',
    cpf: '',
    data_nascimento: '',
    genero: '',
    nome_estabelecimento: '',
    cep_residencial: '',
    endereco_residencial: '',
    numero_residencial: '',
    complemento_residencial: '',
    cidade_residencial: '',
    estado_residencial: '',
    cep_comercial: '',
    endereco_comercial: '',
    numero_comercial: '',
    complemento_comercial: '',
    cidade_comercial: '',
    estado_comercial: '',
    foto_perfil: null,
  });
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Carregar dados do usuário ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      carregarDados();
      setMesmoEndereco(false);
      setCepResidencialBuscado(false);
      setCepComercialBuscado(false);
    }
  }, [isOpen]);

  const carregarDados = async () => {
    setCarregandoDados(true);
    try {
      const response = await apiService.obterDadosUsuario();
      if (response.user) {
        const userData = response.user;
        
        // Formatar data de nascimento para o input (YYYY-MM-DD)
        let dataNascimentoFormatada = '';
        if (userData.data_nascimento) {
          const data = new Date(userData.data_nascimento);
          if (!isNaN(data.getTime())) {
            dataNascimentoFormatada = data.toISOString().split('T')[0];
          }
        }
        
        setDados({
          nome: userData.nome || '',
          sobrenome: userData.sobrenome || '',
          telefone: userData.telefone || '',
          cpf: userData.cpf || '',
          data_nascimento: dataNascimentoFormatada,
          genero: userData.genero || '',
          nome_estabelecimento: userData.nome_estabelecimento || '',
          cep_residencial: userData.cep_residencial || '',
          endereco_residencial: userData.endereco_residencial || '',
          numero_residencial: userData.numero_residencial || '',
          complemento_residencial: userData.complemento_residencial || '',
          cidade_residencial: userData.cidade_residencial || '',
          estado_residencial: userData.estado_residencial || '',
          cep_comercial: userData.cep_comercial || '',
          endereco_comercial: userData.endereco_comercial || '',
          numero_comercial: userData.numero_comercial || '',
          complemento_comercial: userData.complemento_comercial || '',
          cidade_comercial: userData.cidade_comercial || '',
          estado_comercial: userData.estado_comercial || '',
          foto_perfil: userData.foto_perfil || null,
        });
        setFotoPreview(userData.foto_perfil || null);
      }
    } catch (error: any) {
      console.error('Erro ao carregar dados:', error);
      await mostrarAlert('Erro', 'Erro ao carregar dados do usuário.');
    } finally {
      setCarregandoDados(false);
    }
  };

  const buscarCep = async (cep: string, tipo: 'residencial' | 'comercial') => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return;
    }

    if (tipo === 'residencial') {
      setBuscandoCepResidencial(true);
    } else {
      setBuscandoCepComercial(true);
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        await mostrarAlert('Erro', 'CEP não encontrado.');
        return;
      }

      if (tipo === 'residencial') {
        setDados(prev => ({
          ...prev,
          endereco_residencial: data.logradouro || '',
          cidade_residencial: data.localidade || '',
          estado_residencial: data.uf || '',
          complemento_residencial: data.complemento || prev.complemento_residencial,
        }));
        setCepResidencialBuscado(true);
      } else {
        setDados(prev => {
          const novosDados = {
            ...prev,
            endereco_comercial: data.logradouro || '',
            cidade_comercial: data.localidade || '',
            estado_comercial: data.uf || '',
            complemento_comercial: data.complemento || prev.complemento_comercial,
          };
          // Se mesmo endereço está marcado, copiar para residencial
          if (mesmoEndereco) {
            novosDados.cep_residencial = prev.cep_comercial;
            novosDados.endereco_residencial = novosDados.endereco_comercial;
            novosDados.numero_residencial = prev.numero_comercial;
            novosDados.cidade_residencial = novosDados.cidade_comercial;
            novosDados.estado_residencial = novosDados.estado_comercial;
          }
          return novosDados;
        });
        setCepComercialBuscado(true);
        if (mesmoEndereco) {
          setCepResidencialBuscado(true);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      await mostrarAlert('Erro', 'Erro ao buscar CEP. Tente novamente.');
    } finally {
      if (tipo === 'residencial') {
        setBuscandoCepResidencial(false);
      } else {
        setBuscandoCepComercial(false);
      }
    }
  };

  const handleCepResidencialBlur = () => {
    if (dados.cep_residencial && !mesmoEndereco) {
      buscarCep(dados.cep_residencial, 'residencial');
    }
  };

  const handleCepComercialBlur = () => {
    if (dados.cep_comercial) {
      buscarCep(dados.cep_comercial, 'comercial');
    }
  };

  const handleMesmoEnderecoChange = (checked: boolean) => {
    setMesmoEndereco(checked);
    if (checked) {
      // Copiar todos os campos do comercial para residencial (exceto complemento)
      setDados(prev => ({
        ...prev,
        cep_residencial: prev.cep_comercial,
        endereco_residencial: prev.endereco_comercial,
        numero_residencial: prev.numero_comercial,
        cidade_residencial: prev.cidade_comercial,
        estado_residencial: prev.estado_comercial,
        // complemento_residencial não é copiado
      }));
      setCepResidencialBuscado(cepComercialBuscado);
    } else {
      // Limpar campos residenciais quando desmarcar
      setDados(prev => ({
        ...prev,
        cep_residencial: '',
        endereco_residencial: '',
        numero_residencial: '',
        cidade_residencial: '',
        estado_residencial: '',
        // complemento_residencial não é limpo
      }));
      setCepResidencialBuscado(false);
    }
  };


  const formatarCep = (value: string) => {
    const cepLimpo = value.replace(/\D/g, '');
    if (cepLimpo.length <= 8) {
      return cepLimpo.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    return value;
  };

  const formatarTelefone = (value: string) => {
    const telefoneLimpo = value.replace(/\D/g, '');
    if (telefoneLimpo.length <= 10) {
      return telefoneLimpo.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else {
      return telefoneLimpo.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
  };

  const formatarCpf = (value: string) => {
    const cpfLimpo = value.replace(/\D/g, '');
    if (cpfLimpo.length <= 11) {
      return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        mostrarAlert('Erro', 'A foto deve ter no máximo 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFotoPreview(base64);
        setDados(prev => ({ ...prev, foto_perfil: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar número obrigatório quando CEP foi buscado
    if (cepComercialBuscado && !dados.numero_comercial.trim()) {
      await mostrarAlert('Erro', 'O número é obrigatório quando o CEP é informado.');
      return;
    }
    
    if (cepResidencialBuscado && !dados.numero_residencial.trim()) {
      await mostrarAlert('Erro', 'O número é obrigatório quando o CEP é informado.');
      return;
    }
    
    setLoading(true);

    try {
      await apiService.atualizarDadosUsuario(dados);
      await mostrarAlert('Sucesso', 'Dados atualizados com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar dados:', error);
      await mostrarAlert('Erro', error.message || 'Erro ao atualizar dados. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Alterar Dados"
      size="large"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary" disabled={loading}>
            Cancelar
          </button>
          <button onClick={handleSubmit} className="btn-primary" disabled={loading || carregandoDados}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </>
      }
    >
      {carregandoDados ? (
        <div className="loading-container">
          <FaSpinner className="spinner" />
          <p>Carregando dados...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="alterar-dados-form">
          {/* Foto de Perfil */}
          <div className="form-section">
            <h3>Foto de Perfil</h3>
            <div className="foto-perfil-container">
              <div className="foto-preview">
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Foto de perfil" />
                ) : (
                  <div className="foto-placeholder">
                    <FaCamera />
                  </div>
                )}
              </div>
              <label htmlFor="foto-perfil" className="btn-upload-foto">
                <FaCamera /> {fotoPreview ? 'Alterar Foto' : 'Adicionar Foto'}
                <input
                  id="foto-perfil"
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Dados Pessoais */}
          <div className="form-section">
            <h3>Dados Pessoais</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nome">Nome:</label>
                <input
                  id="nome"
                  type="text"
                  className="form-input"
                  value={dados.nome}
                  onChange={(e) => setDados(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite seu nome"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="sobrenome">Sobrenome:</label>
                <input
                  id="sobrenome"
                  type="text"
                  className="form-input"
                  value={dados.sobrenome}
                  onChange={(e) => setDados(prev => ({ ...prev, sobrenome: e.target.value }))}
                  placeholder="Digite seu sobrenome"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefone">Telefone:</label>
                <input
                  id="telefone"
                  type="text"
                  className="form-input"
                  value={dados.telefone}
                  onChange={(e) => setDados(prev => ({ ...prev, telefone: formatarTelefone(e.target.value) }))}
                  placeholder="(00) 00000-0000"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="cpf">CPF:</label>
                <input
                  id="cpf"
                  type="text"
                  className="form-input"
                  value={dados.cpf}
                  onChange={(e) => setDados(prev => ({ ...prev, cpf: formatarCpf(e.target.value) }))}
                  placeholder="000.000.000-00"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="data-nascimento">Data de Nascimento:</label>
                <input
                  id="data-nascimento"
                  type="date"
                  className="form-input date-input"
                  value={dados.data_nascimento}
                  onChange={(e) => setDados(prev => ({ ...prev, data_nascimento: e.target.value }))}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="genero">Gênero:</label>
                <select
                  id="genero"
                  className="form-input"
                  value={dados.genero}
                  onChange={(e) => setDados(prev => ({ ...prev, genero: e.target.value }))}
                  disabled={loading}
                >
                  <option value="">Selecione...</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="nao-binario">Não-binário</option>
                  <option value="outro">Outro</option>
                  <option value="prefiro-nao-informar">Prefiro não informar</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="nome-estabelecimento">Nome do Estabelecimento:</label>
              <input
                id="nome-estabelecimento"
                type="text"
                className="form-input"
                value={dados.nome_estabelecimento}
                onChange={(e) => setDados(prev => ({ ...prev, nome_estabelecimento: e.target.value }))}
                placeholder="Digite o nome do estabelecimento"
                disabled={loading}
              />
            </div>
          </div>

          {/* Endereço Comercial */}
          <div className="form-section">
            <h3>Endereço Comercial</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cep-comercial">CEP:</label>
                <input
                  id="cep-comercial"
                  type="text"
                  className="form-input"
                  value={dados.cep_comercial}
                  onChange={(e) => {
                    const novoValor = formatarCep(e.target.value);
                    setDados(prev => {
                      const novosDados = { ...prev, cep_comercial: novoValor };
                      if (mesmoEndereco) {
                        novosDados.cep_residencial = novoValor;
                      }
                      return novosDados;
                    });
                  }}
                  onBlur={handleCepComercialBlur}
                  placeholder="00000-000"
                  disabled={loading}
                />
                {buscandoCepComercial && <FaSpinner className="spinner-inline" />}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="endereco-comercial">Endereço:</label>
              <input
                id="endereco-comercial"
                type="text"
                className="form-input"
                value={dados.endereco_comercial}
                onChange={(e) => {
                  const novoValor = e.target.value;
                  setDados(prev => {
                    const novosDados = { ...prev, endereco_comercial: novoValor };
                    if (mesmoEndereco) {
                      novosDados.endereco_residencial = novoValor;
                    }
                    return novosDados;
                  });
                }}
                placeholder="Rua, Avenida, etc."
                disabled={loading}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="numero-comercial">
                  Número {cepComercialBuscado && <span className="required">*</span>}:
                </label>
                <input
                  id="numero-comercial"
                  type="text"
                  className="form-input"
                  value={dados.numero_comercial}
                  onChange={(e) => {
                    const novoValor = e.target.value;
                    setDados(prev => {
                      const novosDados = { ...prev, numero_comercial: novoValor };
                      if (mesmoEndereco) {
                        novosDados.numero_residencial = novoValor;
                      }
                      return novosDados;
                    });
                  }}
                  placeholder="Número"
                  disabled={loading}
                  required={cepComercialBuscado}
                />
              </div>
              <div className="form-group">
                <label htmlFor="complemento-comercial">Complemento:</label>
                <input
                  id="complemento-comercial"
                  type="text"
                  className="form-input"
                  value={dados.complemento_comercial}
                  onChange={(e) => setDados(prev => ({ ...prev, complemento_comercial: e.target.value }))}
                  placeholder="Apto, Bloco, etc."
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cidade-comercial">Cidade:</label>
                <input
                  id="cidade-comercial"
                  type="text"
                  className="form-input"
                  value={dados.cidade_comercial}
                  onChange={(e) => {
                    const novoValor = e.target.value;
                    setDados(prev => {
                      const novosDados = { ...prev, cidade_comercial: novoValor };
                      if (mesmoEndereco) {
                        novosDados.cidade_residencial = novoValor;
                      }
                      return novosDados;
                    });
                  }}
                  placeholder="Cidade"
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="estado-comercial">Estado:</label>
                <input
                  id="estado-comercial"
                  type="text"
                  className="form-input"
                  value={dados.estado_comercial}
                  onChange={(e) => {
                    const novoValor = e.target.value.toUpperCase();
                    setDados(prev => {
                      const novosDados = { ...prev, estado_comercial: novoValor };
                      if (mesmoEndereco) {
                        novosDados.estado_residencial = novoValor;
                      }
                      return novosDados;
                    });
                  }}
                  placeholder="UF"
                  maxLength={2}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Endereço Residencial */}
          <div className="form-section">
            <h3>Endereço Residencial</h3>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={mesmoEndereco}
                  onChange={(e) => handleMesmoEnderecoChange(e.target.checked)}
                  disabled={loading}
                />
                <span>Endereço residencial é o mesmo que comercial</span>
              </label>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cep-residencial">CEP:</label>
                <input
                  id="cep-residencial"
                  type="text"
                  className="form-input"
                  value={dados.cep_residencial}
                  onChange={(e) => setDados(prev => ({ ...prev, cep_residencial: formatarCep(e.target.value) }))}
                  onBlur={handleCepResidencialBlur}
                  placeholder="00000-000"
                  disabled={loading || mesmoEndereco}
                />
                {buscandoCepResidencial && <FaSpinner className="spinner-inline" />}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="endereco-residencial">Endereço:</label>
              <input
                id="endereco-residencial"
                type="text"
                className="form-input"
                value={dados.endereco_residencial}
                onChange={(e) => setDados(prev => ({ ...prev, endereco_residencial: e.target.value }))}
                placeholder="Rua, Avenida, etc."
                disabled={loading || mesmoEndereco}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="numero-residencial">
                  Número {cepResidencialBuscado && <span className="required">*</span>}:
                </label>
                <input
                  id="numero-residencial"
                  type="text"
                  className="form-input"
                  value={dados.numero_residencial}
                  onChange={(e) => setDados(prev => ({ ...prev, numero_residencial: e.target.value }))}
                  placeholder="Número"
                  disabled={loading || mesmoEndereco}
                  required={cepResidencialBuscado}
                />
              </div>
              <div className="form-group">
                <label htmlFor="complemento-residencial">Complemento:</label>
                <input
                  id="complemento-residencial"
                  type="text"
                  className="form-input"
                  value={dados.complemento_residencial}
                  onChange={(e) => setDados(prev => ({ ...prev, complemento_residencial: e.target.value }))}
                  placeholder="Apto, Bloco, etc."
                  disabled={loading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cidade-residencial">Cidade:</label>
                <input
                  id="cidade-residencial"
                  type="text"
                  className="form-input"
                  value={dados.cidade_residencial}
                  onChange={(e) => setDados(prev => ({ ...prev, cidade_residencial: e.target.value }))}
                  placeholder="Cidade"
                  disabled={loading || mesmoEndereco}
                />
              </div>
              <div className="form-group">
                <label htmlFor="estado-residencial">Estado:</label>
                <input
                  id="estado-residencial"
                  type="text"
                  className="form-input"
                  value={dados.estado_residencial}
                  onChange={(e) => setDados(prev => ({ ...prev, estado_residencial: e.target.value.toUpperCase() }))}
                  placeholder="UF"
                  maxLength={2}
                  disabled={loading || mesmoEndereco}
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AlterarDadosModal;

