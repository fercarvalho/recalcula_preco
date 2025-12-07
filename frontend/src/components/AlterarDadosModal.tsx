import { useState, useEffect } from 'react';
import { FaCamera, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';
import Modal from './Modal';
import { mostrarAlert } from '../utils/modals';
import { apiService } from '../services/api';
import DatePicker from './DatePicker';
import './AlterarDadosModal.css';

// Lista de países
const PAISES = [
  'Brasil', 'Afeganistão', 'África do Sul', 'Albânia', 'Alemanha', 'Andorra', 'Angola', 'Antígua e Barbuda',
  'Arábia Saudita', 'Argélia', 'Argentina', 'Armênia', 'Austrália', 'Áustria', 'Azerbaijão', 'Bahamas',
  'Bangladesh', 'Barbados', 'Barein', 'Bélgica', 'Belize', 'Benim', 'Bielorrússia', 'Bolívia', 'Bósnia e Herzegovina',
  'Botsuana', 'Brunei', 'Bulgária', 'Burkina Faso', 'Burundi', 'Butão', 'Cabo Verde', 'Camarões', 'Camboja',
  'Canadá', 'Catar', 'Cazaquistão', 'Chade', 'Chile', 'China', 'Chipre', 'Colômbia', 'Comores', 'Congo',
  'Coreia do Norte', 'Coreia do Sul', 'Costa do Marfim', 'Costa Rica', 'Croácia', 'Cuba', 'Dinamarca', 'Djibuti',
  'Dominica', 'Egito', 'El Salvador', 'Emirados Árabes Unidos', 'Equador', 'Eritreia', 'Eslováquia', 'Eslovênia',
  'Espanha', 'Estados Unidos', 'Estônia', 'Eswatini', 'Etiópia', 'Fiji', 'Filipinas', 'Finlândia', 'França',
  'Gabão', 'Gâmbia', 'Gana', 'Geórgia', 'Granada', 'Grécia', 'Guatemala', 'Guiana', 'Guiné', 'Guiné-Bissau',
  'Guiné Equatorial', 'Haiti', 'Honduras', 'Hungria', 'Iêmen', 'Índia', 'Indonésia', 'Irã', 'Iraque', 'Irlanda',
  'Islândia', 'Israel', 'Itália', 'Jamaica', 'Japão', 'Jordânia', 'Kiribati', 'Kuwait', 'Laos', 'Lesoto',
  'Letônia', 'Líbano', 'Libéria', 'Líbia', 'Liechtenstein', 'Lituânia', 'Luxemburgo', 'Madagáscar', 'Malásia',
  'Maláui', 'Maldivas', 'Mali', 'Malta', 'Marrocos', 'Maurícia', 'Mauritânia', 'México', 'Micronésia', 'Moçambique',
  'Moldávia', 'Mônaco', 'Mongólia', 'Montenegro', 'Myanmar', 'Namíbia', 'Nauru', 'Nepal', 'Nicarágua', 'Níger',
  'Nigéria', 'Noruega', 'Nova Zelândia', 'Omã', 'Países Baixos', 'Palau', 'Palestina', 'Panamá', 'Papua-Nova Guiné',
  'Paquistão', 'Paraguai', 'Peru', 'Polônia', 'Portugal', 'Quênia', 'Quirguistão', 'Reino Unido', 'República Centro-Africana',
  'República Democrática do Congo', 'República Dominicana', 'Romênia', 'Ruanda', 'Rússia', 'Salomão', 'Samoa', 'San Marino',
  'Santa Lúcia', 'São Cristóvão e Névis', 'São Tomé e Príncipe', 'São Vicente e Granadinas', 'Seicheles', 'Senegal',
  'Serra Leoa', 'Sérvia', 'Singapura', 'Síria', 'Somália', 'Sri Lanka', 'Sudão', 'Sudão do Sul', 'Suécia', 'Suíça',
  'Suriname', 'Tadjiquistão', 'Tailândia', 'Tanzânia', 'Timor-Leste', 'Togo', 'Tonga', 'Trindade e Tobago', 'Tunísia',
  'Turcomenistão', 'Turquia', 'Tuvalu', 'Ucrânia', 'Uganda', 'Uruguai', 'Uzbequistão', 'Vanuatu', 'Vaticano', 'Venezuela',
  'Vietnã', 'Zâmbia', 'Zimbábue'
].sort();

// Mapeamento de países para códigos de telefone
const CODIGOS_PAIS: { [key: string]: string } = {
  'Brasil': '+55',
  'Afeganistão': '+93',
  'África do Sul': '+27',
  'Albânia': '+355',
  'Alemanha': '+49',
  'Andorra': '+376',
  'Angola': '+244',
  'Antígua e Barbuda': '+1',
  'Arábia Saudita': '+966',
  'Argélia': '+213',
  'Argentina': '+54',
  'Armênia': '+374',
  'Austrália': '+61',
  'Áustria': '+43',
  'Azerbaijão': '+994',
  'Bahamas': '+1',
  'Bangladesh': '+880',
  'Barbados': '+1',
  'Barein': '+973',
  'Bélgica': '+32',
  'Belize': '+501',
  'Benim': '+229',
  'Bielorrússia': '+375',
  'Bolívia': '+591',
  'Bósnia e Herzegovina': '+387',
  'Botsuana': '+267',
  'Brunei': '+673',
  'Bulgária': '+359',
  'Burkina Faso': '+226',
  'Burundi': '+257',
  'Butão': '+975',
  'Cabo Verde': '+238',
  'Camarões': '+237',
  'Camboja': '+855',
  'Canadá': '+1',
  'Catar': '+974',
  'Cazaquistão': '+7',
  'Chade': '+235',
  'Chile': '+56',
  'China': '+86',
  'Chipre': '+357',
  'Colômbia': '+57',
  'Comores': '+269',
  'Congo': '+242',
  'Coreia do Norte': '+850',
  'Coreia do Sul': '+82',
  'Costa do Marfim': '+225',
  'Costa Rica': '+506',
  'Croácia': '+385',
  'Cuba': '+53',
  'Dinamarca': '+45',
  'Djibuti': '+253',
  'Dominica': '+1',
  'Egito': '+20',
  'El Salvador': '+503',
  'Emirados Árabes Unidos': '+971',
  'Equador': '+593',
  'Eritreia': '+291',
  'Eslováquia': '+421',
  'Eslovênia': '+386',
  'Espanha': '+34',
  'Estados Unidos': '+1',
  'Estônia': '+372',
  'Eswatini': '+268',
  'Etiópia': '+251',
  'Fiji': '+679',
  'Filipinas': '+63',
  'Finlândia': '+358',
  'França': '+33',
  'Gabão': '+241',
  'Gâmbia': '+220',
  'Gana': '+233',
  'Geórgia': '+995',
  'Granada': '+1',
  'Grécia': '+30',
  'Guatemala': '+502',
  'Guiana': '+592',
  'Guiné': '+224',
  'Guiné-Bissau': '+245',
  'Guiné Equatorial': '+240',
  'Haiti': '+509',
  'Honduras': '+504',
  'Hungria': '+36',
  'Iêmen': '+967',
  'Índia': '+91',
  'Indonésia': '+62',
  'Irã': '+98',
  'Iraque': '+964',
  'Irlanda': '+353',
  'Islândia': '+354',
  'Israel': '+972',
  'Itália': '+39',
  'Jamaica': '+1',
  'Japão': '+81',
  'Jordânia': '+962',
  'Kiribati': '+686',
  'Kuwait': '+965',
  'Laos': '+856',
  'Lesoto': '+266',
  'Letônia': '+371',
  'Líbano': '+961',
  'Libéria': '+231',
  'Líbia': '+218',
  'Liechtenstein': '+423',
  'Lituânia': '+370',
  'Luxemburgo': '+352',
  'Madagáscar': '+261',
  'Malásia': '+60',
  'Maláui': '+265',
  'Maldivas': '+960',
  'Mali': '+223',
  'Malta': '+356',
  'Marrocos': '+212',
  'Maurícia': '+230',
  'Mauritânia': '+222',
  'México': '+52',
  'Micronésia': '+691',
  'Moçambique': '+258',
  'Moldávia': '+373',
  'Mônaco': '+377',
  'Mongólia': '+976',
  'Montenegro': '+382',
  'Myanmar': '+95',
  'Namíbia': '+264',
  'Nauru': '+674',
  'Nepal': '+977',
  'Nicarágua': '+505',
  'Níger': '+227',
  'Nigéria': '+234',
  'Noruega': '+47',
  'Nova Zelândia': '+64',
  'Omã': '+968',
  'Países Baixos': '+31',
  'Palau': '+680',
  'Palestina': '+970',
  'Panamá': '+507',
  'Papua-Nova Guiné': '+675',
  'Paquistão': '+92',
  'Paraguai': '+595',
  'Peru': '+51',
  'Polônia': '+48',
  'Portugal': '+351',
  'Quênia': '+254',
  'Quirguistão': '+996',
  'Reino Unido': '+44',
  'República Centro-Africana': '+236',
  'República Democrática do Congo': '+243',
  'República Dominicana': '+1',
  'Romênia': '+40',
  'Ruanda': '+250',
  'Rússia': '+7',
  'Salomão': '+677',
  'Samoa': '+685',
  'San Marino': '+378',
  'Santa Lúcia': '+1',
  'São Cristóvão e Névis': '+1',
  'São Tomé e Príncipe': '+239',
  'São Vicente e Granadinas': '+1',
  'Seicheles': '+248',
  'Senegal': '+221',
  'Serra Leoa': '+232',
  'Sérvia': '+381',
  'Singapura': '+65',
  'Síria': '+963',
  'Somália': '+252',
  'Sri Lanka': '+94',
  'Sudão': '+249',
  'Sudão do Sul': '+211',
  'Suécia': '+46',
  'Suíça': '+41',
  'Suriname': '+597',
  'Tadjiquistão': '+992',
  'Tailândia': '+66',
  'Tanzânia': '+255',
  'Timor-Leste': '+670',
  'Togo': '+228',
  'Tonga': '+676',
  'Trindade e Tobago': '+1',
  'Tunísia': '+216',
  'Turcomenistão': '+993',
  'Turquia': '+90',
  'Tuvalu': '+688',
  'Ucrânia': '+380',
  'Uganda': '+256',
  'Uruguai': '+598',
  'Uzbequistão': '+998',
  'Vanuatu': '+678',
  'Vaticano': '+39',
  'Venezuela': '+58',
  'Vietnã': '+84',
  'Zâmbia': '+260',
  'Zimbábue': '+263'
};

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
  pais_residencial: string;
  cep_comercial: string;
  endereco_comercial: string;
  numero_comercial: string;
  complemento_comercial: string;
  cidade_comercial: string;
  estado_comercial: string;
  pais_comercial: string;
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
  const [emailValidado, setEmailValidado] = useState(false);
  
  // Função helper para garantir que valores nunca sejam undefined
  const garantirString = (valor: string | undefined | null): string => {
    return valor ?? '';
  };
  
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
    pais_residencial: 'Brasil',
    cep_comercial: '',
    endereco_comercial: '',
    numero_comercial: '',
    complemento_comercial: '',
    cidade_comercial: '',
    estado_comercial: '',
    pais_comercial: 'Brasil',
    foto_perfil: null,
  });
  const [naoResidoBrasilResidencial, setNaoResidoBrasilResidencial] = useState(false);
  const [naoResidoBrasilComercial, setNaoResidoBrasilComercial] = useState(false);
  const [naoPossuiCpf, setNaoPossuiCpf] = useState(false);
  const [codigoPaisTelefone, setCodigoPaisTelefone] = useState('+55');
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  // Carregar dados do usuário ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      carregarDados();
      setMesmoEndereco(false);
      setCepResidencialBuscado(false);
      setCepComercialBuscado(false);
      setNaoPossuiCpf(false);
      setNaoResidoBrasilResidencial(false);
      setNaoResidoBrasilComercial(false);
      setCodigoPaisTelefone('+55');
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
          pais_residencial: userData.pais_residencial || 'Brasil',
          cep_comercial: userData.cep_comercial || '',
          endereco_comercial: userData.endereco_comercial || '',
          numero_comercial: userData.numero_comercial || '',
          complemento_comercial: userData.complemento_comercial || '',
          cidade_comercial: userData.cidade_comercial || '',
          estado_comercial: userData.estado_comercial || '',
          pais_comercial: userData.pais_comercial || 'Brasil',
          foto_perfil: userData.foto_perfil || null,
        });
        setFotoPreview(userData.foto_perfil || null);
        // Verificar se o país não é Brasil para habilitar o checkbox
        setNaoResidoBrasilResidencial(userData.pais_residencial && userData.pais_residencial !== 'Brasil');
        setNaoResidoBrasilComercial(userData.pais_comercial && userData.pais_comercial !== 'Brasil');
        // Por padrão, o checkbox "Não possuo CPF" deve estar desmarcado
        // O usuário deve marcar explicitamente se for estrangeiro
        setNaoPossuiCpf(false);
        // Definir código do país do telefone baseado no país residencial ou comercial
        const paisParaTelefone = userData.pais_residencial || userData.pais_comercial || 'Brasil';
        setCodigoPaisTelefone(CODIGOS_PAIS[paisParaTelefone] || '+55');
        
        // Verificar se o email está validado
        setEmailValidado(userData.email_validado === true);
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
        pais_residencial: prev.pais_comercial,
        // complemento_residencial não é copiado
      }));
      setCepResidencialBuscado(cepComercialBuscado);
      setNaoResidoBrasilResidencial(naoResidoBrasilComercial);
    } else {
      // Limpar campos residenciais quando desmarcar
      setDados(prev => ({
        ...prev,
        cep_residencial: '',
        endereco_residencial: '',
        numero_residencial: '',
        cidade_residencial: '',
        estado_residencial: '',
        pais_residencial: 'Brasil',
        // complemento_residencial não é limpo
      }));
      setCepResidencialBuscado(false);
      setNaoResidoBrasilResidencial(false);
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

  // Função para verificar se há campos obrigatórios vazios
  const verificarCamposObrigatoriosVazios = (): string[] => {
    const camposVazios: string[] = [];
    
    if (!emailValidado) {
      return camposVazios; // Se email não está validado, não há campos obrigatórios
    }
    
    if (!dados.nome.trim()) camposVazios.push('Nome');
    if (!dados.sobrenome.trim()) camposVazios.push('Sobrenome');
    if (!dados.telefone.trim()) camposVazios.push('Telefone');
    if (!naoPossuiCpf && !dados.cpf.trim()) camposVazios.push('CPF');
    if (!dados.data_nascimento) camposVazios.push('Data de Nascimento');
    if (!dados.genero) camposVazios.push('Gênero');
    if (!dados.nome_estabelecimento.trim()) camposVazios.push('Nome do Estabelecimento');
    
    // Validar endereço comercial
    if (!naoResidoBrasilComercial) {
      if (!dados.cep_comercial.trim()) camposVazios.push('CEP Comercial');
      if (!dados.endereco_comercial.trim()) camposVazios.push('Endereço Comercial');
      if (!dados.numero_comercial.trim()) camposVazios.push('Número Comercial');
      if (!dados.cidade_comercial.trim()) camposVazios.push('Cidade Comercial');
      if (!dados.estado_comercial.trim()) camposVazios.push('Estado Comercial');
    }
    
    // Validar endereço residencial
    if (!naoResidoBrasilResidencial && !mesmoEndereco) {
      if (!dados.cep_residencial.trim()) camposVazios.push('CEP Residencial');
      if (!dados.endereco_residencial.trim()) camposVazios.push('Endereço Residencial');
      if (!dados.numero_residencial.trim()) camposVazios.push('Número Residencial');
      if (!dados.cidade_residencial.trim()) camposVazios.push('Cidade Residencial');
      if (!dados.estado_residencial.trim()) camposVazios.push('Estado Residencial');
    }
    
    return camposVazios;
  };

  // Interceptar o fechamento do modal
  const handleClose = async () => {
    if (!emailValidado) {
      onClose();
      return;
    }
    
    const camposVazios = verificarCamposObrigatoriosVazios();
    if (camposVazios.length > 0) {
      const camposLista = camposVazios.join(', ');
      await mostrarAlert(
        'Atenção - Cadastro Incompleto',
        `Você possui campos obrigatórios não preenchidos:\n\n${camposLista}\n\nÉ necessário preencher todos os campos obrigatórios para continuar usando o sistema.`
      );
      // Não fechar o modal - apenas mostrar o aviso
      return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se o email estiver validado, validar campos obrigatórios
    if (emailValidado) {
      if (!dados.nome.trim()) {
        await mostrarAlert('Erro', 'O nome é obrigatório quando o email está validado.');
        return;
      }
      if (!dados.sobrenome.trim()) {
        await mostrarAlert('Erro', 'O sobrenome é obrigatório quando o email está validado.');
        return;
      }
      if (!dados.telefone.trim()) {
        await mostrarAlert('Erro', 'O telefone é obrigatório quando o email está validado.');
        return;
      }
      if (!naoPossuiCpf && !dados.cpf.trim()) {
        await mostrarAlert('Erro', 'O CPF é obrigatório quando o email está validado (ou marque "Não possuo CPF").');
        return;
      }
      if (!dados.data_nascimento) {
        await mostrarAlert('Erro', 'A data de nascimento é obrigatória quando o email está validado.');
        return;
      }
      if (!dados.genero) {
        await mostrarAlert('Erro', 'O gênero é obrigatório quando o email está validado.');
        return;
      }
      if (!dados.nome_estabelecimento.trim()) {
        await mostrarAlert('Erro', 'O nome do estabelecimento é obrigatório quando o email está validado.');
        return;
      }
      
      // Validar endereço comercial
      if (!naoResidoBrasilComercial) {
        if (!dados.cep_comercial.trim()) {
          await mostrarAlert('Erro', 'O CEP comercial é obrigatório quando o email está validado.');
          return;
        }
        if (!dados.endereco_comercial.trim()) {
          await mostrarAlert('Erro', 'O endereço comercial é obrigatório quando o email está validado.');
          return;
        }
        if (!dados.numero_comercial.trim()) {
          await mostrarAlert('Erro', 'O número comercial é obrigatório quando o email está validado.');
          return;
        }
        if (!dados.cidade_comercial.trim()) {
          await mostrarAlert('Erro', 'A cidade comercial é obrigatória quando o email está validado.');
          return;
        }
        if (!dados.estado_comercial.trim()) {
          await mostrarAlert('Erro', 'O estado comercial é obrigatório quando o email está validado.');
          return;
        }
      }
      
      // Validar endereço residencial
      if (!naoResidoBrasilResidencial) {
        if (!dados.cep_residencial.trim()) {
          await mostrarAlert('Erro', 'O CEP residencial é obrigatório quando o email está validado.');
          return;
        }
        if (!dados.endereco_residencial.trim()) {
          await mostrarAlert('Erro', 'O endereço residencial é obrigatório quando o email está validado.');
          return;
        }
        if (!dados.numero_residencial.trim()) {
          await mostrarAlert('Erro', 'O número residencial é obrigatório quando o email está validado.');
          return;
        }
        if (!dados.cidade_residencial.trim()) {
          await mostrarAlert('Erro', 'A cidade residencial é obrigatória quando o email está validado.');
          return;
        }
        if (!dados.estado_residencial.trim()) {
          await mostrarAlert('Erro', 'O estado residencial é obrigatório quando o email está validado.');
          return;
        }
      }
    }
    
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
      // Incluir mesmoEndereco e nao_possui_cpf nos dados para o backend validar corretamente
      const dadosParaEnviar = {
        ...dados,
        mesmo_endereco: mesmoEndereco,
        nao_possui_cpf: naoPossuiCpf
      };
      await apiService.atualizarDadosUsuario(dadosParaEnviar);
      await mostrarAlert('Sucesso', 'Dados atualizados com sucesso!');
      onClose();
    } catch (error: any) {
      console.error('Erro ao atualizar dados:', error);
      let mensagemErro = 'Erro ao atualizar dados. Tente novamente.';
      
      if (error.response?.data?.error) {
        mensagemErro = error.response.data.error;
      } else if (error.message) {
        mensagemErro = error.message;
      }
      
      await mostrarAlert('Erro ao Salvar', mensagemErro);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Alterar Dados"
      size="large"
      footer={
        <>
          <button onClick={handleClose} className="btn-secondary" disabled={loading}>
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
          {emailValidado && (
            <div className="aviso-obrigatorio">
              <FaExclamationTriangle className="aviso-icon" />
              <div>
                <strong>Campos Obrigatórios</strong>
                <p>Como seu email está validado, é necessário preencher todos os campos marcados com <span className="required">*</span> para continuar usando o sistema.</p>
              </div>
            </div>
          )}
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
                <label htmlFor="nome">Nome {emailValidado && <span className="required">*</span>}:</label>
                <input
                  id="nome"
                  type="text"
                  className={`form-input ${emailValidado ? 'required-field' : ''}`}
                  value={dados.nome || ''}
                  onChange={(e) => setDados(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Digite seu nome"
                  disabled={loading}
                  required={emailValidado}
                />
              </div>
              <div className="form-group">
                <label htmlFor="sobrenome">Sobrenome {emailValidado && <span className="required">*</span>}:</label>
                <input
                  id="sobrenome"
                  type="text"
                  className={`form-input ${emailValidado ? 'required-field' : ''}`}
                  value={dados.sobrenome || ''}
                  onChange={(e) => setDados(prev => ({ ...prev, sobrenome: e.target.value }))}
                  placeholder="Digite seu sobrenome"
                  disabled={loading}
                  required={emailValidado}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefone">Telefone {emailValidado && <span className="required">*</span>}:</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    value={codigoPaisTelefone || '+55'}
                    onChange={(e) => setCodigoPaisTelefone(e.target.value || '+55')}
                    disabled={loading}
                    style={{ width: '100px', flexShrink: 0 }}
                  >
                    {Object.entries(CODIGOS_PAIS).map(([pais, codigo]) => (
                      <option key={pais} value={codigo}>{codigo}</option>
                    ))}
                  </select>
                  <input
                    id="telefone"
                    type="text"
                    className="form-input"
                    value={dados.telefone || ''}
                    onChange={(e) => setDados(prev => ({ ...prev, telefone: formatarTelefone(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                    disabled={loading}
                    style={{ flex: 1 }}
                    required={emailValidado}
                  />
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="cpf">CPF {emailValidado && !naoPossuiCpf && <span className="required">*</span>}:</label>
                <input
                  id="cpf"
                  type="text"
                  className="form-input"
                  value={dados.cpf || ''}
                  onChange={(e) => setDados(prev => ({ ...prev, cpf: formatarCpf(e.target.value) }))}
                  placeholder="000.000.000-00"
                  disabled={loading || naoPossuiCpf}
                  required={emailValidado && !naoPossuiCpf}
                />
                <div className="form-group checkbox-group" style={{ marginTop: '10px' }}>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={naoPossuiCpf}
                      onChange={(e) => {
                        setNaoPossuiCpf(e.target.checked);
                        if (e.target.checked) {
                          setDados(prev => ({ ...prev, cpf: '' }));
                        }
                      }}
                      disabled={loading}
                    />
                    <span>Sou estrangeiro e não possuo CPF</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="data-nascimento">Data de Nascimento {emailValidado && <span className="required">*</span>}:</label>
                <DatePicker
                  id="data-nascimento"
                  value={dados.data_nascimento || ''}
                  onChange={(value) => setDados(prev => ({ ...prev, data_nascimento: value || '' }))}
                  max={new Date().toISOString().split('T')[0]}
                  disabled={loading}
                  className={`date-input ${emailValidado ? 'required-field' : ''}`}
                  required={emailValidado}
                />
              </div>
              <div className="form-group">
                <label htmlFor="genero">Gênero {emailValidado && <span className="required">*</span>}:</label>
                <select
                  id="genero"
                  className={`form-input ${emailValidado ? 'required-field' : ''}`}
                  value={dados.genero || ''}
                  onChange={(e) => setDados(prev => ({ ...prev, genero: e.target.value }))}
                  disabled={loading}
                  required={emailValidado}
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
              <label htmlFor="nome-estabelecimento">Nome do Estabelecimento {emailValidado && <span className="required">*</span>}:</label>
              <input
                id="nome-estabelecimento"
                type="text"
                className={`form-input ${emailValidado ? 'required-field' : ''}`}
                value={dados.nome_estabelecimento || ''}
                onChange={(e) => setDados(prev => ({ ...prev, nome_estabelecimento: e.target.value }))}
                placeholder="Digite o nome do estabelecimento"
                disabled={loading}
                required={emailValidado}
              />
            </div>
          </div>

          {/* Endereço Comercial */}
          <div className="form-section">
            <h3>Endereço Comercial {emailValidado && !naoResidoBrasilComercial && <span className="required">*</span>}</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cep-comercial">CEP {emailValidado && !naoResidoBrasilComercial && <span className="required">*</span>}:</label>
                <input
                  id="cep-comercial"
                  type="text"
                  className={`form-input ${emailValidado && !naoResidoBrasilComercial ? 'required-field' : ''}`}
                  value={dados.cep_comercial || ''}
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
                  disabled={loading || naoResidoBrasilComercial}
                  required={emailValidado && !naoResidoBrasilComercial}
                />
                {buscandoCepComercial && <FaSpinner className="spinner-inline" />}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="endereco-comercial">Endereço {emailValidado && !naoResidoBrasilComercial && <span className="required">*</span>}:</label>
              <input
                id="endereco-comercial"
                type="text"
                className={`form-input ${emailValidado && !naoResidoBrasilComercial ? 'required-field' : ''}`}
                value={dados.endereco_comercial || ''}
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
                disabled={loading || naoResidoBrasilComercial}
                required={emailValidado && !naoResidoBrasilComercial}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="numero-comercial">
                  Número {(cepComercialBuscado || (emailValidado && !naoResidoBrasilComercial)) && <span className="required">*</span>}:
                </label>
                <input
                  id="numero-comercial"
                  type="text"
                  className={`form-input ${(cepComercialBuscado || (emailValidado && !naoResidoBrasilComercial)) ? 'required-field' : ''}`}
                  value={dados.numero_comercial || ''}
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
                  disabled={loading || naoResidoBrasilComercial}
                  required={cepComercialBuscado || (emailValidado && !naoResidoBrasilComercial)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="complemento-comercial">Complemento:</label>
                <input
                  id="complemento-comercial"
                  type="text"
                  className="form-input"
                  value={dados.complemento_comercial || ''}
                  onChange={(e) => setDados(prev => ({ ...prev, complemento_comercial: e.target.value }))}
                  placeholder="Apto, Bloco, etc."
                  disabled={loading || naoResidoBrasilComercial}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cidade-comercial">Cidade {emailValidado && !naoResidoBrasilComercial && <span className="required">*</span>}:</label>
                <input
                  id="cidade-comercial"
                  type="text"
                  className={`form-input ${emailValidado && !naoResidoBrasilComercial ? 'required-field' : ''}`}
                  value={dados.cidade_comercial || ''}
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
                  disabled={loading || naoResidoBrasilComercial}
                  required={emailValidado && !naoResidoBrasilComercial}
                />
              </div>
              <div className="form-group">
                <label htmlFor="estado-comercial">Estado {emailValidado && !naoResidoBrasilComercial && <span className="required">*</span>}:</label>
                <input
                  id="estado-comercial"
                  type="text"
                  className={`form-input ${emailValidado && !naoResidoBrasilComercial ? 'required-field' : ''}`}
                  value={garantirString(dados.estado_comercial)}
                  onChange={(e) => {
                    const novoValor = (e.target.value || '').toUpperCase();
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
                  disabled={loading || naoResidoBrasilComercial}
                  required={emailValidado && !naoResidoBrasilComercial}
                />
              </div>
            </div>
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={naoResidoBrasilComercial || false}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setNaoResidoBrasilComercial(checked);
                    if (!checked) {
                      setDados(prev => ({ ...prev, pais_comercial: 'Brasil' }));
                      if (mesmoEndereco) {
                        setDados(prev => ({ ...prev, pais_residencial: 'Brasil' }));
                        setNaoResidoBrasilResidencial(false);
                      }
                    } else {
                      // Garantir que o país comercial tenha um valor quando o checkbox é marcado
                      setDados(prev => {
                        const paisAtual = prev.pais_comercial || 'Brasil';
                        return { ...prev, pais_comercial: paisAtual };
                      });
                    }
                  }}
                  disabled={loading}
                />
                <span>Minha empresa não é no Brasil</span>
              </label>
            </div>
            {naoResidoBrasilComercial && dados.pais_comercial && (
              <div className="form-group">
                <label htmlFor="pais-comercial">País:</label>
                <select
                  id="pais-comercial"
                  className="form-input"
                  value={dados.pais_comercial}
                  onChange={(e) => {
                    const novoValor = e.target.value || 'Brasil';
                    setDados(prev => {
                      const novosDados = { ...prev, pais_comercial: novoValor };
                      if (mesmoEndereco) {
                        novosDados.pais_residencial = novoValor;
                        setNaoResidoBrasilResidencial(novoValor !== 'Brasil');
                      }
                      // Atualizar código do país do telefone
                      setCodigoPaisTelefone(CODIGOS_PAIS[novoValor] || '+55');
                      return novosDados;
                    });
                  }}
                  disabled={loading}
                >
                  {PAISES.map(pais => (
                    <option key={pais} value={pais}>{pais}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Endereço Residencial */}
          <div className="form-section">
            <h3>Endereço Residencial {emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial && <span className="required">*</span>}</h3>
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
                <label htmlFor="cep-residencial">CEP {emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial && <span className="required">*</span>}:</label>
                <input
                  id="cep-residencial"
                  type="text"
                  className={`form-input ${emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial ? 'required-field' : ''}`}
                  value={dados.cep_residencial || ''}
                  onChange={(e) => setDados(prev => ({ ...prev, cep_residencial: formatarCep(e.target.value) }))}
                  onBlur={handleCepResidencialBlur}
                  placeholder="00000-000"
                  disabled={loading || mesmoEndereco || naoResidoBrasilResidencial}
                  required={emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial}
                />
                {buscandoCepResidencial && <FaSpinner className="spinner-inline" />}
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="endereco-residencial">Endereço {emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial && <span className="required">*</span>}:</label>
              <input
                id="endereco-residencial"
                type="text"
                className={`form-input ${emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial ? 'required-field' : ''}`}
                value={dados.endereco_residencial || ''}
                onChange={(e) => setDados(prev => ({ ...prev, endereco_residencial: e.target.value }))}
                placeholder="Rua, Avenida, etc."
                disabled={loading || mesmoEndereco || naoResidoBrasilResidencial}
                required={emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="numero-residencial">
                  Número {(cepResidencialBuscado || (emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial)) && <span className="required">*</span>}:
                </label>
                <input
                  id="numero-residencial"
                  type="text"
                  className={`form-input ${(cepResidencialBuscado || (emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial)) ? 'required-field' : ''}`}
                  value={dados.numero_residencial || ''}
                  onChange={(e) => setDados(prev => ({ ...prev, numero_residencial: e.target.value }))}
                  placeholder="Número"
                  disabled={loading || mesmoEndereco || naoResidoBrasilResidencial}
                  required={cepResidencialBuscado || (emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="complemento-residencial">Complemento:</label>
                <input
                  id="complemento-residencial"
                  type="text"
                  className="form-input"
                  value={dados.complemento_residencial || ''}
                  onChange={(e) => setDados(prev => ({ ...prev, complemento_residencial: e.target.value }))}
                  placeholder="Apto, Bloco, etc."
                  disabled={loading || naoResidoBrasilResidencial}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cidade-residencial">Cidade {emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial && <span className="required">*</span>}:</label>
                <input
                  id="cidade-residencial"
                  type="text"
                  className={`form-input ${emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial ? 'required-field' : ''}`}
                  value={dados.cidade_residencial || ''}
                  onChange={(e) => setDados(prev => ({ ...prev, cidade_residencial: e.target.value }))}
                  placeholder="Cidade"
                  disabled={loading || mesmoEndereco || naoResidoBrasilResidencial}
                  required={emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial}
                />
              </div>
              <div className="form-group">
                <label htmlFor="estado-residencial">Estado {emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial && <span className="required">*</span>}:</label>
                <input
                  id="estado-residencial"
                  type="text"
                  className={`form-input ${emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial ? 'required-field' : ''}`}
                  value={dados.estado_residencial || ''}
                  onChange={(e) => setDados(prev => ({ ...prev, estado_residencial: e.target.value.toUpperCase() }))}
                  placeholder="UF"
                  maxLength={2}
                  disabled={loading || mesmoEndereco || naoResidoBrasilResidencial}
                  required={emailValidado && !mesmoEndereco && !naoResidoBrasilResidencial}
                />
              </div>
            </div>
            {!mesmoEndereco && (
              <>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={naoResidoBrasilResidencial || false}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setNaoResidoBrasilResidencial(checked);
                        if (!checked) {
                          setDados(prev => ({ ...prev, pais_residencial: 'Brasil' }));
                        } else {
                          // Garantir que o país residencial tenha um valor quando o checkbox é marcado
                          setDados(prev => {
                            const paisAtual = prev.pais_residencial || 'Brasil';
                            return { ...prev, pais_residencial: paisAtual };
                          });
                        }
                      }}
                      disabled={loading}
                    />
                    <span>Não resido no Brasil</span>
                  </label>
                </div>
                {naoResidoBrasilResidencial && dados.pais_residencial && (
                  <div className="form-group">
                    <label htmlFor="pais-residencial">País:</label>
                    <select
                      id="pais-residencial"
                      className="form-input"
                      value={dados.pais_residencial}
                      onChange={(e) => {
                        const novoValor = e.target.value || 'Brasil';
                        setDados(prev => ({ ...prev, pais_residencial: novoValor }));
                        // Atualizar código do país do telefone
                        setCodigoPaisTelefone(CODIGOS_PAIS[novoValor] || '+55');
                      }}
                      disabled={loading}
                    >
                      {PAISES.map(pais => (
                        <option key={pais} value={pais}>{pais}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        </form>
      )}
    </Modal>
  );
};

export default AlterarDadosModal;

