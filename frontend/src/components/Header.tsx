import './Header.css';

const Header = () => {
  return (
    <header>
      <div className="logo-container">
        <img src="/logo.png" alt="Vira-Latas Logo" className="logo" />
      </div>
      <h1>Calculadora de Reajuste de Preços</h1>
      <p>Selecione os itens e defina o tipo de reajuste</p>
    </header>
  );
};

export default Header;

