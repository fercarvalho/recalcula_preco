import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { mostrarAlert, mostrarConfirm } from '../utils/modals';
import { getUser } from '../services/auth';
import { FaUndo, FaSave, FaImage, FaPalette, FaTrash } from 'react-icons/fa';
import { carregarConfiguracoes, aplicarConfiguracoes, type ConfiguracoesAdmin } from '../utils/configuracoes';
import './PainelAdmin.css';

const getConfigKey = (userId?: number | null): string => {
  if (userId) {
    return `calculadora_admin_config_${userId}`;
  }
  // Fallback para compatibilidade com versão antiga
  return 'calculadora_admin_config';
};

const salvarConfiguracoes = (config: ConfiguracoesAdmin, userId?: number | null) => {
  // Se não foi passado userId, tentar obter do usuário atual
  if (!userId) {
    const user = getUser();
    userId = user?.id;
  }
  
  const key = getConfigKey(userId);
  localStorage.setItem(key, JSON.stringify(config));
};

interface PainelAdminProps {
  isOpen: boolean;
  onClose: () => void;
  scrollToColors?: boolean;
}

const PainelAdmin = ({ isOpen, onClose, scrollToColors = false }: PainelAdminProps) => {
  const user = getUser();
  const userId = user?.id;
  const configInicial = carregarConfiguracoes(userId);
  const [config, setConfig] = useState<ConfiguracoesAdmin>(configInicial);
  const [logoPreview, setLogoPreview] = useState<string | null>(configInicial.logoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Recarregar configurações do usuário atual quando abrir o modal
      const configAtual = carregarConfiguracoes(userId);
      setConfig(configAtual);
      // Se houver logoUrl salva, usar ela; caso contrário, usar null para mostrar fallback correto
      setLogoPreview(configAtual.logoUrl || null);
      aplicarConfiguracoes(configAtual);
    }
  }, [isOpen, userId]);

  useEffect(() => {
    if (isOpen) {
      aplicarConfiguracoes(config);
      // Se scrollToColors for true, fazer scroll para a seção de cores após um pequeno delay
      if (scrollToColors) {
        setTimeout(() => {
          const coresSection = document.getElementById('cores-sistema');
          if (coresSection) {
            coresSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300);
      }
    }
  }, [isOpen, config, scrollToColors]);

  const handleCorChange = (campo: keyof ConfiguracoesAdmin, valor: string) => {
    const novoConfig = { ...config, [campo]: valor };
    setConfig(novoConfig);
    aplicarConfiguracoes(novoConfig);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      mostrarAlert('Erro', 'Por favor, selecione um arquivo de imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setLogoPreview(dataUrl);
      const novoConfig = { ...config, logoUrl: dataUrl };
      setConfig(novoConfig);
      aplicarConfiguracoes(novoConfig);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoverLogo = () => {
    setLogoPreview(null);
    const novoConfig = { ...config, logoUrl: null };
    setConfig(novoConfig);
    aplicarConfiguracoes(novoConfig);
    
    const logoImg = document.querySelector('.logo') as HTMLImageElement;
    if (logoImg) {
      // Usar logo_nova.png como padrão (logo.png é apenas para viralatas)
      logoImg.src = '/logo_nova.png';
    }
  };

  const handleResetar = async () => {
    const confirmado = await mostrarConfirm(
      'Resetar Configurações',
      'Tem certeza que deseja resetar todas as configurações para os valores padrão?'
    );
    
    if (confirmado) {
      const configPadrao = {
        corPrimaria: '#FF6B35',
        corSecundaria: '#2a2a2a',
        corFundo: '#1a1a1a',
        logoUrl: null,
      };
      setConfig(configPadrao);
      setLogoPreview(null);
      aplicarConfiguracoes(configPadrao);
      
      // Remover configurações do usuário atual
      const key = getConfigKey(userId);
      localStorage.removeItem(key);
      
      const logoImg = document.querySelector('.logo') as HTMLImageElement;
      if (logoImg) {
        // Usar logo_nova.png como padrão (logo.png é apenas para viralatas)
        const user = getUser();
        logoImg.src = user?.username === 'viralatas' ? '/logo.png' : '/logo_nova.png';
      }
      
      await mostrarAlert('Sucesso', 'Configurações resetadas para os valores padrão!');
    }
  };

  const handleSalvar = () => {
    salvarConfiguracoes(config, userId);
    aplicarConfiguracoes(config);
    mostrarAlert('Sucesso', 'Configurações salvas com sucesso!');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Painel de Personalização"
      size="large"
      footer={
        <>
          <button onClick={handleResetar} className="btn-secondary">
            <FaUndo /> Resetar para Padrão
          </button>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSalvar} className="btn-primary">
            <FaSave /> Salvar Configurações
          </button>
        </>
      }
    >
      <div className="admin-section">
        <h3><FaImage /> Logo do Sistema</h3>
        <div className="form-group">
          <label htmlFor="admin-logo-upload">Selecionar Nova Logo:</label>
          <input
            ref={fileInputRef}
            type="file"
            id="admin-logo-upload"
            accept="image/*"
            className="form-input"
            onChange={handleLogoUpload}
          />
          <small className="form-help">
            Formatos aceitos: PNG, JPG, GIF, SVG (recomendado: PNG com fundo transparente)
          </small>
        </div>
        <div className="logo-preview-container">
          <label>Preview da Logo:</label>
          <div className="logo-preview">
            <img
              src={logoPreview || (user?.username === 'viralatas' ? '/logo.png' : '/logo_nova.png')}
              alt="Preview Logo"
              style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '50%' }}
            />
          </div>
          <button onClick={handleRemoverLogo} className="btn-secondary" style={{ marginTop: '10px' }}>
            <FaTrash /> Remover Logo
          </button>
        </div>
      </div>

      <div className="admin-section" id="cores-sistema">
        <h3><FaPalette /> Cores do Sistema</h3>
        <div className="color-picker-group">
          <div className="form-group">
            <label htmlFor="admin-cor-primaria">Cor Primária (Botões, Headers):</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                id="admin-cor-primaria"
                value={config.corPrimaria}
                onChange={(e) => handleCorChange('corPrimaria', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                id="admin-cor-primaria-text"
                value={config.corPrimaria}
                onChange={(e) => handleCorChange('corPrimaria', e.target.value)}
                className="color-text-input"
                placeholder="#FF6B35"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="admin-cor-secundaria">Cor Secundária (Botões Secundários):</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                id="admin-cor-secundaria"
                value={config.corSecundaria}
                onChange={(e) => handleCorChange('corSecundaria', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                id="admin-cor-secundaria-text"
                value={config.corSecundaria}
                onChange={(e) => handleCorChange('corSecundaria', e.target.value)}
                className="color-text-input"
                placeholder="#2a2a2a"
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="admin-cor-fundo">Cor de Fundo:</label>
            <div className="color-input-wrapper">
              <input
                type="color"
                id="admin-cor-fundo"
                value={config.corFundo}
                onChange={(e) => handleCorChange('corFundo', e.target.value)}
                className="color-picker"
              />
              <input
                type="text"
                id="admin-cor-fundo-text"
                value={config.corFundo}
                onChange={(e) => handleCorChange('corFundo', e.target.value)}
                className="color-text-input"
                placeholder="#1a1a1a"
              />
            </div>
          </div>
        </div>
        <div className="color-preview">
          <label>Preview das Cores:</label>
          <div className="preview-boxes">
            <div
              className="preview-box"
              id="preview-primaria"
              style={{ background: config.corPrimaria }}
            >
              Primária
            </div>
            <div
              className="preview-box"
              id="preview-secundaria"
              style={{ background: config.corSecundaria }}
            >
              Secundária
            </div>
            <div
              className="preview-box"
              id="preview-fundo"
              style={{ background: config.corFundo }}
            >
              Fundo
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PainelAdmin;

