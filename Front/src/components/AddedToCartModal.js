import React from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import AnimatedPressable from './AnimatedPressable';

const { width } = Dimensions.get('window');

export default function AddedToCartModal({
  visible,
  product,
  quantity = 1,
  onClose,
  onGoToCart
}) {
  const { colors, isDark } = useTheme();
  const { formatPrice } = useCart();

  if (!product) return null;

  const preco = parseFloat(product.preco) || 0;
  const precoTotal = preco * quantity;
  const precoPix = precoTotal * 0.95;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.modalOverlay }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.cardBorder
            }
          ]}
        >
          {/* Header de Confirmação */}
          <View style={styles.header}>
            <View style={styles.successBadge}>
              <Ionicons name="checkmark-sharp" size={24} color="#ffffff" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.title, { color: colors.text }]}>
                Adicionado ao Carrinho!
              </Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Item adicionado com sucesso à sua sacola
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Detalhes do Produto Adicionado */}
          <View
            style={[
              styles.productRow,
              {
                backgroundColor: colors.bg,
                borderColor: colors.cardBorder
              }
            ]}
          >
            <Image
              source={{
                uri:
                  product.imagem_url ||
                  'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600'
              }}
              style={styles.productImage}
              resizeMode="cover"
            />

            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={2}>
                {product.nome}
              </Text>

              <View style={styles.qtyBadge}>
                <Text style={styles.qtyBadgeText}>Quantidade: {quantity} un.</Text>
              </View>

              <View style={styles.priceRow}>
                <Text style={[styles.priceTotal, { color: colors.accent }]}>
                  {formatPrice(precoTotal)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                <Ionicons name="flash" size={13} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={styles.pixNotice}>
                  {formatPrice(precoPix)} no PIX (5% OFF)
                </Text>
              </View>
            </View>
          </View>

          {/* Botões de Ação */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.btnContinue,
                {
                  borderColor: colors.cardBorder,
                  backgroundColor: isDark ? '#1e293b' : '#f1f5f9'
                }
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.btnContinueText, { color: colors.text }]}>
                Continuar Comprando
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnGoToCart,
                {
                  backgroundColor: colors.accent
                }
              ]}
              onPress={() => {
                onClose();
                if (onGoToCart) onGoToCart();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="cart" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.btnGoToCartText}>Ir para o Carrinho</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  successBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2
  },
  closeBtn: {
    padding: 4
  },
  productRow: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 20
  },
  productImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#0f172a'
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center'
  },
  productName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18
  },
  qtyBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4
  },
  qtyBadgeText: {
    color: '#0284c7',
    fontSize: 11,
    fontWeight: '700'
  },
  priceRow: {
    marginTop: 4
  },
  priceTotal: {
    fontSize: 15,
    fontWeight: '800'
  },
  pixNotice: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4
  },
  btnContinue: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  btnContinueText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  btnGoToCart: {
    flex: 1.2,
    height: 48,
    flexDirection: 'row',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  },
  btnGoToCartText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center'
  }
});

