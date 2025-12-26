import type { ConfiguracoesDemo } from '../services/sessionStorage';

export const aplicarConfiguracoesDemo = (config: ConfiguracoesDemo) => {
  const root = document.documentElement;
  
  // Aplicar cor primária customizada (sempre)
  root.style.setProperty('--cor-primaria', config.corPrimaria);
  
  // Aplicar cor de fundo customizada (o usuário escolhe essa cor)
  root.style.setProperty('--cor-fundo', config.corFundo);
  
  // NÃO sobrescrever --cor-secundaria com valor fixo
  // Deixar que o tema (claro/escuro) defina essa cor
  // A cor secundária deve seguir o tema para que cards/containers mudem corretamente
  // Isso garante que no modo claro os cards fiquem brancos e no modo escuro fiquem escuros
  
  const logoImg = document.querySelector('.logo') as HTMLImageElement;
  if (logoImg) {
    if (config.logoUrl) {
      logoImg.src = config.logoUrl;
    } else {
      logoImg.src = '/logo_nova.png';
    }
  }
  
  // Disparar evento para atualizar o Header
  window.dispatchEvent(new CustomEvent('config-updated-demo', { detail: { config } }));
};

