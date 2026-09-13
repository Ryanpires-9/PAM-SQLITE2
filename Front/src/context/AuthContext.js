import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getBaseUrl, setBaseUrl, setAuthToken } from '../services/api';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  // Usuário autenticado atual (inicia nulo / visitante até que faça login)
  const [user, setUser] = useState(null);

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [serverUrl, setServerUrlState] = useState(getBaseUrl());
  const [serverConnected, setServerConnected] = useState(true);

  // Se o tipo no banco de dados for 'admin', o app automaticamente o reconhece!
  const isAdmin = user?.tipo === 'admin';

  useEffect(() => {
    checkServerHealth();
  }, [serverUrl]);

  const checkServerHealth = async () => {
    try {
      await api.ping();
      setServerConnected(true);
      return true;
    } catch (err) {
      setServerConnected(false);
      return false;
    }
  };

  const updateServerUrl = (newUrl) => {
    const updated = setBaseUrl(newUrl);
    setServerUrlState(updated);
  };

  // Login Unificado (identifica automaticamente se é Cliente ou Admin pelo SQLite)
  const login = async (email, senha) => {
    try {
      const response = await api.login(email, senha);
      if (response.usuario) {
        setUser(response.usuario);
        setAuthToken(response.token);
        return { success: true, usuario: response.usuario };
      }
      return { success: false, erro: 'Resposta inválida do servidor.' };
    } catch (error) {
      return { success: false, erro: error.message };
    }
  };

  // Registro de nova conta
  const register = async (nome, email, senha) => {
    try {
      const response = await api.register(nome, email, senha);
      if (response.usuario) {
        setUser(response.usuario);
        setAuthToken(response.token);
        return { success: true, usuario: response.usuario };
      }
      return { success: false, erro: 'Falha no cadastro.' };
    } catch (error) {
      return { success: false, erro: error.message };
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
  };

  // Atualizar dados de perfil (nome, email, senha) no SQLite
  const updateUserProfileData = async (dados) => {
    try {
      const response = await api.updateProfile(dados);
      if (response.usuario) {
        setUser(response.usuario);
        return { success: true, usuario: response.usuario };
      }
      return { success: false, erro: 'Falha ao atualizar dados.' };
    } catch (error) {
      return { success: false, erro: error.message };
    }
  };

  // Atualiza o perfil do usuário logado caso seu cargo seja alterado
  const refreshUserProfile = (updatedUser) => {
    if (updatedUser && updatedUser.id === user?.id) {
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        hasCompletedOnboarding,
        setHasCompletedOnboarding,
        login,
        register,
        logout,
        updateUserProfileData,
        refreshUserProfile,
        serverUrl,
        updateServerUrl,
        serverConnected,
        checkServerHealth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
