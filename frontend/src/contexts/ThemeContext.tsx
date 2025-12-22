import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isSystemDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar se há preferência manual salva
    const savedTheme = localStorage.getItem('theme-preference') as Theme | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      // Aplicar imediatamente antes do primeiro render
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
      return savedTheme;
    }
    
    // Se não houver preferência manual, detectar do sistema
    if (typeof window !== 'undefined') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      // Aplicar imediatamente antes do primeiro render
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', initialTheme);
      }
      return initialTheme;
    }
    
    return 'light';
  });

  const [isSystemDark, setIsSystemDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Aplicar tema no elemento HTML (garantir que seja aplicado sempre)
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    // Garantir que o body também tenha o background correto
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }, [theme]);

  // Ouvir mudanças na preferência do sistema
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
      // Só atualizar automaticamente se não houver preferência manual
      const savedTheme = localStorage.getItem('theme-preference');
      if (!savedTheme) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };

    // Adicionar listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback para navegadores antigos
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme-preference', newTheme);
  };

  // Limpar preferência manual ao fazer logout (será chamado externamente)
  const clearManualPreference = () => {
    localStorage.removeItem('theme-preference');
    // Voltar para a preferência do sistema
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(prefersDark ? 'dark' : 'light');
  };

  // Expor função para limpar preferência (será usada no logout)
  useEffect(() => {
    (window as any).clearThemePreference = clearManualPreference;
    return () => {
      delete (window as any).clearThemePreference;
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isSystemDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

