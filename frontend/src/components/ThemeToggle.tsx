import { FaSun, FaMoon } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

interface ThemeToggleProps {
  variant?: 'header' | 'floating';
}

const ThemeToggle = ({ variant = 'header' }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();

  if (variant === 'floating') {
    return (
      <button
        onClick={toggleTheme}
        className="theme-toggle theme-toggle-floating"
        title={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
        aria-label={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
      >
        {theme === 'light' ? <FaMoon /> : <FaSun />}
        <span>{theme === 'light' ? 'Escuro' : 'Claro'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle theme-toggle-header"
      title={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
      aria-label={theme === 'light' ? 'Alternar para tema escuro' : 'Alternar para tema claro'}
    >
      {theme === 'light' ? <FaMoon /> : <FaSun />}
    </button>
  );
};

export default ThemeToggle;

