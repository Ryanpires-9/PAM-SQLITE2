import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import AnimatedPressable from '../components/AnimatedPressable';
import UserSettingsModal from './UserSettingsModal';

export default function ProfileScreen({
  onNavigateToOrders,
  onOpenAdminPanel,
  onNavigateToSettings,
  onNavigateToHelp,
  initialOpenAuth = false,
  onAuthModalClose
}) {
  const { user, isAdmin, login, register, logout, serverUrl, updateServerUrl, checkServerHealth } = useAuth();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  // Modal de Configurações de Usuário (Trocar Nome, E-mail e Senha)
  const [userSettingsModalVisible, setUserSettingsModalVisible] = useState(false);

  // Modal de Autenticação (Login / Cadastro)
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [formNome, setFormNome] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formSenha, setFormSenha] = useState('');
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [showAuthSenha, setShowAuthSenha] = useState(false);

  // Dispara a abertura automática do modal de autenticação caso venha da tela de pedidos
  React.useEffect(() => {
    if (initialOpenAuth && !user) {
      setAuthModalVisible(true);
    }
  }, [initialOpenAuth, user]);

  // Modal de Configuração de Rede
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [testingConnection, setTestingConnection] = useState(false);

  const handleAuth = async () => {
    if (!formEmail.trim() || !formSenha.trim()) {
      showToast('Preencha seu e-mail e sua senha de acesso.', 'error', 'Campos Obrigatórios');
      return;
    }

    setLoadingAuth(true);
    try {
      if (isRegister) {
        if (!formNome.trim()) {
          showToast('Informe seu nome completo para o cadastro.', 'error', 'Nome Obrigatório');
          setLoadingAuth(false);
          return;
        }
        const res = await register(formNome.trim(), formEmail.trim(), formSenha);
        if (res.success) {
          showToast('Sua conta foi cadastrada com sucesso!', 'success', 'Conta Criada');
          setAuthModalVisible(false);
          if (onAuthModalClose) onAuthModalClose();
          setFormNome('');
          setFormEmail('');
          setFormSenha('');
        } else {
          if (res.erro && res.erro.toLowerCase().includes('já')) {
            showToast('Já existe uma conta com este e-mail. Faça login.', 'error', 'E-mail Já Cadastrado');
          } else {
            showToast(res.erro || 'Erro ao realizar o cadastro.', 'error', 'Erro no Cadastro');
          }
        }
      } else {
        const res = await login(formEmail.trim(), formSenha);
        if (res.success) {
          showToast(
            res.usuario.tipo === 'admin'
              ? `Olá Administrador ${res.usuario.nome}! Painel liberado.`
              : `Olá ${res.usuario.nome}! Boas compras.`,
            'success',
            'Bem-vindo!'
          );
          setAuthModalVisible(false);
          if (onAuthModalClose) onAuthModalClose();
          setFormEmail('');
          setFormSenha('');
        } else {
          showToast(res.erro || 'E-mail ou senha incorretos.', 'error', 'Falha no Login');
        }
      }
    } finally {
      setLoadingAuth(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Desconectar da Conta',
      'Deseja realmente sair da sua conta e retornar ao modo visitante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Desconectar',
          style: 'destructive',
          onPress: () => {
            logout();
            showToast('Você agora está navegando como visitante.', 'info', 'Desconectado');
          }
        }
      ]
    );
  };

  const handleSalvarRede = async () => {
    setTestingConnection(true);
    updateServerUrl(inputUrl);
    const ok = await checkServerHealth();
    setTestingConnection(false);
    if (ok) {
      Alert.alert('Conexão Estabelecida', 'Servidor Express conectado com sucesso.');
      setConfigModalVisible(false);
    } else {
      Alert.alert('Falha na Conexão', 'Não foi possível conectar ao IP informado.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Card do Usuário Conectado */}
      <View style={[styles.profileHeaderCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={[styles.avatarWrap, { backgroundColor: colors.accent }]}>
          <Ionicons name={isAdmin ? 'shield-checkmark' : 'person'} size={32} color="#ffffff" />
        </View>

        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={[styles.profileName, { color: colors.text }]}>
            {user ? user.nome : 'Visitante'}
          </Text>
          <Text style={[styles.profileEmail, { color: colors.textMuted }]}>
            {user ? user.email : 'Nenhuma conta conectada'}
          </Text>

          {/* Badge Oficial da Função (Identificado no SQLite) */}
          <View
            style={[
              styles.roleBadge,
              isAdmin
                ? { backgroundColor: 'rgba(124, 58, 237, 0.15)', borderColor: '#8b5cf6' }
                : { backgroundColor: colors.accentLight, borderColor: colors.accent }
            ]}
          >
            <Ionicons
              name={isAdmin ? 'shield-checkmark' : 'person'}
              size={11}
              color={isAdmin ? '#a78bfa' : colors.accent}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.roleBadgeText,
                { color: isAdmin ? '#a78bfa' : colors.accent }
              ]}
            >
              {isAdmin ? 'ADMINISTRADOR' : 'CLIENTE'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {user ? (
            <TouchableOpacity
              style={[styles.btnActionTop, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btnActionTop, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
              onPress={() => setAuthModalVisible(true)}
            >
              <Ionicons name="log-in-outline" size={18} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ÁREA EXCLUSIVA DE ADMINISTRADOR (Aparece automaticamente se o SQLite confirmar que é admin!) */}
      {isAdmin && (
        <View style={[styles.adminBanner, { borderColor: '#8b5cf6', backgroundColor: isDark ? '#161c2e' : '#f5f3ff' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={styles.adminIconBox}>
              <Ionicons name="speedometer" size={20} color="#ffffff" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.adminBannerTitle, { color: colors.text }]}>
                Painel de Controle do Lojista
              </Text>
              <Text style={[styles.adminBannerSub, { color: colors.textMuted }]}>
                Você possui privilégios de Administrador no banco de dados
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.btnOpenAdminPortal}
            onPress={onOpenAdminPanel}
            activeOpacity={0.85}
          >
            <Ionicons name="settings-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
            <Text style={styles.btnOpenAdminPortalText}>Acessar Gestão da Loja</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Seção de Preferências da Conta */}
      <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Text style={[styles.menuSectionTitle, { color: colors.text }]}>Minha Conta & Preferências</Text>

        {/* Meus Pedidos */}
        <AnimatedPressable
          style={[styles.menuRow, { borderColor: colors.cardBorder }]}
          onPress={onNavigateToOrders}
        >
          <View style={[styles.menuIconBox, { backgroundColor: colors.accentLight }]}>
            <Ionicons name="receipt-outline" size={20} color={colors.accent} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Meus Pedidos</Text>
            <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>Histórico e status de entrega</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </AnimatedPressable>

        {/* Configurações de Usuário (Alterar Nome, E-mail e Senha) */}
        <AnimatedPressable
          style={[styles.menuRow, { borderColor: colors.cardBorder }]}
          onPress={() => {
            if (user) {
              setUserSettingsModalVisible(true);
            } else {
              setAuthModalVisible(true);
            }
          }}
        >
          <View style={[styles.menuIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
            <Ionicons name="person-circle-outline" size={20} color="#0284c7" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Configurações de Usuário</Text>
            <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
              {user ? 'Alterar nome, e-mail e senha' : 'Entre para personalizar sua conta'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </AnimatedPressable>

        {/* Configurar IP do Servidor */}
        <AnimatedPressable
          style={[styles.menuRow, { borderColor: colors.cardBorder }]}
          onPress={() => setConfigModalVisible(true)}
        >
          <View style={[styles.menuIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
            <Ionicons name="wifi-outline" size={20} color="#8b5cf6" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Conexão & IP da API</Text>
            <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>Ajustar endereço do servidor Express</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </AnimatedPressable>

        {/* Ajuda & Sobre Nós */}
        <AnimatedPressable
          style={[styles.menuRow, { borderColor: user ? colors.cardBorder : 'transparent' }]}
          onPress={onNavigateToHelp}
        >
          <View style={[styles.menuIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="help-circle-outline" size={20} color="#10b981" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={[styles.menuTitle, { color: colors.text }]}>Ajuda & Sobre Nós</Text>
            <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>FAQ, suporte oficial e informações</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </AnimatedPressable>

        {/* Desconectar da Conta */}
        {user && (
          <AnimatedPressable
            style={[styles.menuRow, { borderColor: 'transparent', marginTop: 4 }]}
            onPress={handleLogout}
          >
            <View style={[styles.menuIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.menuTitle, { color: '#ef4444', fontWeight: '800' }]}>
                Desconectar da Conta
              </Text>
              <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
                Sair da sessão e navegar como visitante
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </AnimatedPressable>
        )}
      </View>

      {/* Modal de Autenticação (Login / Cadastro) */}
      <Modal
        visible={authModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAuthModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {isRegister ? 'Criar Nova Conta' : 'Acessar Conta'}
              </Text>
              <TouchableOpacity onPress={() => setAuthModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {isRegister && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Nome Completo</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
                  placeholder="Seu nome"
                  placeholderTextColor={colors.textSubtle}
                  value={formNome}
                  onChangeText={setFormNome}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>E-mail</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor={colors.textSubtle}
                keyboardType="email-address"
                autoCapitalize="none"
                value={formEmail}
                onChangeText={setFormEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Senha</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.cardBorder,
                      paddingRight: 42
                    }
                  ]}
                  placeholder="••••••••"
                  placeholderTextColor={colors.textSubtle}
                  secureTextEntry={!showAuthSenha}
                  value={formSenha}
                  onChangeText={setFormSenha}
                />
                <TouchableOpacity
                  style={styles.btnEye}
                  onPress={() => setShowAuthSenha(!showAuthSenha)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showAuthSenha ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btnSubmit, { backgroundColor: colors.accent }]}
              onPress={handleAuth}
              disabled={loadingAuth}
            >
              {loadingAuth ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnSubmitText}>
                  {isRegister ? 'Cadastrar Usuário' : 'Entrar na Loja'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={{ marginTop: 14, alignItems: 'center' }}
              onPress={() => setIsRegister(!isRegister)}
            >
              <Text style={[styles.toggleAuthText, { color: colors.accent }]}>
                {isRegister ? 'Já possui conta? Fazer Login' : 'Ainda não tem conta? Cadastre-se'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Configuração de Rede */}
      <Modal
        visible={configModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Servidor API</Text>
              <TouchableOpacity onPress={() => setConfigModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: colors.textMuted }]}>URL da API Express:</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
              value={inputUrl}
              onChangeText={setInputUrl}
              autoCapitalize="none"
            />

            <View style={styles.quickIpsRow}>
              <TouchableOpacity
                style={[styles.quickIpChip, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
                onPress={() => setInputUrl('http://192.168.0.12:3000')}
              >
                <Text style={[styles.quickIpText, { color: colors.accent }]}>Wi-Fi (192.168.0.12)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickIpChip, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
                onPress={() => setInputUrl('http://localhost:3000')}
              >
                <Text style={[styles.quickIpText, { color: colors.accent }]}>Localhost</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickIpChip, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
                onPress={() => setInputUrl('http://10.0.2.2:3000')}
              >
                <Text style={[styles.quickIpText, { color: colors.accent }]}>Emulador (10.0.2.2)</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.btnSubmit, { backgroundColor: colors.accent }]}
              onPress={handleSalvarRede}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnSubmitText}>Salvar e Testar Conexão</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Configurações de Usuário (Trocar Nome, E-mail e Senha) */}
      <UserSettingsModal
        visible={userSettingsModalVisible}
        onClose={() => setUserSettingsModalVisible(false)}
        onLogout={handleLogout}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 40
  },
  profileHeaderCard: {
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1
  },
  avatarWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center'
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800'
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginTop: 6
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  btnActionTop: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  adminBanner: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 16
  },
  adminIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center'
  },
  adminBannerTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  adminBannerSub: {
    fontSize: 12,
    marginTop: 2
  },
  btnOpenAdminPortal: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10
  },
  btnOpenAdminPortalText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  menuSection: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1
  },
  menuSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700'
  },
  menuSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  demoCredentialsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 36,
    borderWidth: 1
  },
  demoCredentialsTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 6
  },
  demoCredentialsText: {
    fontSize: 12,
    marginBottom: 10
  },
  credRow: {
    marginVertical: 4
  },
  credLabel: {
    fontSize: 12,
    fontWeight: '700'
  },
  credValue: {
    fontSize: 12,
    marginTop: 2
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    borderRadius: 18,
    padding: 22,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  inputGroup: {
    marginBottom: 12
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    fontSize: 14
  },
  passwordWrap: {
    position: 'relative',
    justifyContent: 'center'
  },
  btnEye: {
    position: 'absolute',
    right: 12,
    top: 10,
    padding: 2
  },
  btnSubmit: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8
  },
  btnSubmitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  toggleAuthText: {
    fontSize: 13,
    fontWeight: '700'
  },
  quickIpsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    marginTop: 8
  },
  quickIpChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1
  },
  quickIpText: {
    fontSize: 11
  }
});
