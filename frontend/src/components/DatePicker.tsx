import { useState, useRef, useEffect } from 'react';
import { FaCalendar, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './DatePicker.css';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  max?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  required?: boolean;
}

const DatePicker = ({ value, onChange, max, disabled, id, className = '' }: DatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  // Parsear data inicial sem conversão de fuso horário
  const getInitialDate = (val: string | undefined): Date | null => {
    if (!val) return null;
    const [year, month, day] = val.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
    return null;
  };
  const [selectedDate, setSelectedDate] = useState<Date | null>(getInitialDate(value));
  const pickerRef = useRef<HTMLDivElement>(null);

  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  useEffect(() => {
    if (value) {
      // Parsear a data sem conversão de fuso horário (YYYY-MM-DD)
      const [year, month, day] = value.split('-').map(Number);
      if (year && month && day) {
        const date = new Date(year, month - 1, day);
        if (!isNaN(date.getTime())) {
          setSelectedDate(date);
          setCurrentMonth(date);
        }
      }
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Adicionar dias vazios do início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Adicionar dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const handleDateClick = (day: number) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const newDate = new Date(year, month, day);
    setSelectedDate(newDate);
    // Formatar data manualmente sem conversão de fuso horário (YYYY-MM-DD)
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();
    
    // Verificar se hoje é maior que max (comparar apenas datas, sem fuso horário)
    if (max) {
      const [maxYear, maxMonth, maxDay] = max.split('-').map(Number);
      if (year > maxYear || (year === maxYear && month + 1 > maxMonth) || 
          (year === maxYear && month + 1 === maxMonth && day > maxDay)) {
        return; // Não permitir selecionar hoje se for maior que max
      }
    }
    
    const todayDate = new Date(year, month, day);
    setSelectedDate(todayDate);
    setCurrentMonth(todayDate);
    // Formatar data manualmente sem conversão de fuso horário (YYYY-MM-DD)
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onChange(formattedDate);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSelectedDate(null);
    onChange('');
    setIsOpen(false);
  };

  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isDateDisabled = (day: number) => {
    if (!max) return false;
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    // Comparar apenas as datas (sem hora/fuso horário)
    const [maxYear, maxMonth, maxDay] = max.split('-').map(Number);
    // Comparar ano, mês e dia separadamente
    if (year > maxYear) return true;
    if (year < maxYear) return false;
    if (month + 1 > maxMonth) return true;
    if (month + 1 < maxMonth) return false;
    return day > maxDay;
  };

  const isToday = (day: number) => {
    const today = new Date();
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const days = getDaysInMonth(currentMonth);
  const displayValue = formatDisplayDate(selectedDate);
  const [inputValue, setInputValue] = useState(displayValue);

  // Sincronizar inputValue quando displayValue mudar (quando selecionar pelo calendário)
  useEffect(() => {
    setInputValue(displayValue);
  }, [displayValue]);

  // Função para validar e formatar data digitada (DD/MM/AAAA)
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Remover tudo que não for número
    const numbers = value.replace(/\D/g, '');

    // Limitar a 8 dígitos
    if (numbers.length > 8) return;

    // Formatar como DD/MM/AAAA enquanto digita
    let formatted = numbers;
    if (numbers.length > 2) {
      formatted = `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    }
    if (numbers.length > 4) {
      formatted = `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`;
    }

    setInputValue(formatted);

    // Se tiver 10 caracteres (DD/MM/AAAA completo), validar e converter
    if (numbers.length === 8) {
      const day = parseInt(numbers.slice(0, 2), 10);
      const month = parseInt(numbers.slice(2, 4), 10);
      const year = parseInt(numbers.slice(4, 8), 10);

      // Validar data
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
        const date = new Date(year, month - 1, day);
        
        // Verificar se a data é válida (ex: não permite 31/02)
        if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
          // Verificar se não excede max
          if (max) {
            const [maxYear, maxMonth, maxDay] = max.split('-').map(Number);
            if (year > maxYear || (year === maxYear && month > maxMonth) || 
                (year === maxYear && month === maxMonth && day > maxDay)) {
              return; // Data maior que max, não atualizar
            }
          }

          setSelectedDate(date);
          setCurrentMonth(date);
          // Converter para YYYY-MM-DD
          const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          onChange(formattedDate);
        }
      }
    }
  };

  const handleInputBlur = () => {
    // Se o valor digitado não for válido, restaurar o valor anterior
    if (inputValue && inputValue.length === 10) {
      const numbers = inputValue.replace(/\D/g, '');
      if (numbers.length !== 8) {
        setInputValue(displayValue);
      }
    } else if (inputValue && inputValue.length > 0 && inputValue.length < 10) {
      // Se não completou a data, restaurar
      setInputValue(displayValue);
    }
  };

  return (
    <div className={`date-picker-wrapper ${className}`} ref={pickerRef}>
      <div className="date-picker-input-container">
        <input
          id={id}
          type="text"
          className="form-input date-picker-input"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          placeholder="DD/MM/AAAA"
          maxLength={10}
        />
        <button
          type="button"
          className="date-picker-icon-button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
        >
          <FaCalendar />
        </button>
      </div>

      {isOpen && !disabled && (
        <div className="date-picker-popup">
          <div className="date-picker-header">
            <button
              type="button"
              className="date-picker-nav-button"
              onClick={handlePrevMonth}
              aria-label="Mês anterior"
            >
              <FaChevronLeft />
            </button>
            <div className="date-picker-month-year">
              {meses[currentMonth.getMonth()]} de {currentMonth.getFullYear()}
            </div>
            <button
              type="button"
              className="date-picker-nav-button"
              onClick={handleNextMonth}
              aria-label="Próximo mês"
            >
              <FaChevronRight />
            </button>
          </div>

          <div className="date-picker-weekdays">
            {diasSemana.map((dia) => (
              <div key={dia} className="date-picker-weekday">
                {dia}
              </div>
            ))}
          </div>

          <div className="date-picker-days">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="date-picker-day empty" />;
              }

              const disabled = isDateDisabled(day);
              const today = isToday(day);
              const selected = isSelected(day);

              return (
                <button
                  key={day}
                  type="button"
                  className={`date-picker-day ${today ? 'today' : ''} ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                  onClick={() => !disabled && handleDateClick(day)}
                  disabled={disabled}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="date-picker-footer">
            <button
              type="button"
              className="date-picker-footer-button"
              onClick={handleClear}
            >
              Limpar
            </button>
            <button
              type="button"
              className="date-picker-footer-button primary"
              onClick={handleToday}
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;

