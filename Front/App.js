import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Animated
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider, useCart } from './src/context/CartContext';
import { ToastProvider } from './src/context/ToastContext';
import Toast from './src/components/Toast';

// Telas
import WelcomeScreen from './src/screens/WelcomeScreen';
import HomeScreen from './src/screens/HomeScreen';
import CartScreen from './src/screens/CartScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import HelpAboutScreen from './src/screens/HelpAboutScreen';
import AnimatedPressable from './src/components/AnimatedPressable';

function MainApp() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user, isAdmin } = useAuth();
  const { totalItems } = useCart();

  // Exibe a tela de onboarding / splash screen de boas-vindas na primeira entrada
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentTab, setCurrentTab] = useState('catalogo'); // 'catalogo' | 'carrinho' | 'pedidos' | 'ajuda' | 'perfil' | 'admin'
  const [openAuthInProfile, setOpenAuthInProfile] = useState(false);

  // Animação suave na troca de páginas (Fade + Slide)
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const changeTab = (newTab) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0.05,
        duration: 120,
        useNativeDriver: true
      }),
      Animated.timing(slideAnim, {
        toValue: 8,
        duration: 120,
        useNativeDriver: true
      })
    ]).start(() => {
      setCurrentTab(newTab);
      slideAnim.setValue(-8);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true
        })
      ]).start();
    });
  };

  const handleOpenAdmin = () => {
    changeTab('admin');
  };

  const handleExitAdmin = () => {
    changeTab('perfil');
  };

  // 1. Tela de Splash / Boas-Vindas
  if (showWelcome) {
    return (
      <View style={[styles.safeContainer, { backgroundColor: '#030712' }]}>
        <StatusBar barStyle="light-content" backgroundColor="#030712" />
        <WelcomeScreen
          onContinueAsGuest={() => setShowWelcome(false)}
          onLoginSuccess={() => setShowWelcome(false)}
        />
      </View>
    );
  }

  // 2. Modo Administrador (Lojista)
  if (currentTab === 'admin') {
    return (
      <View
        style={[
          styles.safeContainer,
          {
            backgroundColor: colors.bg,
            paddingTop: insets.top,
            paddingBottom: insets.bottom
          }
        ]}
      >
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? '#161c2e' : '#f5f3ff'}
        />
        <AdminDashboardScreen onExitAdmin={handleExitAdmin} />
      </View>
    );
  }

  // 3. Aplicação Principal Comercial
  return (
    <View
      style={[
        styles.safeContainer,
        {
          backgroundColor: colors.bg,
          paddingTop: insets.top
        }
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgSecondary}
      />

      {/* Top Header Bar Inspirado na Microsoft Store */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.bgSecondary,
            borderColor: colors.cardBorder
          }
        ]}
      >
        <TouchableOpacity
          style={styles.brandRow}
          onPress={() => changeTab('catalogo')}
          activeOpacity={0.8}
        >
          {/* Ícone Estilo 4 Quadrados Microsoft Fluent */}
          <View style={styles.fluentGridIcon}>
            <View style={[styles.fluentSquare, { backgroundColor: '#f25022' }]} />
            <View style={[styles.fluentSquare, { backgroundColor: '#7fba00' }]} />
            <View style={[styles.fluentSquare, { backgroundColor: '#00a4ef' }]} />
            <View style={[styles.fluentSquare, { backgroundColor: '#ffb900' }]} />
          </View>

          <View>
            <Text style={[styles.brandTitle, { color: colors.text }]}>MuriloveStore</Text>
            <Text style={[styles.brandSubtitle, { color: colors.accent }]}>
              Eletrônicos & Tecnologia
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <View style={[styles.storeBadge, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.liveDot} />
            <Ionicons
              name={isAdmin ? 'shield-checkmark' : 'storefront-outline'}
              size={12}
              color={isAdmin ? '#a855f7' : colors.accent}
              style={{ marginRight: 2 }}
            />
            <Text style={[styles.storeBadgeText, { color: colors.textMuted }]}>
              {isAdmin ? 'Admin' : 'Loja Oficial'}
            </Text>
          </View>
        </View>
      </View>

      {/* Área Central com Transição Animada Suave (Fade + Slide) */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        {currentTab === 'catalogo' && (
          <HomeScreen onNavigateToCart={() => changeTab('carrinho')} />
        )}

        {currentTab === 'carrinho' && (
          <CartScreen
            onNavigateToCatalog={() => changeTab('catalogo')}
            onNavigateToOrders={() => changeTab('pedidos')}
          />
        )}

        {currentTab === 'pedidos' && (
          <OrdersScreen
            onNavigateToCatalog={() => changeTab('catalogo')}
            onOpenAuth={() => {
              setOpenAuthInProfile(true);
              changeTab('perfil');
            }}
          />
        )}

        {currentTab === 'perfil' && (
          <ProfileScreen
            onNavigateToOrders={() => changeTab('pedidos')}
            onOpenAdminPanel={handleOpenAdmin}
            onNavigateToHelp={() => changeTab('ajuda')}
            initialOpenAuth={openAuthInProfile}
            onAuthModalClose={() => setOpenAuthInProfile(false)}
          />
        )}

        {currentTab === 'ajuda' && (
          <HelpAboutScreen onBack={() => changeTab('catalogo')} />
        )}
      </Animated.View>

      {/* Barra de Navegação Inferior (5 Abas - Respeitando SafeAreaInsets) */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: colors.bgSecondary,
            borderColor: colors.cardBorder,
            paddingBottom: Math.max(insets.bottom, 10)
          }
        ]}
      >
        {/* 1. Aba Início */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => changeTab('catalogo')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentTab === 'catalogo' ? 'storefront' : 'storefront-outline'}
            size={22}
            color={currentTab === 'catalogo' ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.navText,
              { color: colors.textMuted },
              currentTab === 'catalogo' && { color: colors.accent, fontWeight: '800' }
            ]}
          >
            Início
          </Text>
        </TouchableOpacity>

        {/* 2. Aba Carrinho */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => changeTab('carrinho')}
          activeOpacity={0.7}
        >
          <View style={{ position: 'relative' }}>
            <Ionicons
              name={currentTab === 'carrinho' ? 'cart' : 'cart-outline'}
              size={22}
              color={currentTab === 'carrinho' ? colors.accent : colors.textMuted}
            />
            {totalItems > 0 && (
              <View style={styles.bottomCartBadge}>
                <Text style={styles.bottomCartBadgeText}>
                  {totalItems > 99 ? '99+' : totalItems}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.navText,
              { color: colors.textMuted },
              currentTab === 'carrinho' && { color: colors.accent, fontWeight: '800' }
            ]}
          >
            Carrinho
          </Text>
        </TouchableOpacity>

        {/* 3. Aba Pedidos */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => changeTab('pedidos')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentTab === 'pedidos' ? 'receipt' : 'receipt-outline'}
            size={22}
            color={currentTab === 'pedidos' ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.navText,
              { color: colors.textMuted },
              currentTab === 'pedidos' && { color: colors.accent, fontWeight: '800' }
            ]}
          >
            Pedidos
          </Text>
        </TouchableOpacity>

        {/* 4. Aba Ajuda & Sobre Nós (Conforme solicitado na nav inferior) */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => changeTab('ajuda')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={currentTab === 'ajuda' ? 'help-circle' : 'help-circle-outline'}
            size={22}
            color={currentTab === 'ajuda' ? colors.accent : colors.textMuted}
          />
          <Text
            style={[
              styles.navText,
              { color: colors.textMuted },
              currentTab === 'ajuda' && { color: colors.accent, fontWeight: '800' }
            ]}
          >
            Ajuda
          </Text>
        </TouchableOpacity>

        {/* 5. Aba Perfil / Conta */}
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => changeTab('perfil')}
          activeOpacity={0.7}
        >
          <Ionicons
            name={
              currentTab === 'perfil' || currentTab === 'configuracoes'
                ? 'person'
                : 'person-outline'
            }
            size={22}
            color={
              currentTab === 'perfil' || currentTab === 'configuracoes'
                ? colors.accent
                : colors.textMuted
            }
          />
          <Text
            style={[
              styles.navText,
              { color: colors.textMuted },
              (currentTab === 'perfil' || currentTab === 'configuracoes') && {
                color: colors.accent,
                fontWeight: '800'
              }
            ]}
          >
            Conta
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <MainApp />
              <Toast />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  fluentGridIcon: {
    width: 24,
    height: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    marginRight: 10
  },
  fluentSquare: {
    width: 10.5,
    height: 10.5,
    borderRadius: 2
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: '600'
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10b981'
  },
  storeBadgeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  content: {
    flex: 1
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingHorizontal: 4
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2
  },
  navText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3
  },
  bottomCartBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3
  },
  bottomCartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800'
  }
});
