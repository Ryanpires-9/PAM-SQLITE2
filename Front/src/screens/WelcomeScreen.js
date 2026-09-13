import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import AnimatedPressable from '../components/AnimatedPressable';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ onContinueAsGuest, onLoginSuccess }) {
  const { login, register } = useAuth();
  const { colors } = useTheme();
  const { showToast } = useToast();

  // Etapa atual do Onboarding (1: Apresentação, 2: Segurança & LGPD, 3: Acesso / Login)
  const [step, setStep] = useState(1);

  // Estados do formulário de autenticação (Etapa 3)
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(true);

  // Termos de Privacidade e Consentimento (Etapa 2)
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);

  // Animações suaves de transição entre etapas
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulso contínuo e suave no logo (respiração)
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.06,
          duration: 1600,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true
        })
      ])
    );
    pulseLoop.start();

    return () => pulseLoop.stop();
  }, []);

  const goToStep = (nextStep) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: nextStep > step ? -15 : 15,
        duration: 160,
        useNativeDriver: true
      })
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(nextStep > step ? 15 : -15);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  const handleStep2Next = () => {
    if (!acceptedTerms) {
      showToast('Por favor, leia e aceite os Termos de Privacidade e Consentimento para prosseguir.', 'warning', 'Termos Obrigatórios');
      return;
    }
    goToStep(3);
  };

  const handleSubmitAuth = async () => {
    if (!email.trim() || !senha.trim()) {
      showToast('Por favor, preencha o e-mail e a senha de acesso.', 'error', 'Campos Obrigatórios');
      return;
    }

    setLoading(true);
    try {
      if (tab === 'login') {
        const res = await login(email.trim(), senha);
        if (res.success) {
          showToast(`Bem-vindo de volta, ${res.usuario.nome}!`, 'success', 'Login Realizado');
          if (onLoginSuccess) onLoginSuccess(res.usuario);
        } else {
          showToast(res.erro || 'E-mail ou senha inválidos. Verifique os dados.', 'error', 'Falha no Login');
        }
      } else {
        if (!nome.trim()) {
          showToast('Por favor, informe seu nome completo para o cadastro.', 'error', 'Nome Obrigatório');
          setLoading(false);
          return;
        }
        const res = await register(nome.trim(), email.trim(), senha);
        if (res.success) {
          showToast('Sua conta foi criada com sucesso!', 'success', 'Conta Criada');
          if (onLoginSuccess) onLoginSuccess(res.usuario);
        } else {
          // Tratar e-mail duplicado de forma amigável
          if (res.erro && res.erro.toLowerCase().includes('já')) {
            showToast('Já existe uma conta com este e-mail. Por favor, faça login.', 'error', 'E-mail Já Cadastrado');
          } else {
            showToast(res.erro || 'Erro ao realizar o cadastro.', 'error', 'Erro no Cadastro');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuest = () => {
    if (step < 2 && !acceptedTerms) {
      // Se ainda não aceitou os termos no passo 1, pede confirmação rápida
      Alert.alert(
        'Termos e Privacidade',
        'Ao explorar a loja como visitante, você concorda com nossos Termos de Privacidade.',
        [
          { text: 'Ler Termos', onPress: () => setTermsModalVisible(true) },
          {
            text: 'Aceitar e Explorar',
            onPress: () => {
              setAcceptedTerms(true);
              if (onContinueAsGuest) onContinueAsGuest();
            }
          }
        ]
      );
      return;
    }
    if (onContinueAsGuest) onContinueAsGuest();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Gradiente vertical de dispersão de luz elegante */}
      <LinearGradient
        colors={['#030712', '#0a1a36', '#14386e', '#23599e', '#5e94d4', '#e2edfb']}
        locations={[0, 0.22, 0.42, 0.64, 0.84, 1.0]}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Indicador de Etapas no Topo */}
      <View style={styles.stepIndicatorRow}>
        {[1, 2, 3].map((s) => (
          <View
            key={s}
            style={[
              styles.stepDot,
              step === s && styles.stepDotActive,
              step > s && styles.stepDotCompleted
            ]}
          />
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={[
            styles.animatedContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* ============================================================ */}
          {/* ETAPA 1: APRESENTAÇÃO DA LOJA & DISCLAIMER MICROSOFT FICTÍCIA */}
          {/* ============================================================ */}
          {step === 1 && (
            <View style={styles.stepCard}>
              <View style={styles.brandHeader}>
                <Animated.View style={[styles.msGridIcon, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={[styles.msSquare, { backgroundColor: '#f25022' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#7fba00' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#00a4ef' }]} />
                  <View style={[styles.msSquare, { backgroundColor: '#ffb900' }]} />
                </Animated.View>

                <Text style={styles.brandTitle}>MuriloveStore</Text>
                <Text style={styles.brandSubtitle}>
                  Eletrônicos & Informática • Tecnologia de Alta Performance
                </Text>
              </View>

              {/* AVISO IMPORTANTE: LOJA FICTÍCIA AFILIADA À MICROSOFT */}
              <View style={styles.fictitiousNoticeBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                  <Ionicons name="information-circle" size={18} color="#fbbf24" style={{ marginRight: 6 }} />
                  <Text style={styles.fictitiousNoticeTitle}>Nota Informativa</Text>
                </View>
                <Text style={styles.fictitiousNoticeText}>
                  A <Text style={{ fontWeight: '800', color: '#ffffff' }}>MuriloveStore</Text> é uma loja fictícia criada para fins de demonstração tecnológica e portfólio de software, inspirada no design Fluent e conceitualmente afiliada ao ecossistema de design da Microsoft.
                </Text>
              </View>

              {/* Destaques de Benefícios */}
              <View style={styles.featurePill}>
                <Ionicons name="hardware-chip-outline" size={20} color="#38bdf8" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.featurePillTitle}>Catálogo Premium de Eletrônicos</Text>
                  <Text style={styles.featurePillSub}>Smartphones, notebooks, gamers e áudio de ponta</Text>
                </View>
              </View>

              <View style={styles.featurePill}>
                <Ionicons name="flash-outline" size={20} color="#fbbf24" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.featurePillTitle}>5% de Desconto no PIX</Text>
                  <Text style={styles.featurePillSub}>Economia real à vista ou parcele em até 10x sem juros</Text>
                </View>
              </View>

              <View style={styles.featurePill}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#34d399" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.featurePillTitle}>Garantia Nacional de 12 Meses</Text>
                  <Text style={styles.featurePillSub}>Suporte técnico e assistência técnica homologada</Text>
                </View>
              </View>

              {/* Botões de Ação da Etapa 1 */}
              <AnimatedPressable
                style={styles.primaryButton}
                onPress={() => goToStep(2)}
              >
                <Text style={styles.primaryButtonText}>Avançar para Segurança</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.guestButton}
                onPress={handleGuest}
              >
                <Text style={styles.guestButtonText}>Explorar loja como Visitante</Text>
                <Ionicons name="chevron-forward" size={16} color="#38bdf8" />
              </AnimatedPressable>
            </View>
          )}

          {/* ============================================================ */}
          {/* ETAPA 2: SEGURANÇA, CRIPTOGRAFIA & TERMOS DE PRIVACIDADE LGPD */}
          {/* ============================================================ */}
          {step === 2 && (
            <View style={styles.stepCard}>
              <View style={styles.securityHeader}>
                <View style={styles.securityIconBox}>
                  <Ionicons name="shield-checkmark" size={32} color="#10b981" />
                </View>
                <Text style={styles.stepTitle}>Segurança & Privacidade</Text>
                <Text style={styles.stepSubtitle}>
                  Seus dados protegidos com padrões modernos de criptografia
                </Text>
              </View>

              <View style={styles.securityFeatureRow}>
                <Ionicons name="lock-closed" size={18} color="#38bdf8" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.securityFeatureTitle}>Criptografia Forte (ScryptSync)</Text>
                  <Text style={styles.securityFeatureDesc}>
                    Senhas protegidas com derivação criptográfica por salt de 16 bytes.
                  </Text>
                </View>
              </View>

              <View style={styles.securityFeatureRow}>
                <Ionicons name="key" size={18} color="#fbbf24" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.securityFeatureTitle}>Autenticação com Tokens JWT</Text>
                  <Text style={styles.securityFeatureDesc}>
                    Sessões autenticadas sem tráfego de dados sensíveis na rede.
                  </Text>
                </View>
              </View>

              <View style={styles.securityFeatureRow}>
                <Ionicons name="document-lock" size={18} color="#a78bfa" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.securityFeatureTitle}>Conformidade com a LGPD</Text>
                  <Text style={styles.securityFeatureDesc}>
                    Coleta estritamente mínima para faturamento e envio de encomendas.
                  </Text>
                </View>
              </View>

              {/* Caixa de Aceite dos Termos */}
              <View style={styles.termsBox}>
                <TouchableOpacity
                  style={[styles.checkbox, acceptedTerms && styles.checkboxChecked]}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  activeOpacity={0.7}
                >
                  {acceptedTerms && <Ionicons name="checkmark" size={14} color="#ffffff" />}
                </TouchableOpacity>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.termsText}>
                    Li e concordo com os{' '}
                    <Text
                      style={styles.termsLink}
                      onPress={() => setTermsModalVisible(true)}
                    >
                      Termos de Uso e Política de Privacidade
                    </Text>{' '}
                    da MuriloveStore.
                  </Text>
                </View>
              </View>

              {/* Botões da Etapa 2 */}
              <AnimatedPressable
                style={[styles.primaryButton, !acceptedTerms && { opacity: 0.6 }]}
                onPress={handleStep2Next}
              >
                <Text style={styles.primaryButtonText}>Avançar para Login / Cadastro</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 8 }} />
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.backStepButton}
                onPress={() => goToStep(1)}
              >
                <Ionicons name="arrow-back" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                <Text style={styles.backStepButtonText}>Voltar para Apresentação</Text>
              </AnimatedPressable>
            </View>
          )}

          {/* ============================================================ */}
          {/* ETAPA 3: ACESSO & AUTENTICAÇÃO (ENTRAR OU CRIAR CONTA)        */}
          {/* ============================================================ */}
          {step === 3 && (
            <View style={styles.stepCard}>
              <View style={styles.authHeader}>
                <Text style={styles.stepTitle}>Acesse sua Conta</Text>
                <Text style={styles.stepSubtitle}>
                  Faça login ou cadastre-se para aproveitar ofertas exclusivas
                </Text>
              </View>

              {/* Seletor de Aba (Entrar / Criar Conta) */}
              <View style={styles.tabSelector}>
                <TouchableOpacity
                  style={[styles.tabButton, tab === 'login' && styles.tabButtonActive]}
                  onPress={() => setTab('login')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabButtonText, tab === 'login' && styles.tabButtonTextActive]}>
                    Entrar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabButton, tab === 'register' && styles.tabButtonActive]}
                  onPress={() => setTab('register')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabButtonText, tab === 'register' && styles.tabButtonTextActive]}>
                    Criar Conta
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Campos do Formulário Limpos (Placeholders apenas) */}
              {tab === 'register' && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Nome Completo</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: João Silva"
                    placeholderTextColor="#64748b"
                    autoComplete="off"
                    importantForAutofill="no"
                    value={nome}
                    onChangeText={setNome}
                  />
                </View>
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>E-mail</Text>
                <TextInput
                  style={styles.input}
                  placeholder="seuemail@exemplo.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="off"
                  importantForAutofill="no"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, { paddingRight: 42 }]}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#64748b"
                    secureTextEntry={!showSenha}
                    autoComplete="off"
                    importantForAutofill="no"
                    value={senha}
                    onChangeText={setSenha}
                  />
                  <TouchableOpacity
                    style={styles.btnEye}
                    onPress={() => setShowSenha(!showSenha)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={showSenha ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#94a3b8"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Botão de Ação */}
              <AnimatedPressable
                style={[styles.primaryButton, loading && { opacity: 0.7 }]}
                onPress={handleSubmitAuth}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {tab === 'login' ? 'Entrar na MuriloveStore' : 'Cadastrar Usuário'}
                  </Text>
                )}
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.guestButton}
                onPress={onContinueAsGuest}
              >
                <Text style={styles.guestButtonText}>Explorar loja como Visitante</Text>
                <Ionicons name="arrow-forward" size={16} color="#38bdf8" />
              </AnimatedPressable>

              <AnimatedPressable
                style={styles.backStepButton}
                onPress={() => goToStep(2)}
              >
                <Ionicons name="arrow-back" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
                <Text style={styles.backStepButtonText}>Voltar para Segurança</Text>
              </AnimatedPressable>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      {/* Modal dos Termos de Uso e Consentimento (LGPD) */}
      <Modal
        visible={termsModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setTermsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="document-text-outline" size={22} color="#38bdf8" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>Termos & Privacidade</Text>
              </View>
              <TouchableOpacity onPress={() => setTermsModalVisible(false)}>
                <Ionicons name="close" size={24} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.termsScroll} showsVerticalScrollIndicator={false}>
              <Text style={styles.termsSectionTitle}>1. Escopo e Afilição Conceitual</Text>
              <Text style={styles.termsSectionBody}>
                A MuriloveStore é um aplicativo demonstrativo e portfólio de tecnologia focado em boas práticas de React Native e APIs REST em SQLite, utilizando design e linguagem visual inspirados no sistema Microsoft Fluent.
              </Text>

              <Text style={styles.termsSectionTitle}>2. Tratamento de Dados (LGPD)</Text>
              <Text style={styles.termsSectionBody}>
                Seus dados cadastrais (nome e e-mail) são processados exclusivamente para identificação e acompanhamento dos pedidos. Nenhuma informação é compartilhada com terceiros com fins comerciais.
              </Text>

              <Text style={styles.termsSectionTitle}>3. Criptografia Cibernética</Text>
              <Text style={styles.termsSectionBody}>
                Senhas são criptografadas com Scrypt e salt aleatório de 16 bytes. Autenticações administrativas exigem tokens assinados digitalmente por HMAC-SHA256.
              </Text>

              <Text style={styles.termsSectionTitle}>4. Direitos do Titular</Text>
              <Text style={styles.termsSectionBody}>
                O usuário tem direito a solicitar retificação ou exclusão de seus dados a qualquer momento pelo suporte técnico em cabryello@gmail.com.
              </Text>
            </ScrollView>

            <View style={styles.modalFooter}>
              <AnimatedPressable
                style={styles.modalAcceptButton}
                onPress={() => {
                  setAcceptedTerms(true);
                  setTermsModalVisible(false);
                }}
              >
                <Ionicons name="shield-checkmark" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalAcceptButtonText}>Concordo e Aceito os Termos</Text>
              </AnimatedPressable>
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712'
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 48 : 20,
    paddingBottom: 4,
    gap: 8,
    zIndex: 10
  },
  stepDot: {
    width: 24,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)'
  },
  stepDotActive: {
    backgroundColor: '#38bdf8',
    width: 36
  },
  stepDotCompleted: {
    backgroundColor: '#10b981'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24
  },
  animatedContainer: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    alignSelf: 'center'
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 16
  },
  msGridIcon: {
    width: 54,
    height: 54,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    marginBottom: 12
  },
  msSquare: {
    width: 24,
    height: 24,
    borderRadius: 4
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    textAlign: 'center'
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#93c5fd',
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '500'
  },
  fictitiousNoticeBox: {
    backgroundColor: 'rgba(251, 191, 36, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.35)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center'
  },
  fictitiousNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fbbf24',
    textAlign: 'center'
  },
  fictitiousNoticeText: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
    textAlign: 'center'
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    width: '100%'
  },
  featurePillTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc'
  },
  featurePillSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1
  },
  securityHeader: {
    alignItems: 'center',
    marginBottom: 16
  },
  securityIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center'
  },
  stepSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center'
  },
  securityFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    width: '100%'
  },
  securityFeatureTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc'
  },
  securityFeatureDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 15
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 18,
    width: '100%'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent'
  },
  checkboxChecked: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7'
  },
  termsText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 16
  },
  termsLink: {
    color: '#38bdf8',
    fontWeight: '700',
    textDecorationLine: 'underline'
  },
  primaryButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    width: '100%'
  },
  backStepButtonText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
    width: '100%'
  },
  guestButtonText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '600',
    marginRight: 6
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%'
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%'
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  tabButtonActive: {
    backgroundColor: '#0284c7'
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8'
  },
  tabButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  fieldGroup: {
    marginBottom: 12,
    width: '100%'
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#ffffff'
  },
  passwordWrap: {
    position: 'relative',
    justifyContent: 'center'
  },
  btnEye: {
    position: 'absolute',
    right: 12,
    top: 11,
    padding: 2
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff'
  },
  termsScroll: {
    marginVertical: 14
  },
  termsSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
    marginTop: 10,
    marginBottom: 4
  },
  termsSectionBody: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18
  },
  modalFooter: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  modalAcceptButton: {
    backgroundColor: '#0284c7',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalAcceptButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700'
  }
});
