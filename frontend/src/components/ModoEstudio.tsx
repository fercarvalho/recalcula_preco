import { useState, useRef, useEffect } from 'react';
import { apiService } from '../services/api';
import { mostrarAlert } from '../utils/modals';
import { FaUpload, FaSpinner, FaDownload, FaImage } from 'react-icons/fa';
import './ModoEstudio.css';

interface ModoEstudioProps {
  statusPagamento: {
    temAcesso: boolean;
    tipo: 'anual' | 'unico' | 'vitalicio' | null;
  } | null;
  onOpenModalPlanos?: () => void;
  onOpenModalUpgrade?: () => void;
  onOpenFeedback?: (funcao: string) => void;
}

interface FotoProcessada {
  id: number;
  foto_original: string;
  foto_processada: string;
  status: 'processando' | 'concluido' | 'erro';
  created_at: string;
}

const ModoEstudio = ({ statusPagamento, onOpenModalPlanos, onOpenModalUpgrade, onOpenFeedback }: ModoEstudioProps) => {
  const [fotoSelecionada, setFotoSelecionada] = useState<File | null>(null);
  const [previewOriginal, setPreviewOriginal] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [fotoProcessada, setFotoProcessada] = useState<FotoProcessada | null>(null);
  const [temAcessoFuncao, setTemAcessoFuncao] = useState<boolean | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar acesso à função especial ao montar o componente
  useEffect(() => {
    const verificarAcesso = async () => {
      try {
        const resultado = await apiService.verificarAcessoFuncaoEspecial('modo_estudio');
        setTemAcessoFuncao(resultado.temAcesso);
      } catch (error) {
        console.error('Erro ao verificar acesso ao Modo Estúdio:', error);
        setTemAcessoFuncao(false);
      }
    };
    verificarAcesso();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      mostrarAlert('Erro', 'Por favor, selecione um arquivo de imagem.');
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      mostrarAlert('Erro', 'A imagem deve ter no máximo 10MB.');
      return;
    }

    setFotoSelecionada(file);
    
    // Criar preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewOriginal(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessarFoto = async () => {
    if (!fotoSelecionada) {
      await mostrarAlert('Atenção', 'Por favor, selecione uma foto primeiro.');
      return;
    }

    // Verificar acesso à função especial
    if (temAcessoFuncao === null) {
      // Ainda verificando acesso, aguardar
      await mostrarAlert('Atenção', 'Verificando permissões...');
      return;
    }

    if (!temAcessoFuncao) {
      await mostrarAlert('Acesso Negado', 'Você não tem permissão para usar o Modo Estúdio.');
      return;
    }

    try {
      setProcessando(true);
      
      // Converter arquivo para base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        try {
          const resultado = await apiService.processarFotoEstudio(base64);
          
          if (resultado.foto_processada) {
            setFotoProcessada({
              id: resultado.id,
              foto_original: previewOriginal || '',
              foto_processada: resultado.foto_processada,
              status: 'concluido',
              created_at: new Date().toISOString()
            });
            
            await mostrarAlert('Sucesso', 'Foto processada com sucesso!');
          } else {
            await mostrarAlert('Erro', 'Erro ao processar a foto. Tente novamente.');
          }
        } catch (error: any) {
          console.error('Erro ao processar foto:', error);
          await mostrarAlert('Erro', error.response?.data?.error || 'Erro ao processar a foto. Tente novamente.');
        } finally {
          setProcessando(false);
        }
      };
      
      reader.onerror = async () => {
        await mostrarAlert('Erro', 'Erro ao ler o arquivo. Tente novamente.');
        setProcessando(false);
      };
      
      reader.readAsDataURL(fotoSelecionada);
    } catch (error) {
      console.error('Erro:', error);
      setProcessando(false);
    }
  };

  const handleDownload = (fotoUrl: string, nome: string = 'foto-profissional') => {
    const link = document.createElement('a');
    link.href = fotoUrl;
    link.download = `${nome}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLimpar = () => {
    setFotoSelecionada(null);
    setPreviewOriginal(null);
    setFotoProcessada(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="modo-estudio-section">
      <div className="modo-estudio-container">
        <div className="modo-estudio-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h3 className="modo-estudio-title">Modo Estúdio</h3>
            <span className="roadmap-tag">Em Beta</span>
            {temAcessoFuncao && onOpenFeedback && (
              <button
                type="button"
                onClick={() => onOpenFeedback('Modo Estúdio')}
                className="btn-feedback-beta"
                title="Enviar feedback sobre esta função"
              >
                <FaImage /> Feedback
              </button>
            )}
          </div>
          <p className="modo-estudio-description">
            Transforme suas fotos em imagens profissionais usando inteligência artificial. 
            Envie sua foto e receba uma versão aprimorada com qualidade de estúdio.
          </p>
        </div>

        <div className="modo-estudio-upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="modo-estudio-file-input"
            id="foto-estudio-input"
          />
          <label htmlFor="foto-estudio-input" className="modo-estudio-upload-label">
            <FaUpload /> {fotoSelecionada ? 'Trocar Foto' : 'Selecionar Foto'}
          </label>
          
          {previewOriginal && (
            <div className="modo-estudio-preview-container">
              <div className="modo-estudio-preview-item">
                <h4>Foto Original</h4>
                <img src={previewOriginal} alt="Original" className="modo-estudio-preview-img" />
                <button
                  onClick={handleLimpar}
                  className="btn-secondary"
                  style={{ marginTop: '0.5rem' }}
                >
                  Limpar
                </button>
              </div>
              
              {fotoProcessada && fotoProcessada.status === 'concluido' && (
                <div className="modo-estudio-preview-item">
                  <h4>Foto Profissional</h4>
                  <img src={fotoProcessada.foto_processada} alt="Processada" className="modo-estudio-preview-img" />
                  <button
                    onClick={() => handleDownload(fotoProcessada.foto_processada, 'foto-profissional')}
                    className="btn-primary"
                    style={{ marginTop: '0.5rem' }}
                  >
                    <FaDownload /> Baixar
                  </button>
                </div>
              )}
            </div>
          )}

          {previewOriginal && !fotoProcessada && (
            <button
              onClick={handleProcessarFoto}
              disabled={processando}
              className="btn-processar-foto"
            >
              {processando ? (
                <>
                  <FaSpinner className="spinner" /> Processando...
                </>
              ) : (
                <>
                  <FaImage /> Processar Foto
                </>
              )}
            </button>
          )}

          {processando && (
            <div className="modo-estudio-processando">
              <p>Processando sua foto com IA... Isso pode levar alguns segundos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModoEstudio;

