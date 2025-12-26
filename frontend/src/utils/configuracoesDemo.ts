import type { ConfiguracoesDemo } from '../services/sessionStorage';

export const aplicarConfiguracoesDemo = (config: ConfiguracoesDemo) => {
  const root = document.documentElement;
  
  // Aplicar cor primária customizada
  root.style.setProperty('--cor-primaria', config.corPrimaria);
  
  // Aplicar cor de fundo customizada
  root.style.setProperty('--cor-fundo', config.corFundo);
  
  // Aplicar cor secundária customizada
  root.style.setProperty('--cor-secundaria', config.corSecundaria);
  
  const logoImg = document.querySelector('.logo') as HTMLImageElement;
  if (logoImg) {
    if (config.logoUrl) {
      logoImg.src = config.logoUrl;
    } else {
      logoImg.src = '/logo_nova.png';
    }
  }
  
  // Disparar evento para atualizar o Header
  window.dispatchEvent(new CustomEvent('config-updated', { detail: { config } }));
};

