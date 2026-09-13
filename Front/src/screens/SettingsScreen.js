import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import AnimatedPressable from '../components/AnimatedPressable';

export default function SettingsScreen({ onBack, onNavigateToHelp }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { serverUrl, updateServerUrl, checkServerHealth, serverConnected } = useAuth();

  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [inputUrl, setInputUrl] = useState(serverUrl);
  const [testingConnection, setTestingConnection] = useState(false);

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
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Superior da Tela de Configurações */}
      <View style={[styles.header, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}>
        <AnimatedPressable style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Voltar</Text>
        </AnimatedPressable>

        <Text style={[styles.headerTitle, { color: colors.text }]}>Configurações</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* 1. SEÇÃO DE APARÊNCIA E TEMA */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="color-palette-outline" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Aparência e Tema</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>
                {isDark ? 'Modo Escuro (Dark Mode)' : 'Modo Claro (Light Mode)'}
              </Text>
              <Text style={[styles.settingDesc, { color: colors.textMuted }]}>
                {isDark
                  ? 'Paleta Fluent escura com gradiente azul profundo'
                  : 'Paleta Fluent clara com alto contraste e clareza'}
              </Text>
            </View>

            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#cbd5e1', true: colors.accent }}
              thumbColor={isDark ? '#ffffff' : '#f8fafc'}
            />
          </View>

          <View style={styles.themeBadgeBox}>
            <View
              style={[
                styles.themeColorPill,
                { backgroundColor: colors.bg, borderColor: colors.cardBorder }
              ]}
            >
              <Ionicons
                name={isDark ? 'moon' : 'sunny'}
                size={14}
                color={isDark ? '#fbbf24' : '#6366f1'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.themePillText, { color: colors.text }]}>
                {isDark ? 'Tema Escuro Ativo' : 'Tema Claro Ativo'}
              </Text>
            </View>
          </View>
        </View>

        {/* 2. ESPECIFICAÇÕES TÉCNICAS DO APLICATIVO */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Especificações do Aplicativo</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textMuted }]}>Nome da Loja:</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>MuriloveStore</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textMuted }]}>Versão:</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>1.0.0 (Release 2026.1)</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textMuted }]}>Mobile Framework:</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>React Native 0.86.3 / Expo SDK 57</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textMuted }]}>Banco de Dados:</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>SQLite 3 Local (database.sqlite)</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textMuted }]}>API REST Backend:</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>Node.js Express + SQLite3</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textMuted }]}>Criptografia de Senhas:</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>ScryptSync (Salt de 16-bytes)</Text>
          </View>

          <View style={styles.specRow}>
            <Text style={[styles.specLabel, { color: colors.textMuted }]}>Proteção de Rotas:</Text>
            <Text style={[styles.specValue, { color: colors.text }]}>JWT Bearer Tokens com Expiração</Text>
          </View>
        </View>

        {/* 3. EMPRESA CRIADORA E SUPORTE TÉCNICO */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="business-outline" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Empresa Criadora & Suporte</Text>
          </View>

          <View style={styles.companyBox}>
            <View style={[styles.companyIconBox, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="cube-outline" size={24} color={colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.companyName, { color: colors.text }]}>Cabryello</Text>
              <Text style={[styles.companyRole, { color: colors.textMuted }]}>
                Desenvolvimento de Software & Suporte Oficial
              </Text>
            </View>
          </View>

          <View style={styles.supportContactRow}>
            <Ionicons name="mail-outline" size={18} color={colors.accent} />
            <Text style={[styles.supportContactLabel, { color: colors.textMuted }]}>E-mail de Suporte:</Text>
            <Text style={[styles.supportContactValue, { color: colors.text }]}>cabryello@gmail.com</Text>
          </View>

          <View style={styles.supportContactRow}>
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={[styles.supportContactLabel, { color: colors.textMuted }]}>Atendimento:</Text>
            <Text style={[styles.supportContactValue, { color: colors.text }]}>Segunda a Sexta (08h às 20h)</Text>
          </View>
        </View>

        {/* 4. REDE & DIAGNÓSTICO DO SERVIDOR */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="server-outline" size={20} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Rede & Servidor Express</Text>
          </View>

          <View style={styles.serverStatusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: serverConnected ? '#10b981' : '#ef4444' }
              ]}
            />
            <Text style={[styles.statusText, { color: colors.text }]}>
              {serverConnected ? 'Servidor API Conectado' : 'Servidor API Desconectado'}
            </Text>
          </View>

          <Text style={[styles.serverUrlText, { color: colors.textMuted }]}>
            Endereço configurado: {serverUrl}
          </Text>

          <AnimatedPressable
            style={[styles.btnConfigureIp, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
            onPress={() => setConfigModalVisible(true)}
          >
            <Ionicons name="wifi-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={[styles.btnConfigureIpText, { color: colors.accent }]}>Ajustar IP do Servidor</Text>
          </AnimatedPressable>
        </View>

        {/* 5. ATALHO PARA PÁGINA DE AJUDA & SOBRE NÓS */}
        {onNavigateToHelp && (
          <AnimatedPressable
            style={[styles.helpShortcutCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
            onPress={onNavigateToHelp}
          >
            <View style={[styles.helpIconBox, { backgroundColor: colors.accentLight }]}>
              <Ionicons name="help-buoy-outline" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.helpShortcutTitle, { color: colors.text }]}>Central de Ajuda & Sobre Nós</Text>
              <Text style={[styles.helpShortcutDesc, { color: colors.textMuted }]}>
                Dúvidas frequentes, garantia e história da MuriloveStore
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSubtle} />
          </AnimatedPressable>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal de Configuração de IP do Servidor */}
      <Modal
        visible={configModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setConfigModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Configurar IP do Servidor</Text>
              <TouchableOpacity onPress={() => setConfigModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Defina o endereço onde o backend Node.js Express está executando:
            </Text>

            <TextInput
              style={[styles.inputUrl, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
              value={inputUrl}
              onChangeText={setInputUrl}
              placeholder="http://192.168.0.12:3000"
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="none"
            />

            <View style={styles.quickPresetsRow}>
              <TouchableOpacity
                style={[styles.presetBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setInputUrl('http://192.168.0.12:3000')}
              >
                <Text style={[styles.presetBtnText, { color: colors.accent }]}>IP Wi-Fi</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setInputUrl('http://localhost:3000')}
              >
                <Text style={[styles.presetBtnText, { color: colors.accent }]}>Localhost</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setInputUrl('http://10.0.2.2:3000')}
              >
                <Text style={[styles.presetBtnText, { color: colors.accent }]}>Emulador</Text>
              </TouchableOpacity>
            </View>

            <AnimatedPressable
              style={[styles.btnSalvar, { backgroundColor: colors.accent }]}
              onPress={handleSalvarRede}
              disabled={testingConnection}
            >
              {testingConnection ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.btnSalvarText}>Salvar e Testar Conexão</Text>
              )}
            </AnimatedPressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 4
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800'
  },
  scroll: {
    flex: 1,
    padding: 16
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700'
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2
  },
  themeBadgeBox: {
    marginTop: 12,
    alignItems: 'flex-start'
  },
  themeColorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1
  },
  themePillText: {
    fontSize: 12,
    fontWeight: '700'
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  specLabel: {
    fontSize: 13
  },
  specValue: {
    fontSize: 13,
    fontWeight: '600'
  },
  companyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)'
  },
  companyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  companyName: {
    fontSize: 16,
    fontWeight: '800'
  },
  companyRole: {
    fontSize: 12,
    marginTop: 2
  },
  supportContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6
  },
  supportContactLabel: {
    fontSize: 13,
    marginLeft: 8,
    marginRight: 6
  },
  supportContactValue: {
    fontSize: 13,
    fontWeight: '700'
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700'
  },
  serverUrlText: {
    fontSize: 12,
    marginBottom: 12
  },
  btnConfigureIp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  btnConfigureIpText: {
    fontSize: 13,
    fontWeight: '700'
  },
  helpShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16
  },
  helpIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  helpShortcutTitle: {
    fontSize: 15,
    fontWeight: '800'
  },
  helpShortcutDesc: {
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
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 20
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800'
  },
  modalSub: {
    fontSize: 13,
    marginBottom: 14
  },
  inputUrl: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12
  },
  quickPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  presetBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 3
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '700'
  },
  btnSalvar: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center'
  },
  btnSalvarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  }
});

