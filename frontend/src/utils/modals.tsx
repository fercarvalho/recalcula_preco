import { createRoot } from 'react-dom/client';
import React, { useEffect } from 'react';

// Componente de Alert
const AlertModal = ({ title, message, onClose }: { title: string; message: string; onClose: () => void }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="modal show modal-alert" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content modal-small">
        <div className="modal-header">
          <h2>{title}</h2>
          <span className="close-modal" onClick={onClose}>&times;</span>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onClose} className="btn-primary">OK</button>
        </div>
      </div>
    </div>
  );
};

// Componente de Confirm
const ConfirmModal = ({ title, message, onConfirm, onCancel }: { 
  title: string; 
  message: string; 
  onConfirm: () => void; 
  onCancel: () => void;
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="modal show modal-alert" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-content modal-small">
        <div className="modal-header">
          <h2>{title}</h2>
          <span className="close-modal" onClick={onCancel}>&times;</span>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button onClick={onConfirm} className="btn-primary">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

// Componente de Prompt
const PromptModal = ({ 
  title, 
  message, 
  defaultValue, 
  type = 'text',
  onConfirm, 
  onCancel 
}: { 
  title: string; 
  message: string; 
  defaultValue: string;
  type?: 'text' | 'number';
  onConfirm: (value: string) => void; 
  onCancel: () => void;
}) => {
  const [value, setValue] = React.useState(defaultValue);
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    const handleEnter = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onConfirm(value);
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleEnter);
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleEnter);
    };
  }, [value, onConfirm, onCancel]);

  return (
    <div className="modal show modal-alert" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-content modal-small">
        <div className="modal-header">
          <h2>{title}</h2>
          <span className="close-modal" onClick={onCancel}>&times;</span>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          <div className="form-group">
            <input
              ref={inputRef}
              type={type}
              className="form-input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              step={type === 'number' ? '0.01' : undefined}
              min={type === 'number' ? '0' : undefined}
              placeholder=""
            />
          </div>
        </div>
        <div className="modal-footer">
          <button onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button onClick={() => onConfirm(value)} className="btn-primary">OK</button>
        </div>
      </div>
    </div>
  );
};

// Funções utilitárias para mostrar modais
export const mostrarAlert = (title: string, message: string): Promise<void> => {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    
    const onClose = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve();
    };

    root.render(<AlertModal title={title} message={message} onClose={onClose} />);
  });
};

export const mostrarConfirm = (title: string, message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    
    const onConfirm = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve(true);
    };

    const onCancel = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve(false);
    };

    root.render(<ConfirmModal title={title} message={message} onConfirm={onConfirm} onCancel={onCancel} />);
  });
};

export const mostrarPrompt = (title: string, message: string, defaultValue: string = '', type: 'text' | 'number' = 'text'): Promise<string | null> => {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    
    const onConfirm = (value: string) => {
      root.unmount();
      document.body.removeChild(container);
      resolve(value);
    };

    const onCancel = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve(null);
    };

    root.render(
      <PromptModal 
        title={title} 
        message={message} 
        defaultValue={defaultValue}
        type={type}
        onConfirm={onConfirm} 
        onCancel={onCancel} 
      />
    );
  });
};

export const mostrarPromptNumber = (title: string, message: string, defaultValue: string = ''): Promise<string | null> => {
  return mostrarPrompt(title, message, defaultValue, 'number');
};

// Componente de Choice (duas opções)
const ChoiceModal = ({ 
  title, 
  message, 
  option1Label,
  option2Label,
  onOption1, 
  onOption2,
  onCancel 
}: { 
  title: string; 
  message: string; 
  option1Label: string;
  option2Label: string;
  onOption1: () => void; 
  onOption2: () => void;
  onCancel: () => void;
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="modal show modal-alert" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal-content modal-medium">
        <div className="modal-header">
          <h2>{title}</h2>
          <span className="close-modal" onClick={onCancel}>&times;</span>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <button onClick={onCancel} className="btn-secondary">Cancelar</button>
          <button onClick={onOption1} className="btn-secondary" style={{ backgroundColor: '#6c757d' }}>
            {option1Label}
          </button>
          <button onClick={onOption2} className="btn-primary" style={{ backgroundColor: '#dc3545' }}>
            {option2Label}
          </button>
        </div>
      </div>
    </div>
  );
};

export const mostrarChoice = (
  title: string, 
  message: string, 
  option1Label: string,
  option2Label: string
): Promise<'option1' | 'option2' | 'cancel'> => {
  return new Promise((resolve) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    
    const onOption1 = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve('option1');
    };

    const onOption2 = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve('option2');
    };

    const onCancel = () => {
      root.unmount();
      document.body.removeChild(container);
      resolve('cancel');
    };

    root.render(
      <ChoiceModal 
        title={title} 
        message={message} 
        option1Label={option1Label}
        option2Label={option2Label}
        onOption1={onOption1} 
        onOption2={onOption2}
        onCancel={onCancel} 
      />
    );
  });
};

