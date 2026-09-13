import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert
} from 'react-native';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';

export default function OrdersScreen({ onNavigateToCatalog, onOpenAuth }) {
  const { user, isAdmin } = useAuth();
  const { formatPrice } = useCart();
  const { colors } = useTheme();

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    carregarPedidos();
  }, [user]);

  const carregarPedidos = async () => {
    if (!user) {
      setPedidos([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setLoading(true);
      // Se for cliente comum, filtra pelos pedidos dele; se for admin, vê todos
      const userIdParam = isAdmin ? null : user.id;
      const data = await api.getPedidos(userIdParam);
      setPedidos(data || []);
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    carregarPedidos();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pago':
        return '#10b981';
      case 'Enviado':
        return '#0284c7';
      case 'Entregue':
        return '#8b5cf6';
      case 'Cancelado':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const renderPedidoItem = ({ item }) => {
    const statusColor = getStatusColor(item.status);
    const dataFormatada = item.criado_em
      ? new Date(item.criado_em).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Hoje';

    return (
      <View style={styles.orderCard}>
        {/* Cabeçalho do Pedido */}
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>Pedido #{item.id}</Text>
            <Text style={styles.orderDate}>{dataFormatada}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22`, borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
        </View>

        {/* Informações do Cliente se for visão Admin */}
        {isAdmin && item.cliente_nome && (
          <View style={styles.clientInfoBox}>
            <Ionicons name="person" size={14} color="#38bdf8" />
            <Text style={styles.clientInfoText}>
              Cliente: {item.cliente_nome} ({item.cliente_email})
            </Text>
          </View>
        )}

        {/* Itens do Pedido */}
        <View style={styles.itemsList}>
          {item.itens && item.itens.length > 0 ? (
            item.itens.map((prod, index) => (
              <View key={index.toString()} style={styles.productRow}>
                {prod.imagem_url ? (
                  <Image source={{ uri: prod.imagem_url }} style={styles.productThumb} resizeMode="cover" />
                ) : (
                  <View style={styles.productThumbPlaceholder}>
                    <Ionicons name="hardware-chip-outline" size={16} color="#94a3b8" />
                  </View>
                )}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.productName} numberOfLines={1}>
                    {prod.produto_nome || `Produto #${prod.produto_id}`}
                  </Text>
                  <Text style={styles.productSub}>
                    {prod.quantidade}x de {formatPrice(prod.preco_unitario)}
                  </Text>
                </View>
                <Text style={styles.productItemTotal}>
                  {formatPrice(prod.quantidade * prod.preco_unitario)}
                </Text>
              </View>
            ))
          ) : (
            <Text style={styles.noItemsText}>Itens gravados no pedido.</Text>
          )}
        </View>

        {/* Rodapé com Pagamento e Total */}
        <View style={styles.orderFooter}>
          <View style={styles.paymentMethodBadge}>
            <Ionicons
              name={
                item.forma_pagamento === 'PIX'
                  ? 'flash'
                  : item.forma_pagamento === 'Cartão'
                  ? 'card'
                  : 'barcode-outline'
              }
              size={14}
              color="#94a3b8"
            />
            <Text style={styles.paymentMethodText}>{item.forma_pagamento || 'PIX'}</Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.totalLabel}>Total Pago</Text>
            <Text style={styles.totalAmount}>{formatPrice(item.total)}</Text>
          </View>
        </View>

        {item.endereco_entrega ? (
          <View style={styles.addressBox}>
            <Ionicons name="location-outline" size={14} color="#64748b" />
            <Text style={styles.addressText} numberOfLines={1}>
              {item.endereco_entrega}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Buscando seus pedidos...</Text>
      </View>
    );
  }

  // Se o usuário estiver desconectado / visitante, não exibe pedidos anteriores e mostra botão para logar/cadastrar
  if (!user) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }]}>
          <Ionicons name="lock-closed-outline" size={50} color={colors.accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Histórico de Pedidos</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Você está navegando como visitante. Acesse sua conta ou faça um cadastro para visualizar suas compras e acompanhar entregas.
        </Text>
        <TouchableOpacity
          style={[styles.catalogBtn, { backgroundColor: colors.accent, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }]}
          onPress={onOpenAuth}
        >
          <Ionicons name="log-in-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.catalogBtnText}>Entrar ou Criar Conta</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.secondaryBtn, { borderColor: colors.cardBorder, backgroundColor: colors.card }]}
          onPress={onNavigateToCatalog}
        >
          <Text style={[styles.secondaryBtnText, { color: colors.text }]}>Explorar Produtos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (pedidos.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.bg }]}>
        <View style={[styles.emptyIconCircle, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder }]}>
          <Ionicons name="receipt-outline" size={50} color={colors.accent} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum pedido encontrado</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
          Você ainda não realizou compras com a sua conta. Escolha seus eletrônicos e aproveite!
        </Text>
        <TouchableOpacity
          style={[styles.catalogBtn, { backgroundColor: colors.accent }]}
          onPress={onNavigateToCatalog}
        >
          <Text style={styles.catalogBtnText}>Ir para a Vitrine</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderPedidoItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      />
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
    gap: 16
  },
  orderCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155'
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  orderNumber: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800'
  },
  orderDate: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700'
  },
  clientInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6
  },
  clientInfoText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '600'
  },
  itemsList: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
    gap: 10
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0f172a'
  },
  productThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center'
  },
  productName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600'
  },
  productSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  productItemTotal: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700'
  },
  noItemsText: {
    color: '#64748b',
    fontSize: 13,
    fontStyle: 'italic'
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6
  },
  paymentMethodText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 11
  },
  totalAmount: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '800'
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#243248',
    gap: 6
  },
  addressText: {
    color: '#64748b',
    fontSize: 11,
    flex: 1
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b0f19'
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#0b0f19'
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
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
    marginBottom: 20
  },
  catalogBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12
  },
  catalogBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  secondaryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600'
  }
});

