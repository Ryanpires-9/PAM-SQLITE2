import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const ToastContext = createContext({});

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info' // 'success' | 'error' | 'info' | 'warning'
  });

  const timerRef = useRef(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  const showToast = useCallback((arg1, arg2, arg3) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    let message = '';
    let type = 'info';
    let title = '';
    let duration = 3200;

    if (typeof arg1 === 'object' && arg1 !== null) {
      message = arg1.message || '';
      type = arg1.type || 'info';
      title = arg1.title || '';
      if (arg1.duration) duration = arg1.duration;
    } else {
      message = String(arg1 || '');
      type = arg2 || 'info';
      title = arg3 || '';
    }

    // Título padrão inteligente se não for informado
    if (!title) {
      if (type === 'error') title = 'Atenção';
      else if (type === 'success') title = 'Sucesso!';
      else if (type === 'warning') title = 'Aviso';
      else title = 'Informação';
    }

    setToast({
      visible: true,
      title,
      message,
      type
    });

    timerRef.current = setTimeout(() => {
      hideToast();
    }, duration);
  }, [hideToast]);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de um ToastProvider');
  }
  return context;
}

