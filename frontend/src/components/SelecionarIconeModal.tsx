import { useState, useMemo } from 'react';
import Modal from './Modal';
import * as FaIcons from 'react-icons/fa';
import { FaSearch } from 'react-icons/fa';
import './SelecionarIconeModal.css';

interface SelecionarIconeModalProps {
  isOpen: boolean;
  iconeAtual: string | null;
  onClose: () => void;
  onSelect: (icone: string) => void;
}

// Mapeamento de nomes de ícones para português
const traducoesIcones: { [key: string]: string } = {
  'Folder': 'Pasta',
  'FolderOpen': 'Pasta Aberta',
  'Tag': 'Etiqueta',
  'Tags': 'Etiquetas',
  'Box': 'Caixa',
  'Boxes': 'Caixas',
  'ShoppingCart': 'Carrinho de Compras',
  'ShoppingBag': 'Sacola de Compras',
  'Store': 'Loja',
  'StoreAlt': 'Loja Alternativa',
  'Utensils': 'Talheres',
  'Hamburger': 'Hambúrguer',
  'PizzaSlice': 'Fatia de Pizza',
  'Coffee': 'Café',
  'IceCream': 'Sorvete',
  'AppleAlt': 'Maçã',
  'Carrot': 'Cenoura',
  'Fish': 'Peixe',
  'DrumstickBite': 'Coxa de Frango',
  'Home': 'Casa',
  'Building': 'Prédio',
  'Warehouse': 'Armazém',
  'Industry': 'Indústria',
  'Heart': 'Coração',
  'Star': 'Estrela',
  'Gift': 'Presente',
  'BirthdayCake': 'Bolo de Aniversário',
  'Music': 'Música',
  'Gamepad': 'Controle de Jogo',
  'Film': 'Filme',
  'Book': 'Livro',
  'BookOpen': 'Livro Aberto',
  'Tshirt': 'Camiseta',
  'ShoePrints': 'Pegadas',
  'Glasses': 'Óculos',
  'Gem': 'Gema',
  'Car': 'Carro',
  'Bicycle': 'Bicicleta',
  'Plane': 'Avião',
  'Ship': 'Navio',
  'Tools': 'Ferramentas',
  'Wrench': 'Chave Inglesa',
  'Hammer': 'Martelo',
  'Screwdriver': 'Chave de Fenda',
  'PaintBrush': 'Pincel',
  'Palette': 'Paleta',
  'Image': 'Imagem',
  'Camera': 'Câmera',
  'Mobile': 'Celular',
  'Laptop': 'Notebook',
  'Tablet': 'Tablet',
  'Desktop': 'Computador',
  'Headphones': 'Fones de Ouvido',
  'Tv': 'TV',
  'Radio': 'Rádio',
  'Dumbbell': 'Halter',
  'FootballBall': 'Bola de Futebol',
  'BasketballBall': 'Bola de Basquete',
  'BaseballBall': 'Bola de Beisebol',
  'SwimmingPool': 'Piscina',
  'UmbrellaBeach': 'Guarda-sol',
  'Mountain': 'Montanha',
  'Tree': 'Árvore',
  'Sun': 'Sol',
  'Moon': 'Lua',
  'Cloud': 'Nuvem',
  'CloudRain': 'Chuva',
  'Dog': 'Cachorro',
  'Cat': 'Gato',
  'Paw': 'Pata',
  'Dove': 'Pomba',
  'Flower': 'Flor',
  'Leaf': 'Folha',
  'Seedling': 'Muda',
  'User': 'Usuário',
  'Users': 'Usuários',
  'UserFriends': 'Amigos',
  'UserCircle': 'Perfil',
  'Briefcase': 'Pasta Executiva',
  'GraduationCap': 'Chapéu de Formatura',
  'University': 'Universidade',
  'Hospital': 'Hospital',
  'Stethoscope': 'Estetoscópio',
  'Pills': 'Remédios',
  'Heartbeat': 'Batimento Cardíaco',
  'MoneyBill': 'Nota de Dinheiro',
  'CreditCard': 'Cartão de Crédito',
  'Wallet': 'Carteira',
  'DollarSign': 'Cifrão',
  'ChartLine': 'Gráfico de Linha',
  'ChartBar': 'Gráfico de Barras',
  'ChartPie': 'Gráfico de Pizza',
  'Envelope': 'Envelope',
  'Phone': 'Telefone',
  'Video': 'Vídeo',
  'Comments': 'Comentários',
  'Bell': 'Sino',
  'Cog': 'Engrenagem',
  'Cogs': 'Engrenagens',
  'Lock': 'Cadeado',
  'Unlock': 'Cadeado Aberto',
  'Key': 'Chave',
  'ShieldAlt': 'Escudo',
  'Search': 'Buscar',
  'Filter': 'Filtro',
  'Sort': 'Ordenar',
  'List': 'Lista',
  'Th': 'Grade',
  'ThLarge': 'Grade Grande',
  'ThList': 'Lista em Grade',
  'Plus': 'Mais',
  'Minus': 'Menos',
  'Times': 'Fechar',
  'Check': 'Confirmar',
  'Edit': 'Editar',
  'Trash': 'Lixeira',
  'Save': 'Salvar',
  'Undo': 'Desfazer',
  'Download': 'Baixar',
  'Upload': 'Enviar',
  'Share': 'Compartilhar',
  'Copy': 'Copiar',
  'Print': 'Imprimir',
  'File': 'Arquivo',
  'FileAlt': 'Documento',
  'ArrowLeft': 'Seta Esquerda',
  'ArrowRight': 'Seta Direita',
  'ArrowUp': 'Seta Cima',
  'ArrowDown': 'Seta Baixo',
  'ChevronLeft': 'Chevron Esquerda',
  'ChevronRight': 'Chevron Direita',
  'ChevronUp': 'Chevron Cima',
  'ChevronDown': 'Chevron Baixo',
  'Info': 'Informação',
  'InfoCircle': 'Informação',
  'Question': 'Pergunta',
  'QuestionCircle': 'Pergunta',
  'Exclamation': 'Exclamação',
  'ExclamationCircle': 'Exclamação',
  'ExclamationTriangle': 'Atenção',
  'CheckCircle': 'Confirmado',
  'TimesCircle': 'Cancelado',
  'Ban': 'Proibido',
  'Clock': 'Relógio',
  'Calendar': 'Calendário',
  'CalendarAlt': 'Calendário',
  'CalendarCheck': 'Calendário com Check',
  'MapMarker': 'Marcador de Mapa',
  'MapMarkerAlt': 'Marcador de Mapa',
  'Globe': 'Globo',
  'GlobeAmericas': 'Globo Américas',
  'Flag': 'Bandeira',
  'FlagCheckered': 'Bandeira Quadriculada',
  'Trophy': 'Troféu',
  'Medal': 'Medalha',
  'Award': 'Prêmio',
  'Certificate': 'Certificado',
  'Ribbon': 'Fita',
  'Fire': 'Fogo',
  'Bolt': 'Raio',
  'Magic': 'Mágica',
  'Sparkles': 'Brilhos',
  'Rocket': 'Foguete',
  'SpaceShuttle': 'Ônibus Espacial',
  'Satellite': 'Satélite',
  'Atom': 'Átomo',
  'Flask': 'Frasco',
  'Microscope': 'Microscópio',
  'Vial': 'Ampola',
  'Dna': 'DNA',
  'Brain': 'Cérebro',
  'Eye': 'Olho',
  'EyeSlash': 'Olho Fechado',
  'Hand': 'Mão',
  'HandPaper': 'Mão Papel',
  'HandRock': 'Mão Pedra',
  'HandScissors': 'Mão Tesoura',
  'ThumbsUp': 'Curtir',
  'ThumbsDown': 'Descurtir',
  'HeartBroken': 'Coração Partido',
  'Smile': 'Sorriso',
  'Frown': 'Triste',
  'Meh': 'Neutro',
  'Grin': 'Sorriso Grande',
  'GrinBeam': 'Sorriso Radiante',
  'GrinHearts': 'Sorriso com Corações',
  'GrinStars': 'Sorriso com Estrelas',
  'GrinTears': 'Risos',
  'GrinTongue': 'Língua de Fora',
  'GrinTongueSquint': 'Língua de Fora',
  'GrinTongueWink': 'Piscar com Língua',
  'Kiss': 'Beijo',
  'KissBeam': 'Beijo Radiante',
  'KissWinkHeart': 'Beijo com Coração',
  'Laugh': 'Risada',
  'LaughBeam': 'Risada Radiante',
  'LaughSquint': 'Risada',
  'LaughWink': 'Risada com Piscar',
  'Angry': 'Bravo',
  'Dizzy': 'Tonto',
  'Flushed': 'Envergonhado',
  'Grimace': 'Careta',
  'GrinSquint': 'Sorriso',
  'GrinSquintTears': 'Risos',
  'GrinWink': 'Piscar',
  'MehBlank': 'Neutro',
  'MehRollingEyes': 'Revirar Olhos',
  'SadCry': 'Chorar',
  'SadTear': 'Lágrima',
  'Surprise': 'Surpreso',
  'Tired': 'Cansado',
  // Novos ícones de comida e bebida
  'Bacon': 'Bacon',
  'Beer': 'Cerveja',
  'WineGlass': 'Taça de Vinho',
  'WineGlassAlt': 'Taça de Vinho',
  'Cocktail': 'Coquetel',
  'GlassWhiskey': 'Whisky',
  'MugHot': 'Caneca Quente',
  'CandyCane': 'Pirulito',
  'Cookie': 'Biscoito',
  'CookieBite': 'Biscoito Mordido',
  'Cake': 'Bolo',
  'Candy': 'Doce',
  'BreadSlice': 'Fatia de Pão',
  'Cheese': 'Queijo',
  'Egg': 'Ovo',
  'PepperHot': 'Pimenta',
  'Hotdog': 'Cachorro-quente',
  'Lemon': 'Limão',
  'LemonSlice': 'Fatia de Limão',
  'Orange': 'Laranja',
  'Strawberry': 'Morango',
  'Grapes': 'Uvas',
  'Banana': 'Banana',
  'Watermelon': 'Melancia',
  'Cherry': 'Cereja',
  'Kiwi': 'Kiwi',
  'Mango': 'Manga',
  'Pineapple': 'Abacaxi',
  'Peach': 'Pêssego',
  'Pear': 'Pêra',
  'Plum': 'Ameixa',
  'Tomato': 'Tomate',
  'Broccoli': 'Brócolis',
  'Corn': 'Milho',
  'Cucumber': 'Pepino',
  'Lettuce': 'Alface',
  'Onion': 'Cebola',
  'Potato': 'Batata',
  'Pumpkin': 'Abóbora',
  'Radish': 'Rabanete',
  'Spinach': 'Espinafre',
  'Squash': 'Abobrinha',
  'Turnip': 'Nabo',
  'Blender': 'Liquidificador',
  'MortarPestle': 'Pilão',
  'Burn': 'Fogo',
  'ThermometerHalf': 'Termômetro',
  'ThermometerFull': 'Termômetro',
  'BowlFood': 'Tigela de Comida',
  'BowlRice': 'Tigela de Arroz',
  'BowlScoop': 'Tigela',
  'BowlSpoon': 'Tigela com Colher',
  'Plate': 'Prato',
  'Dish': 'Prato',
  'ForkKnife': 'Garfo e Faca',
  'Spoon': 'Colher',
  'Glass': 'Copo',
  'Mug': 'Caneca',
  'MugSaucer': 'Caneca com Pires',
  'Bottle': 'Garrafa',
  'BottleWater': 'Garrafa de Água',
  'BottleDroplet': 'Garrafa',
  'ShoppingBasket': 'Cesta de Compras',
  'Receipt': 'Nota Fiscal',
  'TicketAlt': 'Ingresso'
};

// Função para obter o nome traduzido do ícone
const obterNomeTraduzido = (nomeIcone: string): string => {
  const nomeSemPrefixo = nomeIcone.replace('Fa', '');
  return traducoesIcones[nomeSemPrefixo] || nomeSemPrefixo;
};

// Lista de ícones relacionados a comidas, bebidas, lanches, doces e consumo
const iconesDisponiveis = [
  // Comidas principais
  'FaUtensils', 'FaHamburger', 'FaPizzaSlice', 'FaDrumstickBite',
  'FaAppleAlt', 'FaCarrot', 'FaFish', 'FaBacon',
  // Bebidas
  'FaCoffee', 'FaBeer', 'FaWineGlass', 'FaWineGlassAlt',
  'FaCocktail', 'FaGlassWhiskey', 'FaMugHot', 'FaMug', 'FaMugSaucer',
  'FaBottle', 'FaBottleWater', 'FaBottleDroplet', 'FaGlass',
  // Doces e sobremesas
  'FaIceCream', 'FaBirthdayCake', 'FaCandyCane', 'FaCookie',
  'FaCookieBite', 'FaCake', 'FaCandy',
  // Lanches e petiscos
  'FaBreadSlice', 'FaCheese', 'FaEgg', 'FaPepperHot',
  'FaHotdog',
  // Frutas
  'FaAppleAlt', 'FaLemon', 'FaLemonSlice', 'FaOrange',
  'FaStrawberry', 'FaGrapes', 'FaBanana', 'FaWatermelon',
  'FaCherry', 'FaKiwi', 'FaMango', 'FaPineapple', 'FaPeach',
  'FaPear', 'FaPlum',
  // Vegetais
  'FaCarrot', 'FaTomato', 'FaBroccoli', 'FaCorn', 'FaCucumber',
  'FaLettuce', 'FaOnion', 'FaPotato', 'FaPumpkin',
  'FaRadish', 'FaSpinach', 'FaSquash', 'FaTurnip',
  // Utensílios e preparo
  'FaUtensils', 'FaBlender', 'FaMortarPestle', 'FaFire',
  'FaBurn', 'FaThermometerHalf', 'FaThermometerFull',
  // Serviço e apresentação
  'FaBowlFood', 'FaBowlRice', 'FaBowlScoop', 'FaBowlSpoon',
  'FaPlate', 'FaDish', 'FaForkKnife', 'FaSpoon',
  // Restaurante e delivery
  'FaStore', 'FaStoreAlt', 'FaShoppingCart', 'FaShoppingBag',
  'FaShoppingBasket', 'FaReceipt', 'FaTicketAlt',
  // Outros relacionados
  'FaHeart', 'FaStar', 'FaGift', 'FaSmile', 'FaGrin',
  'FaGrinBeam', 'FaGrinHearts', 'FaGrinStars', 'FaGrinTears',
  'FaGrinTongue', 'FaGrinTongueSquint', 'FaGrinTongueWink',
  'FaLaugh', 'FaLaughBeam', 'FaLaughSquint', 'FaLaughWink',
  'FaKiss', 'FaKissBeam', 'FaKissWinkHeart', 'FaThumbsUp',
  'FaThumbsDown', 'FaHeartBroken'
];

const SelecionarIconeModal = ({ isOpen, iconeAtual, onClose, onSelect }: SelecionarIconeModalProps) => {
  const [busca, setBusca] = useState('');

  const handleSelectIcon = (nomeIcone: string) => {
    onSelect(nomeIcone);
    onClose();
    setBusca(''); // Limpar busca ao fechar
  };

  // Filtrar ícones baseado na busca
  const iconesFiltrados = useMemo(() => {
    if (!busca.trim()) {
      return iconesDisponiveis;
    }
    const termoBusca = busca.toLowerCase();
    return iconesDisponiveis.filter(nomeIcone => {
      const nomeSemPrefixo = nomeIcone.replace('Fa', '').toLowerCase();
      const nomeTraduzido = obterNomeTraduzido(nomeIcone).toLowerCase();
      // Buscar tanto no nome em inglês quanto no nome traduzido
      return nomeSemPrefixo.includes(termoBusca) || 
             nomeTraduzido.includes(termoBusca) || 
             nomeIcone.toLowerCase().includes(termoBusca);
    });
  }, [busca]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setBusca('');
        onClose();
      }}
      title="Selecione o ícone"
      size="large"
    >
      <div className="selecionar-icone-container">
        <div className="busca-icone-wrapper">
          <FaSearch className="busca-icone-icon" />
          <input
            type="text"
            className="busca-icone-input"
            placeholder="Pesquisar ícone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            autoFocus
          />
        </div>
        {iconesFiltrados.length === 0 ? (
          <div className="icones-sem-resultado">
            <p>Nenhum ícone encontrado para "{busca}"</p>
          </div>
        ) : (
          <div className="icones-grid">
            {iconesFiltrados.map((nomeIcone) => {
              const IconComponent = (FaIcons as any)[nomeIcone];
              if (!IconComponent) return null;
              
              const isSelected = iconeAtual === nomeIcone;
              
              return (
                <button
                  key={nomeIcone}
                  className={`icone-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectIcon(nomeIcone)}
                  title={nomeIcone}
                >
                <IconComponent />
                <span className="icone-nome">{obterNomeTraduzido(nomeIcone)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SelecionarIconeModal;

