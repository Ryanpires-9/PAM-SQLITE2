import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import AnimatedPressable from '../components/AnimatedPressable';

export default function UserSettingsModal({ visible, onClose, onLogout }) {
  const { user, updateUserProfileData } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setNome(user.nome || '');
      setEmail(user.email || '');
      setSenha('');
      setConfirmarSenha('');
    }
  }, [user, visible]);

  const handleSalvarPerfil = async () => {
    if (!nome.trim() || !email.trim()) {
      showToast('Nome e e-mail não podem ficar vazios.', 'error', 'Campos Obrigatórios');
      return;
    }

    if (senha.trim().length > 0) {
      if (senha.trim().length < 6) {
        showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error', 'Senha Curta');
        return;
      }
      if (senha.trim() !== confirmarSenha.trim()) {
        showToast('A confirmação não confere com a nova senha.', 'error', 'Senhas Diferentes');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        nome: nome.trim(),
        email: email.trim().toLowerCase()
      };
      if (senha.trim().length >= 6) {
        payload.senha = senha.trim();
      }

      const res = await updateUserProfileData(payload);
      if (res.success) {
        showToast('Seus dados cadastrais foram atualizados com sucesso!', 'success', 'Perfil Atualizado');
        setSenha('');
        setConfirmarSenha('');
        onClose();
      } else {
        showToast(res.erro || 'Não foi possível atualizar seus dados.', 'error', 'Erro');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutConfirm = () => {
    Alert.alert(
      'Desconectar da Conta',
      'Deseja realmente sair da sua conta e retornar ao modo visitante?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Sair',
          style: 'destructive',
          onPress: () => {
            onClose();
            if (onLogout) onLogout();
            showToast('Você agora está navegando como visitante.', 'info', 'Desconectado');
          }
        }
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.headerIconBox, { backgroundColor: colors.accentLight }]}>
                <Ionicons name="person-circle-outline" size={22} color={colors.accent} />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Configurações de Usuário</Text>
                <Text style={[styles.modalSub, { color: colors.textMuted }]}>
                  {user ? `ID #${user.id} • ${user.tipo === 'admin' ? 'Administrador' : 'Cliente'}` : 'Visitante'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* SEÇÃO 1: DADOS CADASTRAIS */}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Dados Cadastrais</Text>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Nome Completo</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
                value={nome}
                onChangeText={setNome}
                placeholder="Seu nome"
                placeholderTextColor={colors.textSubtle}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Endereço de E-mail</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
                value={email}
                onChangeText={setEmail}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor={colors.textSubtle}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Nova Senha (deixe vazio para não alterar)
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
                value={senha}
                onChangeText={setSenha}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textSubtle}
                secureTextEntry
              />
            </View>

            {senha.length > 0 && (
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Confirmar Nova Senha</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
                  value={confirmarSenha}
                  onChangeText={setConfirmarSenha}
                  placeholder="Repita a nova senha"
                  placeholderTextColor={colors.textSubtle}
                  secureTextEntry
                />
              </View>
            )}

            <AnimatedPressable
              style={[styles.btnSalvar, { backgroundColor: colors.accent }]}
              onPress={handleSalvarPerfil}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="save-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.btnSalvarText}>Salvar Alterações do Usuário</Text>
                </View>
              )}
            </AnimatedPressable>

            {/* SEÇÃO 2: APARÊNCIA E TEMA */}
            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Aparência do Aplicativo</Text>

            <View style={[styles.themeBox, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.themeLabel, { color: colors.text }]}>
                  {isDark ? 'Modo Escuro (Dark Mode)' : 'Modo Claro (Light Mode)'}
                </Text>
                <Text style={[styles.themeSub, { color: colors.textMuted }]}>
                  Alterne instantaneamente o tema visual
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#cbd5e1', true: colors.accent }}
                thumbColor="#ffffff"
              />
            </View>

            {/* SEÇÃO 3: SOBRE O APP E SUPORTE */}
            <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Desenvolvedor & Suporte</Text>

            <View style={[styles.infoBox, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
              <View style={styles.infoRow}>
                <Ionicons name="business" size={16} color={colors.accent} />
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Criadora:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>Cabryello</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="mail" size={16} color={colors.accent} />
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Suporte Técnico:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>cabryello@gmail.com</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="hardware-chip" size={16} color={colors.accent} />
                <Text style={[styles.infoLabel, { color: colors.textMuted }]}>Versão:</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0 (Expo SDK 57)</Text>
              </View>
            </View>

            {/* SEÇÃO 4: BOTÃO DE DESCONECTAR (LOGOUT) */}
            {user && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.cardBorder }]} />
                <AnimatedPressable
                  style={styles.btnLogout}
                  onPress={handleLogoutConfirm}
                >
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" style={{ marginRight: 8 }} />
                  <Text style={styles.btnLogoutText}>Desconectar da Conta</Text>
                </AnimatedPressable>
              </>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1
  },
  headerIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  modalSub: {
    fontSize: 12,
    marginTop: 1
  },
  closeBtn: {
    padding: 4
  },
  scroll: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12
  },
  fieldGroup: {
    marginBottom: 12
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14
  },
  btnSalvar: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    marginBottom: 10
  },
  btnSalvarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  },
  divider: {
    height: 1,
    marginVertical: 16
  },
  themeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1
  },
  themeLabel: {
    fontSize: 14,
    fontWeight: '700'
  },
  themeSub: {
    fontSize: 12,
    marginTop: 2
  },
  infoBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 12,
    marginLeft: 6,
    marginRight: 6
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '700'
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 12
  },
  btnLogoutText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700'
  }
});

