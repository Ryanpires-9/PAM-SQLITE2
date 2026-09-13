import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import AnimatedPressable from '../components/AnimatedPressable';
import AddedToCartModal from '../components/AddedToCartModal';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = (width - 40) / 2;

// Banners Promocionais estilo Microsoft Store
const BANNERS = [
  {
    id: 1,
    tag: 'OFERTA ESPECIAL',
    titulo: 'Dispositivos de Alta Performance',
    sub: 'Smartphones e Notebooks com frete grátis para todo o Brasil',
    gradient: ['#030712', '#0d2855', '#1b4f91', '#3b7bc4'],
    icone: 'flash'
  },
  {
    id: 2,
    tag: 'GAMING & CONSOLES',
    titulo: 'PlayStation 5 & Periféricos',
    sub: 'Parcele em até 10x sem juros ou 5% no PIX',
    gradient: ['#1e1035', '#3b1c6e', '#5b21b6', '#7c3aed'],
    icone: 'game-controller'
  }
];

export default function HomeScreen({ onNavigateToCart }) {
  const { addToCart, formatPrice } = useCart();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [selectedCategoria, setSelectedCategoria] = useState('todos');
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal de Detalhes Completo
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  // Modal de Produto Adicionado ao Carrinho
  const [addedModalVisible, setAddedModalVisible] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState(null);
  const [lastAddedQty, setLastAddedQty] = useState(1);

  useEffect(() => {
    carregarDados();
  }, [selectedCategoria]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [prodsData, catsData] = await Promise.all([
        api.getProdutos(selectedCategoria, busca),
        api.getCategorias().catch(() => [])
      ]);

      setProdutos(prodsData || []);
      if (catsData && catsData.length > 0) {
        setCategorias([{ id: 'todos', nome: 'Todos', icone: 'apps' }, ...catsData]);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    carregarDados();
  };

  const handleQuickAdd = (produto) => {
    if (produto.estoque <= 0) {
      Alert.alert('Esgotado', 'Produto sem unidades disponíveis no momento.');
      return;
    }
    addToCart(produto, 1);
    setLastAddedProduct(produto);
    setLastAddedQty(1);
    setAddedModalVisible(true);
  };

  const openProductDetail = (produto) => {
    setSelectedProduct(produto);
    setSelectedQuantity(1);
    setModalVisible(true);
  };

  const getCategoryIcon = (nome) => {
    const n = (nome || '').toLowerCase();
    if (n.includes('smart')) return 'phone-portrait-outline';
    if (n.includes('noteb')) return 'laptop-outline';
    if (n.includes('áudio') || n.includes('fone')) return 'headset-outline';
    if (n.includes('game')) return 'game-controller-outline';
    if (n.includes('watch') || n.includes('relógio')) return 'watch-outline';
    if (n.includes('acess')) return 'hardware-chip-outline';
    return 'grid-outline';
  };

  // Renderização dos cards em grid moderno de 2 colunas
  const renderProductCard = ({ item }) => {
    const isOutOfStock = item.estoque <= 0;
    const preco = parseFloat(item.preco) || 0;
    const precoOriginal = preco * 1.15;
    const parcela = preco / 10;

    return (
      <AnimatedPressable
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => openProductDetail(item)}
      >
        <View style={styles.imageWrap}>
          <Image
            source={{ uri: item.imagem_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600' }}
            style={styles.cardImage}
            resizeMode="cover"
          />

          <View style={styles.tagContainer}>
            <View style={styles.discountTag}>
              <Text style={styles.discountTagText}>-15% OFF</Text>
            </View>
            {item.estoque <= 5 && item.estoque > 0 && (
              <View style={styles.lowStockTag}>
                <Text style={styles.lowStockText}>{item.estoque} un.</Text>
              </View>
            )}
            {isOutOfStock && (
              <View style={styles.outOfStockTag}>
                <Text style={styles.outOfStockText}>Esgotado</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={[styles.categoryLabel, { color: colors.accent }]} numberOfLines={1}>
            {item.categoria_nome || 'Eletrônicos'}
          </Text>

          <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={2}>
            {item.nome}
          </Text>

          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={[styles.ratingScore, { color: colors.text }]}>4.9</Text>
            <Text style={[styles.ratingCount, { color: colors.textSubtle }]}>(140+)</Text>
          </View>

          <Text style={[styles.originalPrice, { color: colors.textSubtle }]}>
            {formatPrice(precoOriginal)}
          </Text>
          <Text style={[styles.currentPrice, { color: colors.accent }]}>
            {formatPrice(preco)}
          </Text>
          <Text style={[styles.pixNotice, { color: colors.success }]}>
            no PIX à vista
          </Text>
          <Text style={[styles.installmentNotice, { color: colors.textMuted }]}>
            ou 10x de {formatPrice(parcela)}
          </Text>

          <AnimatedPressable
            style={[
              styles.buyBtn,
              { backgroundColor: colors.accent },
              isOutOfStock && styles.buyBtnDisabled
            ]}
            onPress={() => handleQuickAdd(item)}
            disabled={isOutOfStock}
          >
            <Ionicons name="cart-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.buyBtnText}>{isOutOfStock ? 'Esgotado' : 'Comprar'}</Text>
          </AnimatedPressable>
        </View>
      </AnimatedPressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Lista Principal com Cabeçalho */}
      <FlatList
        data={produtos}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderProductCard}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListHeaderComponent={
          <View>
            {/* Barra de Localização e Benefícios */}
            <View style={[styles.topSubBar, { backgroundColor: colors.bgSecondary, borderColor: colors.cardBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 6 }}>
                <Ionicons name="location-sharp" size={14} color={colors.accent} />
                <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
                  Entrega: <Text style={{ color: colors.text, fontWeight: '700' }}>São Paulo - SP</Text>
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                <Text style={[styles.locationText, { color: '#10b981', fontWeight: '700' }]}>
                  Garantia 12 Meses
                </Text>
              </View>
            </View>

            {/* Barra de Busca */}
            <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <Ionicons name="search" size={18} color={colors.textSubtle} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Buscar eletrônicos, marcas ou modelos..."
                placeholderTextColor={colors.textSubtle}
                value={busca}
                onChangeText={setBusca}
                onSubmitEditing={carregarDados}
                returnKeyType="search"
              />
              {busca.length > 0 && (
                <TouchableOpacity onPress={() => { setBusca(''); setTimeout(carregarDados, 50); }}>
                  <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
                </TouchableOpacity>
              )}
            </View>

            {/* Banner com Gradiente Suave de Dispersão */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bannersScrollContent}
              snapToInterval={width - 32 + 12}
              decelerationRate="fast"
              snapToAlignment="start"
            >
              {BANNERS.map((banner) => (
                <LinearGradient
                  key={banner.id}
                  colors={banner.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bannerCard}
                >
                  <View style={styles.bannerInfo}>
                    <View style={styles.bannerTagBadge}>
                      <Text style={styles.bannerTagText}>{banner.tag}</Text>
                    </View>
                    <Text style={styles.bannerTitle}>{banner.titulo}</Text>
                    <Text style={styles.bannerSub}>{banner.sub}</Text>
                  </View>
                  <Ionicons name={banner.icone} size={48} color="rgba(255,255,255,0.2)" />
                </LinearGradient>
              ))}
            </ScrollView>

            {/* Categorias Circulares */}
            <View style={styles.categoriesSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {categorias.map((cat) => {
                  const isSelected = selectedCategoria === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id.toString()}
                      style={styles.categoryCircleItem}
                      onPress={() => setSelectedCategoria(cat.id)}
                    >
                      <View
                        style={[
                          styles.categoryIconCircle,
                          { backgroundColor: colors.card, borderColor: colors.cardBorder },
                          isSelected && { backgroundColor: colors.accent, borderColor: colors.accent }
                        ]}
                      >
                        <Ionicons
                          name={getCategoryIcon(cat.nome)}
                          size={22}
                          color={isSelected ? '#ffffff' : colors.accent}
                        />
                      </View>
                      <Text
                        style={[
                          styles.categoryName,
                          { color: colors.textMuted },
                          isSelected && { color: colors.accent, fontWeight: '800' }
                        ]}
                        numberOfLines={2}
                      >
                        {cat.nome}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Título de Seção */}
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="sparkles" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  {selectedCategoria === 'todos' ? 'Catálogo de Eletrônicos' : `Categoria: ${categorias.find(c => c.id === selectedCategoria)?.nome || ''}`}
                </Text>
              </View>
              <Text style={[styles.productCountText, { color: colors.textSubtle }]}>
                {produtos.length} itens encontrados
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyCenter}>
              <ActivityIndicator size="large" color={colors.accent} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Carregando eletrônicos...</Text>
            </View>
          ) : (
            <View style={styles.emptyCenter}>
              <Ionicons name="cube-outline" size={54} color={colors.textSubtle} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum produto encontrado</Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Tente buscar com outro termo.</Text>
            </View>
          )
        }
      />

      {/* Modal de Detalhes do Produto - Altura Total Fixa e Scrollável */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.card,
                height: height * 0.88 // Garante altura visível total sem colapsar!
              }
            ]}
          >
            {selectedProduct && (
              <View style={{ flex: 1 }}>
                {/* Barra de Topo do Modal */}
                <View style={[styles.modalTopBar, { borderBottomColor: colors.cardBorder }]}>
                  <View style={styles.modalDragHandle} />
                  <TouchableOpacity
                    onPress={() => setModalVisible(false)}
                    style={styles.modalCloseBtn}
                  >
                    <Ionicons name="close" size={24} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                {/* Área de Conteúdo 100% Scrollável */}
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  showsVerticalScrollIndicator={true}
                >
                  <Image
                    source={{ uri: selectedProduct.imagem_url }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />

                  <View style={styles.modalDetails}>
                    <Text style={[styles.modalCategory, { color: colors.accent }]}>
                      {selectedProduct.categoria_nome || 'Eletrônicos'}
                    </Text>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>
                      {selectedProduct.nome}
                    </Text>

                    {/* Caixa de Preço */}
                    <View style={[styles.modalPriceBox, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                      <Text style={[styles.modalOriginalPrice, { color: colors.textSubtle }]}>
                        De {formatPrice(selectedProduct.preco * 1.15)}
                      </Text>
                      <Text style={[styles.modalPrice, { color: colors.accent }]}>
                        {formatPrice(selectedProduct.preco)}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                        <Ionicons name="flash" size={13} color={colors.success} style={{ marginRight: 4 }} />
                        <Text style={[styles.modalPixNotice, { color: colors.success }]}>
                          À vista no PIX com 5% de desconto extra
                        </Text>
                      </View>
                    </View>

                    {/* Ficha Técnica Detalhada */}
                    {selectedProduct.especificacoes ? (
                      <View style={[styles.specBox, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                        <Text style={[styles.specBoxTitle, { color: colors.accent }]}>
                          Especificações Técnicas
                        </Text>
                        <Text style={[styles.specBoxContent, { color: colors.text }]}>
                          {selectedProduct.especificacoes}
                        </Text>
                      </View>
                    ) : null}

                    {/* Descrição Comercial */}
                    <View style={styles.descSection}>
                      <Text style={[styles.descTitle, { color: colors.text }]}>
                        Descrição do Produto
                      </Text>
                      <Text style={[styles.descContent, { color: colors.textMuted }]}>
                        {selectedProduct.descricao || 'Sem descrição cadastrada.'}
                      </Text>
                    </View>

                    {/* Selos de Confiança */}
                    <View style={styles.trustBadges}>
                      <View style={styles.trustItem}>
                        <Ionicons name="shield-checkmark-outline" size={18} color={colors.success} />
                        <Text style={[styles.trustText, { color: colors.text }]}>
                          Garantia Oficial de 12 meses
                        </Text>
                      </View>
                      <View style={styles.trustItem}>
                        <Ionicons name="cube-outline" size={18} color={colors.accent} />
                        <Text style={[styles.trustText, { color: colors.text }]}>
                          {selectedProduct.estoque > 0
                            ? `Estoque em tempo real: ${selectedProduct.estoque} unidades disponíveis`
                            : 'Produto esgotado'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ScrollView>

                {/* Barra Inferior Fixa com Botão Único e Seletor */}
                <View style={[styles.modalBottomAction, { backgroundColor: colors.bgSecondary, borderTopColor: colors.cardBorder }]}>
                  <View style={[styles.modalQtyControls, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => setSelectedQuantity(Math.max(1, selectedQuantity - 1))}
                    >
                      <Ionicons name="remove" size={16} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.qtyText, { color: colors.text }]}>{selectedQuantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() =>
                        setSelectedQuantity(
                          Math.min(selectedProduct.estoque || 99, selectedQuantity + 1)
                        )
                      }
                      disabled={selectedQuantity >= selectedProduct.estoque}
                    >
                      <Ionicons name="add" size={16} color={colors.text} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.modalBuyButton,
                      { backgroundColor: colors.accent },
                      selectedProduct.estoque <= 0 && styles.buyBtnDisabled
                    ]}
                    disabled={selectedProduct.estoque <= 0}
                    onPress={() => {
                      addToCart(selectedProduct, selectedQuantity);
                      setModalVisible(false);
                      setLastAddedProduct(selectedProduct);
                      setLastAddedQty(selectedQuantity);
                      setAddedModalVisible(true);
                    }}
                  >
                    <Ionicons name="bag-check" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.modalBuyButtonText}>
                      {selectedProduct.estoque > 0
                        ? `Adicionar • ${formatPrice(selectedProduct.preco * selectedQuantity)}`
                        : 'Esgotado'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação: Adicionado ao Carrinho */}
      <AddedToCartModal
        visible={addedModalVisible}
        product={lastAddedProduct}
        quantity={lastAddedQty}
        onClose={() => setAddedModalVisible(false)}
        onGoToCart={() => {
          setAddedModalVisible(false);
          if (onNavigateToCart) onNavigateToCart();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  topSubBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  locationText: {
    fontSize: 12
  },
  themeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4
  },
  themeToggleText: {
    fontSize: 11,
    fontWeight: '700'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  searchInput: {
    flex: 1,
    fontSize: 14
  },
  bannersScrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16
  },
  bannerCard: {
    width: width - 32,
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden'
  },
  bannerInfo: {
    flex: 1
  },
  bannerTagBadge: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  bannerTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2
  },
  bannerSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12
  },
  categoriesSection: {
    marginBottom: 14
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 12
  },
  categoryCircleItem: {
    alignItems: 'center',
    width: 76
  },
  categoryIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 6
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 14
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800'
  },
  productCountText: {
    fontSize: 12
  },
  listContent: {
    paddingBottom: 48
  },
  columnWrapper: {
    paddingHorizontal: 16,
    justifyContent: 'space-between',
    marginBottom: 14
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1
  },
  imageWrap: {
    width: '100%',
    height: 140,
    backgroundColor: '#0a0f1d',
    position: 'relative'
  },
  cardImage: {
    width: '100%',
    height: '100%'
  },
  tagContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    gap: 4
  },
  discountTag: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  discountTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800'
  },
  lowStockTag: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  lowStockText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700'
  },
  outOfStockTag: {
    backgroundColor: '#64748b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  outOfStockText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700'
  },
  cardBody: {
    padding: 10
  },
  categoryLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 2
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    height: 36,
    lineHeight: 18
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
    gap: 3
  },
  ratingScore: {
    fontSize: 11,
    fontWeight: '700'
  },
  ratingCount: {
    fontSize: 10
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through'
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: '800'
  },
  pixNotice: {
    fontSize: 10,
    fontWeight: '700'
  },
  installmentNotice: {
    fontSize: 10,
    marginBottom: 8
  },
  buyBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8
  },
  buyBtnDisabled: {
    backgroundColor: '#64748b',
    opacity: 0.5
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyCenter: {
    alignItems: 'center',
    padding: 40
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4
  },
  // Modal Sheet Corrigido com Altura Definida
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden'
  },
  modalTopBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    position: 'relative'
  },
  modalDragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#94a3b8'
  },
  modalCloseBtn: {
    position: 'absolute',
    right: 16,
    top: 10,
    padding: 4
  },
  modalImage: {
    width: '100%',
    height: 230,
    backgroundColor: '#0a0f1d'
  },
  modalDetails: {
    padding: 18
  },
  modalCategory: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 12
  },
  modalPriceBox: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1
  },
  modalOriginalPrice: {
    fontSize: 13,
    textDecorationLine: 'line-through'
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 2
  },
  modalPixNotice: {
    fontSize: 12,
    fontWeight: '700'
  },
  specBox: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1
  },
  specBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6
  },
  specBoxContent: {
    fontSize: 13,
    lineHeight: 20
  },
  descSection: {
    marginBottom: 16
  },
  descTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6
  },
  descContent: {
    fontSize: 13,
    lineHeight: 20
  },
  trustBadges: {
    gap: 8,
    marginBottom: 14
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  trustText: {
    fontSize: 12
  },
  modalBottomAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12
  },
  modalQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1
  },
  qtyBtn: {
    padding: 8
  },
  qtyText: {
    fontSize: 15,
    fontWeight: '700',
    minWidth: 24,
    textAlign: 'center'
  },
  modalBuyButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10
  },
  modalBuyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  }
});
