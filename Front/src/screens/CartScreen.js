import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function CartScreen({ onNavigateToCatalog, onNavigateToOrders }) {
  const { items, removeFromCart, updateQuantity, clearCart, totalValue, formatPrice } = useCart();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState('PIX');
  const [endereco, setEndereco] = useState('Av. Paulista, 1000 - Apto 42, Bela Vista - São Paulo/SP');
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [ultimoPedidoCriado, setUltimoPedidoCriado] = useState(null);

  // Desconto de 5% se for PIX
  const descontoPix = formaPagamento === 'PIX' ? totalValue * 0.05 : 0;
  const totalComDesconto = totalValue - descontoPix;

  const handleFinalizarCompra = async () => {
    if (items.length === 0) {
      Alert.alert('Carrinho Vazio', 'Adicione produtos antes de finalizar.');
      return;
    }

    if (!user) {
      Alert.alert('Atenção', 'Faça login para poder finalizar a compra.');
      return;
    }

    try {
      setLoadingCheckout(true);

      const payload = {
        usuario_id: user.id || 2,
        forma_pagamento: formaPagamento,
        endereco_entrega: endereco,
        itens: items.map((item) => ({
          produto_id: item.produto.id,
          quantidade: item.quantidade
        }))
      };

      const resultado = await api.criarPedido(payload);

      setUltimoPedidoCriado(resultado.pedido);
      clearCart();
      setCheckoutVisible(false);
      setSuccessVisible(true);
    } catch (error) {
      Alert.alert('Erro ao Processar Pedido', error.message || 'Verifique o estoque dos produtos.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  const renderCartItem = ({ item }) => {
    const prod = item.produto;
    const subtotalItem = prod.preco * item.quantidade;

    return (
      <View style={styles.cartCard}>
        <Image
          source={{ uri: prod.imagem_url }}
          style={styles.itemImage}
          resizeMode="cover"
        />

        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {prod.nome}
          </Text>
          <Text style={styles.itemCategory}>{prod.categoria_nome || 'Eletrônico'}</Text>
          <Text style={styles.itemPrice}>{formatPrice(prod.preco)}</Text>

          <View style={styles.actionRow}>
            {/* Controles de Quantidade */}
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(prod.id, item.quantidade - 1)}
              >
                <Ionicons name="remove" size={16} color="#ffffff" />
              </TouchableOpacity>
              <Text style={styles.stepperText}>{item.quantidade}</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => updateQuantity(prod.id, item.quantidade + 1)}
                disabled={item.quantidade >= prod.estoque}
              >
                <Ionicons name="add" size={16} color="#ffffff" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => removeFromCart(prod.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.card }]}>
          <Ionicons name="cart-outline" size={64} color={colors.accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Seu carrinho está vazio</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Navegue pelo nosso catálogo e descubra smartphones, notebooks, fones e games de última geração!
        </Text>
        <TouchableOpacity
          style={[styles.shopNowBtn, { backgroundColor: colors.accent }]}
          onPress={onNavigateToCatalog}
        >
          <Ionicons name="sparkles" size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.shopNowBtnText}>Explorar Produtos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.produto.id.toString()}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Resumo do Pedido */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Subtotal ({items.length} itens)</Text>
          <Text style={[styles.summaryValue, { color: colors.text }]}>{formatPrice(totalValue)}</Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Frete Expresso</Text>
          <Text style={[styles.summaryValue, { color: '#10b981' }]}>GRÁTIS</Text>
        </View>

        {formaPagamento === 'PIX' && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Desconto PIX (5%)</Text>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              -{formatPrice(descontoPix)}
            </Text>
          </View>
        )}

        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>{formatPrice(totalComDesconto)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => setCheckoutVisible(true)}
        >
          <Text style={styles.checkoutBtnText}>Fechar Pedido</Text>
          <Ionicons name="arrow-forward" size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Modal de Checkout / Pagamento */}
      <Modal
        visible={checkoutVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCheckoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Finalizar Pagamento</Text>
                <TouchableOpacity
                  onPress={() => setCheckoutVisible(false)}
                  style={styles.modalCloseBtn}
                >
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Endereço de Entrega */}
              <Text style={styles.sectionLabel}>Endereço de Entrega</Text>
              <View style={styles.addressInputContainer}>
                <Ionicons name="location-outline" size={22} color="#38bdf8" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.addressInput}
                  value={endereco}
                  onChangeText={setEndereco}
                  placeholder="Informe seu endereço completo"
                  placeholderTextColor="#64748b"
                  multiline
                />
              </View>

              {/* Formas de Pagamento */}
              <Text style={styles.sectionLabel}>Forma de Pagamento</Text>

              {/* Opção PIX */}
              <TouchableOpacity
                style={[styles.paymentOption, formaPagamento === 'PIX' && styles.paymentOptionActive]}
                onPress={() => setFormaPagamento('PIX')}
              >
                <View style={styles.paymentLeft}>
                  <Ionicons name="flash" size={22} color={formaPagamento === 'PIX' ? '#10b981' : '#94a3b8'} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.paymentTitle}>PIX (Aprovação Imediata)</Text>
                    <Text style={styles.paymentSub}>5% de desconto exclusivo</Text>
                  </View>
                </View>
                {formaPagamento === 'PIX' && (
                  <Ionicons name="checkmark-circle" size={22} color="#10b981" />
                )}
              </TouchableOpacity>

              {/* Opção Cartão de Crédito */}
              <TouchableOpacity
                style={[styles.paymentOption, formaPagamento === 'Cartão' && styles.paymentOptionActive]}
                onPress={() => setFormaPagamento('Cartão')}
              >
                <View style={styles.paymentLeft}>
                  <Ionicons name="card" size={22} color={formaPagamento === 'Cartão' ? '#38bdf8' : '#94a3b8'} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.paymentTitle}>Cartão de Crédito</Text>
                    <Text style={styles.paymentSub}>Em até 10x sem juros</Text>
                  </View>
                </View>
                {formaPagamento === 'Cartão' && (
                  <Ionicons name="checkmark-circle" size={22} color="#38bdf8" />
                )}
              </TouchableOpacity>

              {/* Opção Boleto */}
              <TouchableOpacity
                style={[styles.paymentOption, formaPagamento === 'Boleto' && styles.paymentOptionActive]}
                onPress={() => setFormaPagamento('Boleto')}
              >
                <View style={styles.paymentLeft}>
                  <Ionicons name="barcode-outline" size={22} color={formaPagamento === 'Boleto' ? '#f59e0b' : '#94a3b8'} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.paymentTitle}>Boleto Bancário</Text>
                    <Text style={styles.paymentSub}>Vencimento em 3 dias úteis</Text>
                  </View>
                </View>
                {formaPagamento === 'Boleto' && (
                  <Ionicons name="checkmark-circle" size={22} color="#f59e0b" />
                )}
              </TouchableOpacity>

              {/* Detalhes específicos da forma de pagamento */}
              {formaPagamento === 'PIX' && (
                <View style={styles.pixBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <Ionicons name="flash" size={14} color="#34d399" style={{ marginRight: 5 }} />
                    <Text style={[styles.pixBoxTitle, { marginBottom: 0 }]}>Chave PIX Copia e Cola:</Text>
                  </View>
                  <Text style={styles.pixCode}>
                    00020126580014BR.GOV.BCB.PIX0136murilovestore-pagamentos-eletronicos
                  </Text>
                  <Text style={styles.pixHelp}>
                    O pagamento será confirmado instantaneamente pelo sistema.
                  </Text>
                </View>
              )}

              {formaPagamento === 'Cartão' && (
                <View style={styles.cardBox}>
                  <TextInput
                    style={styles.cardInput}
                    placeholder="Número do Cartão (ex: 4532 •••• •••• 8910)"
                    placeholderTextColor="#64748b"
                    defaultValue="4532 8901 2345 6789"
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      style={[styles.cardInput, { flex: 1 }]}
                      placeholder="MM/AA"
                      placeholderTextColor="#64748b"
                      defaultValue="12/29"
                    />
                    <TextInput
                      style={[styles.cardInput, { flex: 1 }]}
                      placeholder="CVV"
                      placeholderTextColor="#64748b"
                      defaultValue="888"
                    />
                  </View>
                </View>
              )}

              {/* Botão de Confirmação Final */}
              <TouchableOpacity
                style={[styles.confirmOrderBtn, loadingCheckout && { opacity: 0.7 }]}
                onPress={handleFinalizarCompra}
                disabled={loadingCheckout}
              >
                {loadingCheckout ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmOrderText}>
                      Pagar {formatPrice(totalComDesconto)}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Sucesso */}
      <Modal
        visible={successVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSuccessVisible(false)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconBadge}>
              <Ionicons name="checkmark-sharp" size={42} color="#ffffff" />
            </View>
            <Text style={styles.successTitle}>Pedido Confirmado!</Text>
            <Text style={styles.successMessage}>
              Seu pedido #{ultimoPedidoCriado?.id} foi registrado com sucesso e já está sendo preparado para envio!
            </Text>

            <TouchableOpacity
              style={styles.viewOrdersBtn}
              onPress={() => {
                setSuccessVisible(false);
                if (onNavigateToOrders) onNavigateToOrders();
              }}
            >
              <Text style={styles.viewOrdersText}>Ver Meus Pedidos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.continueShoppingBtn}
              onPress={() => {
                setSuccessVisible(false);
                if (onNavigateToCatalog) onNavigateToCatalog();
              }}
            >
              <Text style={styles.continueShoppingText}>Continuar Comprando</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0f1d'
  },
  listContainer: {
    padding: 16,
    gap: 12
  },
  cartCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#334155'
  },
  itemImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    backgroundColor: '#0f172a'
  },
  itemDetails: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'space-between'
  },
  itemName: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700'
  },
  itemCategory: {
    color: '#38bdf8',
    fontSize: 12,
    marginTop: 2
  },
  itemPrice: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  stepperBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  stepperText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    minWidth: 20,
    textAlign: 'center'
  },
  deleteBtn: {
    padding: 6
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#334155'
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  summaryLabel: {
    color: '#94a3b8',
    fontSize: 14
  },
  summaryValue: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600'
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#334155',
    marginBottom: 16
  },
  totalLabel: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  totalValue: {
    color: '#38bdf8',
    fontSize: 22,
    fontWeight: '800'
  },
  checkoutBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0b0f19'
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20
  },
  emptyTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8
  },
  emptySubtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24
  },
  shopNowBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12
  },
  shopNowBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  // Modal de Checkout
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc'
  },
  modalCloseBtn: {
    padding: 4
  },
  sectionLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 10
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 14
  },
  addressInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    minHeight: 40
  },
  paymentOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginBottom: 10
  },
  paymentOptionActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#13233b'
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  paymentTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700'
  },
  paymentSub: {
    color: '#94a3b8',
    fontSize: 12
  },
  pixBox: {
    backgroundColor: '#064e3b',
    borderRadius: 12,
    padding: 14,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#059669'
  },
  pixBoxTitle: {
    color: '#34d399',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4
  },
  pixCode: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
    borderRadius: 6
  },
  pixHelp: {
    color: '#a7f3d0',
    fontSize: 11,
    marginTop: 6
  },
  cardBox: {
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 12,
    marginVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  cardInput: {
    backgroundColor: '#1e293b',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 13
  },
  confirmOrderBtn: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 16,
    marginBottom: 24
  },
  confirmOrderText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  // Modal de Sucesso
  successOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  successCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderColor: '#334155'
  },
  successIconBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18
  },
  successTitle: {
    color: '#f8fafc',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8
  },
  successMessage: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24
  },
  viewOrdersBtn: {
    backgroundColor: '#0284c7',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  viewOrdersText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  continueShoppingBtn: {
    paddingVertical: 10
  },
  continueShoppingText: {
    color: '#94a3b8',
    fontSize: 14
  }
});

