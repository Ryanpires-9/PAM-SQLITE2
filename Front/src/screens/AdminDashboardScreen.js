import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../services/api';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';

export default function AdminDashboardScreen({ onExitAdmin }) {
  const { formatPrice } = useCart();
  const { colors, isDark } = useTheme();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('metricas'); // 'metricas' | 'produtos' | 'pedidos' | 'usuarios'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados de dados
  const [dashboardData, setDashboardData] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [usuarios, setUsuarios] = useState([]);

  // Modal de Edição de Usuário pelo Admin
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formUserNome, setFormUserNome] = useState('');
  const [formUserEmail, setFormUserEmail] = useState('');
  const [formUserTipo, setFormUserTipo] = useState('cliente');
  const [formUserSenha, setFormUserSenha] = useState('');
  const [savingUser, setSavingUser] = useState(false);

  // Estado do Modal de Produto (Criar / Editar)
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formNome, setFormNome] = useState('');
  const [formDescricao, setFormDescricao] = useState('');
  const [formPreco, setFormPreco] = useState('');
  const [formEstoque, setFormEstoque] = useState('');
  const [formCategoriaId, setFormCategoriaId] = useState(1);
  const [formImagemUrl, setFormImagemUrl] = useState('');
  const [formEspecificacoes, setFormEspecificacoes] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Busca na lista de produtos
  const [buscaProduto, setBuscaProduto] = useState('');

  useEffect(() => {
    carregarTudo();
  }, []);

  const carregarTudo = async () => {
    try {
      setLoading(true);
      const [dash, prods, peds, cats, users] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getProdutos().catch(() => []),
        api.getPedidos().catch(() => []),
        api.getCategorias().catch(() => []),
        api.getUsuariosAdmin().catch(() => [])
      ]);

      setDashboardData(dash);
      setProdutos(prods || []);
      setPedidos(peds || []);
      setCategorias(cats || []);
      setUsuarios(users || []);
    } catch (error) {
      console.error('Erro ao carregar dados do admin:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados administrativos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    carregarTudo();
  };

  // Abrir modal para novo produto
  const handleNovoProduto = () => {
    setEditingProductId(null);
    setFormNome('');
    setFormDescricao('');
    setFormPreco('');
    setFormEstoque('10');
    setFormCategoriaId(categorias[0]?.id || 1);
    setFormImagemUrl(
      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80'
    );
    setFormEspecificacoes('');
    setProductModalVisible(true);
  };

  // Abrir modal para editar produto
  const handleEditarProduto = (prod) => {
    setEditingProductId(prod.id);
    setFormNome(prod.nome);
    setFormDescricao(prod.descricao || '');
    setFormPreco(prod.preco.toString());
    setFormEstoque(prod.estoque.toString());
    setFormCategoriaId(prod.categoria_id || 1);
    setFormImagemUrl(prod.imagem_url || '');
    setFormEspecificacoes(prod.especificacoes || '');
    setProductModalVisible(true);
  };

  // Salvar produto (INSERT ou UPDATE)
  const handleSalvarProduto = async () => {
    if (!formNome.trim() || !formPreco.trim()) {
      Alert.alert('Campos Obrigatórios', 'Informe pelo menos o nome e o preço do eletrônico.');
      return;
    }

    const precoNum = parseFloat(formPreco.replace(',', '.'));
    if (isNaN(precoNum) || precoNum <= 0) {
      Alert.alert('Preço Inválido', 'Insira um valor numérico válido para o preço.');
      return;
    }

    try {
      setSavingProduct(true);
      const payload = {
        nome: formNome.trim(),
        descricao: formDescricao.trim(),
        preco: precoNum,
        categoria_id: formCategoriaId,
        estoque: parseInt(formEstoque) || 0,
        imagem_url: formImagemUrl.trim(),
        especificacoes: formEspecificacoes.trim()
      };

      if (editingProductId) {
        await api.atualizarProduto(editingProductId, payload);
        Alert.alert('Sucesso', 'Produto atualizado com sucesso!');
      } else {
        await api.criarProduto(payload);
        Alert.alert('Sucesso', 'Novo produto cadastrado com sucesso!');
      }

      setProductModalVisible(false);
      carregarTudo();
    } catch (error) {
      Alert.alert('Erro ao Salvar', error.message);
    } finally {
      setSavingProduct(false);
    }
  };

  // Escolher imagem da galeria usando expo-image-picker
  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          'Permissão Necessária',
          'É necessário autorizar o acesso à galeria para selecionar uma foto.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        setFormImagemUrl(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Erro ao Escolher Imagem', err.message);
    }
  };

  // Excluir produto
  const handleExcluirProduto = (prod) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Deseja realmente remover o produto "${prod.nome}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.excluirProduto(prod.id);
              Alert.alert('Removido', 'Produto excluído com sucesso.');
              carregarTudo();
            } catch (error) {
              Alert.alert('Erro', error.message);
            }
          }
        }
      ]
    );
  };

  // Atualizar status de pedido
  const handleMudarStatusPedido = async (pedidoId, novoStatus) => {
    try {
      await api.atualizarStatusPedido(pedidoId, novoStatus);
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, status: novoStatus } : p))
      );
      // Atualizar métricas se necessário
      const dash = await api.getDashboard().catch(() => null);
      if (dash) setDashboardData(dash);
    } catch (error) {
      Alert.alert('Erro ao atualizar status', error.message);
    }
  };

  const handleAlternarCargo = async (userItem) => {
    const novoTipo = userItem.tipo === 'admin' ? 'cliente' : 'admin';
    try {
      await api.atualizarPapelUsuario(userItem.id, novoTipo);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === userItem.id ? { ...u, tipo: novoTipo } : u))
      );
      Alert.alert(
        'Cargo Atualizado',
        `O usuário "${userItem.nome}" agora possui privilégios de ${novoTipo === 'admin' ? 'ADMINISTRADOR' : 'CLIENTE'}.`
      );
    } catch (error) {
      Alert.alert('Erro ao Alterar', error.message);
    }
  };

  const handleAbrirEditarUsuario = (userItem) => {
    setEditingUser(userItem);
    setFormUserNome(userItem.nome || '');
    setFormUserEmail(userItem.email || '');
    setFormUserTipo(userItem.tipo || 'cliente');
    setFormUserSenha('');
    setUserModalVisible(true);
  };

  const handleSalvarUsuario = async () => {
    if (!formUserNome.trim() || !formUserEmail.trim()) {
      showToast('Nome e e-mail são campos obrigatórios.', 'error', 'Campos Obrigatórios');
      return;
    }

    if (formUserSenha.trim().length > 0 && formUserSenha.trim().length < 6) {
      showToast('A nova senha deve ter no mínimo 6 caracteres.', 'error', 'Senha Curta');
      return;
    }

    setSavingUser(true);
    try {
      const payload = {
        nome: formUserNome.trim(),
        email: formUserEmail.trim().toLowerCase(),
        tipo: formUserTipo
      };
      if (formUserSenha.trim().length >= 6) {
        payload.senha = formUserSenha.trim();
      }

      const res = await api.editarUsuarioAdmin(editingUser.id, payload);
      setUsuarios((prev) =>
        prev.map((u) => (u.id === editingUser.id ? res.usuario : u))
      );
      showToast(`Dados de ${res.usuario.nome} atualizados!`, 'success', 'Usuário Atualizado');
      setUserModalVisible(false);
    } catch (err) {
      showToast(err.message || 'Erro ao atualizar usuário.', 'error', 'Falha ao Salvar');
    } finally {
      setSavingUser(false);
    }
  };

  const produtosFiltrados = produtos.filter(
    (p) =>
      p.nome.toLowerCase().includes(buscaProduto.toLowerCase()) ||
      (p.categoria_nome && p.categoria_nome.toLowerCase().includes(buscaProduto.toLowerCase()))
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Barra de Topo do Administrador */}
      <View style={[styles.adminTopHeader, { backgroundColor: isDark ? '#161c2e' : '#f5f3ff', borderColor: colors.cardBorder }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.adminIconBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
          </View>
          <View style={{ marginLeft: 8 }}>
            <Text style={[styles.adminTopTitle, { color: colors.text }]}>Painel Administrativo</Text>
            <Text style={[styles.adminTopSubtitle, { color: '#a78bfa' }]}>Modo Lojista • Controle Geral</Text>
          </View>
        </View>

        {onExitAdmin && (
          <TouchableOpacity style={styles.btnSairAdmin} onPress={onExitAdmin}>
            <Ionicons name="storefront-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
            <Text style={styles.btnSairAdminText}>Voltar à Loja</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Abas Administrativas com Scroll Horizontal (Responsivo) */}
      <View style={[styles.tabBarContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBarScroll}
        >
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'metricas' && styles.tabBtnActive]}
            onPress={() => setActiveTab('metricas')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="bar-chart"
              size={16}
              color={activeTab === 'metricas' ? '#ffffff' : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                activeTab === 'metricas' && styles.tabTextActive
              ]}
            >
              Métricas
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'produtos' && styles.tabBtnActive]}
            onPress={() => setActiveTab('produtos')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="cube"
              size={16}
              color={activeTab === 'produtos' ? '#ffffff' : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                activeTab === 'produtos' && styles.tabTextActive
              ]}
            >
              Produtos ({produtos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pedidos' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pedidos')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="receipt"
              size={16}
              color={activeTab === 'pedidos' ? '#ffffff' : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                activeTab === 'pedidos' && styles.tabTextActive
              ]}
            >
              Pedidos ({pedidos.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'usuarios' && styles.tabBtnActive]}
            onPress={() => setActiveTab('usuarios')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="people"
              size={16}
              color={activeTab === 'usuarios' ? '#ffffff' : colors.textMuted}
            />
            <Text
              style={[
                styles.tabText,
                { color: colors.textMuted },
                activeTab === 'usuarios' && styles.tabTextActive
              ]}
            >
              Usuários ({usuarios.length})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Conteúdo da Aba 1: Métricas & Indicadores */}
      {activeTab === 'metricas' && (
        <ScrollView
          style={styles.tabContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#38bdf8"
            />
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator size="large" color="#38bdf8" style={{ marginTop: 40 }} />
          ) : (
            <>
              <Text style={styles.sectionHeader}>Visão Geral da Loja</Text>

              {/* Grid de Cards de Métricas */}
              <View style={styles.kpiGrid}>
                {/* Faturamento */}
                <View style={[styles.kpiCard, { borderColor: '#10b981' }]}>
                  <View style={styles.kpiHeader}>
                    <Text style={styles.kpiLabel}>Faturamento Total</Text>
                    <Ionicons name="cash-outline" size={20} color="#10b981" />
                  </View>
                  <Text style={[styles.kpiValue, { color: '#10b981' }]}>
                    {formatPrice(dashboardData?.metricas?.faturamento_total || 0)}
                  </Text>
                  <Text style={styles.kpiSub}>Em pedidos confirmados</Text>
                </View>

                {/* Total de Pedidos */}
                <View style={[styles.kpiCard, { borderColor: '#0284c7' }]}>
                  <View style={styles.kpiHeader}>
                    <Text style={styles.kpiLabel}>Total de Pedidos</Text>
                    <Ionicons name="bag-check-outline" size={20} color="#38bdf8" />
                  </View>
                  <Text style={styles.kpiValue}>
                    {dashboardData?.metricas?.total_pedidos || 0}
                  </Text>
                  <Text style={styles.kpiSub}>Realizados na plataforma</Text>
                </View>

                {/* Produtos Cadastrados */}
                <View style={[styles.kpiCard, { borderColor: '#8b5cf6' }]}>
                  <View style={styles.kpiHeader}>
                    <Text style={styles.kpiLabel}>Produtos Ativos</Text>
                    <Ionicons name="hardware-chip-outline" size={20} color="#a78bfa" />
                  </View>
                  <Text style={styles.kpiValue}>
                    {dashboardData?.metricas?.total_produtos || 0}
                  </Text>
                  <Text style={styles.kpiSub}>Em estoque e catálogo</Text>
                </View>

                {/* Estoque Crítico */}
                <View style={[styles.kpiCard, { borderColor: '#f59e0b' }]}>
                  <View style={styles.kpiHeader}>
                    <Text style={styles.kpiLabel}>Estoque Baixo</Text>
                    <Ionicons name="warning-outline" size={20} color="#f59e0b" />
                  </View>
                  <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>
                    {dashboardData?.metricas?.estoque_critico || 0}
                  </Text>
                  <Text style={styles.kpiSub}>Com 5 unidades ou menos</Text>
                </View>
              </View>

              {/* Alerta de Produtos com Estoque Baixo */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 12 }}>
                <Ionicons name="warning" size={17} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={[styles.sectionHeader, { marginTop: 0, marginBottom: 0 }]}>
                  Alerta de Reposição de Estoque
                </Text>
              </View>
              {dashboardData?.produtos_alerta_estoque?.length > 0 ? (
                dashboardData.produtos_alerta_estoque.map((item) => (
                  <View key={item.id.toString()} style={styles.alertCard}>
                    <Image source={{ uri: item.imagem_url }} style={styles.alertThumb} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.alertName} numberOfLines={1}>
                        {item.nome}
                      </Text>
                      <Text style={styles.alertPrice}>{formatPrice(item.preco)}</Text>
                    </View>
                    <View style={styles.stockPill}>
                      <Text style={styles.stockPillText}>{item.estoque} un.</Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>Todos os produtos estão com estoque regular.</Text>
              )}

              {/* Atalho de Ação Rápida */}
              <TouchableOpacity style={styles.quickAddBanner} onPress={handleNovoProduto}>
                <Ionicons name="add-circle" size={28} color="#38bdf8" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.quickAddTitle}>Cadastrar Novo Eletrônico</Text>
                  <Text style={styles.quickAddSub}>
                    Adicione fotos, especificações, preço e estoque
                  </Text>
                </View>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}

      {/* Conteúdo da Aba 2: Gestão de Produtos (CRUD) */}
      {activeTab === 'produtos' && (
        <View style={styles.tabContent}>
          {/* Barra Superior: Busca e Botão + Novo */}
          <View style={styles.productCrudHeader}>
            <View style={styles.crudSearchBar}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.crudSearchInput}
                placeholder="Filtrar por nome ou categoria..."
                placeholderTextColor="#64748b"
                value={buscaProduto}
                onChangeText={setBuscaProduto}
              />
            </View>

            <TouchableOpacity style={styles.btnNovoProduto} onPress={handleNovoProduto}>
              <Ionicons name="add" size={20} color="#ffffff" />
              <Text style={styles.btnNovoProdutoText}>Novo</Text>
            </TouchableOpacity>
          </View>

          {/* Lista de Produtos para Edição/Exclusão */}
          <FlatList
            data={produtosFiltrados}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.crudProductRow}>
                <Image source={{ uri: item.imagem_url }} style={styles.crudThumb} />
                <View style={styles.crudInfo}>
                  <Text style={styles.crudName} numberOfLines={1}>
                    {item.nome}
                  </Text>
                  <Text style={styles.crudCategory}>{item.categoria_nome || 'Eletrônico'}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <Text style={styles.crudPrice}>{formatPrice(item.preco)}</Text>
                    <Text style={[styles.crudStock, item.estoque <= 5 && { color: '#f59e0b' }]}>
                      • Estoque: {item.estoque}
                    </Text>
                  </View>
                </View>

                {/* Botões de Ação */}
                <View style={styles.crudActions}>
                  <TouchableOpacity
                    style={styles.actionEditBtn}
                    onPress={() => handleEditarProduto(item)}
                  >
                    <Ionicons name="pencil" size={18} color="#38bdf8" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionDeleteBtn}
                    onPress={() => handleExcluirProduto(item)}
                  >
                    <Ionicons name="trash" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        </View>
      )}

      {/* Conteúdo da Aba 3: Gestão de Pedidos & Status */}
      {activeTab === 'pedidos' && (
        <FlatList
          data={pedidos}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.adminOrderCard}>
              <View style={styles.adminOrderTop}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={styles.adminOrderId}>Pedido #{item.id}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name="person" size={13} color="#38bdf8" style={{ marginRight: 5 }} />
                    <Text style={styles.adminOrderClient} numberOfLines={1}>
                      {item.cliente_nome || 'Cliente'} ({item.cliente_email || 'email@teste.com'})
                    </Text>
                  </View>
                </View>
                <Text style={styles.adminOrderTotal}>{formatPrice(item.total)}</Text>
              </View>

              {/* Status Atual */}
              <View style={styles.statusChangeRow}>
                <Text style={styles.statusChangeLabel}>Mudar Status:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                  {['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado'].map((statusOpt) => {
                    const isSelected = item.status === statusOpt;
                    return (
                      <TouchableOpacity
                        key={statusOpt}
                        style={[
                          styles.statusOptionPill,
                          isSelected && styles.statusOptionPillActive
                        ]}
                        onPress={() => handleMudarStatusPedido(item.id, statusOpt)}
                      >
                        <Text
                          style={[
                            styles.statusOptionPillText,
                            isSelected && styles.statusOptionPillTextActive
                          ]}
                        >
                          {statusOpt}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={[styles.adminOrderMeta, { flexDirection: 'row', alignItems: 'center' }]}>
                <Ionicons name="card-outline" size={13} color="#94a3b8" style={{ marginRight: 5 }} />
                <Text style={styles.adminOrderMetaText}>
                  {item.forma_pagamento || 'PIX'} • {item.itens?.length || 0} produtos
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Conteúdo da Aba 4: Gestão de Usuários (Promover / Rebaixar) */}
      {activeTab === 'usuarios' && (
        <FlatList
          data={usuarios}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ marginBottom: 8 }}>
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Controle de Acesso de Usuários</Text>
              <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 10 }}>
                Gerencie quem possui permissão de Administrador para gerenciar o catálogo da MuriloveStore.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={[styles.userRowCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              <View style={[styles.userIconCircle, { backgroundColor: item.tipo === 'admin' ? 'rgba(124, 58, 237, 0.2)' : colors.accentLight }]}>
                <Ionicons
                  name={item.tipo === 'admin' ? 'shield-checkmark' : 'person'}
                  size={20}
                  color={item.tipo === 'admin' ? '#a78bfa' : colors.accent}
                />
              </View>

              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.userRowName, { color: colors.text }]}>{item.nome}</Text>
                <Text style={[styles.userRowEmail, { color: colors.textMuted }]}>{item.email}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                  <Ionicons
                    name={item.tipo === 'admin' ? 'shield-checkmark' : 'person'}
                    size={12}
                    color={item.tipo === 'admin' ? '#a78bfa' : colors.accent}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[styles.userRowRole, { color: item.tipo === 'admin' ? '#a78bfa' : colors.accent, marginTop: 0 }]}>
                    {item.tipo === 'admin' ? 'Administrador' : 'Cliente Comum'}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <TouchableOpacity
                  style={[styles.btnActionEditUser, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}
                  onPress={() => handleAbrirEditarUsuario(item)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="pencil" size={15} color={colors.accent} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.btnPromover,
                    item.tipo === 'admin'
                      ? { backgroundColor: '#2b1b36', borderColor: '#ef4444' }
                      : { backgroundColor: colors.accentLight, borderColor: colors.accent }
                  ]}
                  onPress={() => handleAlternarCargo(item)}
                >
                  <Text
                    style={[
                      styles.btnPromoverText,
                      { color: item.tipo === 'admin' ? '#ef4444' : colors.accent }
                    ]}
                  >
                    {item.tipo === 'admin' ? 'Remover' : 'Admin'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Modal de Adicionar / Editar Produto */}
      <Modal
        visible={productModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProductModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalFormContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={editingProductId ? 'create-outline' : 'add-circle-outline'}
                    size={20}
                    color="#38bdf8"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.modalTitle}>
                    {editingProductId ? 'Editar Eletrônico' : 'Novo Eletrônico'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setProductModalVisible(false)}
                  style={{ padding: 4 }}
                >
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Nome */}
              <Text style={styles.fieldLabel}>Nome do Produto *</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ex: Teclado Sem Fio Mecânico"
                placeholderTextColor="#64748b"
                value={formNome}
                onChangeText={setFormNome}
              />

              {/* Categoria */}
              <Text style={styles.fieldLabel}>Categoria *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {categorias.map((cat) => (
                  <TouchableOpacity
                    key={cat.id.toString()}
                    style={[
                      styles.categorySelectChip,
                      formCategoriaId === cat.id && styles.categorySelectChipActive
                    ]}
                    onPress={() => setFormCategoriaId(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categorySelectText,
                        formCategoriaId === cat.id && styles.categorySelectTextActive
                      ]}
                    >
                      {cat.nome}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Preço e Estoque */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Preço (R$) *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Ex: 899.90"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={formPreco}
                    onChangeText={setFormPreco}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>Estoque (un.) *</Text>
                  <TextInput
                    style={styles.fieldInput}
                    placeholder="Ex: 15"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={formEstoque}
                    onChangeText={setFormEstoque}
                  />
                </View>
              </View>

              {/* Foto do Eletrônico com Upload da Galeria */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, marginBottom: 6 }}>
                <Text style={styles.fieldLabel}>Foto do Eletrônico</Text>
                <TouchableOpacity style={styles.btnPickGallery} onPress={handlePickImage} activeOpacity={0.8}>
                  <Ionicons name="images-outline" size={15} color="#38bdf8" style={{ marginRight: 5 }} />
                  <Text style={styles.btnPickGalleryText}>Escolher da Galeria</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.fieldInput}
                placeholder="Cole um link https:// ou escolha da galeria acima"
                placeholderTextColor="#64748b"
                value={formImagemUrl}
                onChangeText={setFormImagemUrl}
              />

              {/* Preview da Imagem */}
              {formImagemUrl ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: formImagemUrl }} style={styles.formPreviewImage} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Ionicons name="checkmark-circle" size={14} color="#10b981" style={{ marginRight: 4 }} />
                    <Text style={styles.previewLabel}>Foto pronta para salvar</Text>
                  </View>
                </View>
              ) : null}

              {/* Especificações Técnicas */}
              <Text style={styles.fieldLabel}>Especificações Técnicas</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Ex: Bluetooth 5.3 | Bateria 40h | RGB"
                placeholderTextColor="#64748b"
                value={formEspecificacoes}
                onChangeText={setFormEspecificacoes}
              />

              {/* Descrição */}
              <Text style={styles.fieldLabel}>Descrição Comercial</Text>
              <TextInput
                style={[styles.fieldInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Detalhes completos sobre o produto..."
                placeholderTextColor="#64748b"
                multiline
                value={formDescricao}
                onChangeText={setFormDescricao}
              />

              {/* Botão Salvar */}
              <TouchableOpacity
                style={[styles.btnSalvar, savingProduct && { opacity: 0.6 }]}
                onPress={handleSalvarProduto}
                disabled={savingProduct}
              >
                {savingProduct ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnSalvarText}>
                      {editingProductId ? 'Salvar Alterações do Produto' : 'Cadastrar Produto'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Editar Usuário pelo Admin */}
      <Modal
        visible={userModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setUserModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalFormContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={[styles.modalUserBadge, { backgroundColor: colors.accentLight }]}>
                  <Ionicons name="person" size={18} color={colors.accent} />
                </View>
                <View style={{ marginLeft: 10 }}>
                  <Text style={[styles.modalTitle, { color: colors.text }]}>Editar Usuário</Text>
                  <Text style={[styles.previewLabel, { color: colors.textMuted }]}>
                    ID #{editingUser?.id}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setUserModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 14 }}>
              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Nome Completo</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
                value={formUserNome}
                onChangeText={setFormUserNome}
                placeholder="Nome do usuário"
                placeholderTextColor={colors.textSubtle}
              />

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>E-mail de Acesso</Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
                value={formUserEmail}
                onChangeText={setFormUserEmail}
                placeholder="email@exemplo.com"
                placeholderTextColor={colors.textSubtle}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Cargo / Permissão</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 12 }}>
                <TouchableOpacity
                  style={[
                    styles.roleSelectorPill,
                    { backgroundColor: colors.bg, borderColor: colors.cardBorder },
                    formUserTipo === 'cliente' && styles.roleSelectorPillActiveCliente
                  ]}
                  onPress={() => setFormUserTipo('cliente')}
                >
                  <Ionicons name="person" size={15} color={formUserTipo === 'cliente' ? '#38bdf8' : colors.textMuted} />
                  <Text style={[styles.roleSelectorPillText, formUserTipo === 'cliente' && { color: '#38bdf8', fontWeight: '800' }]}>
                    Cliente
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleSelectorPill,
                    { backgroundColor: colors.bg, borderColor: colors.cardBorder },
                    formUserTipo === 'admin' && styles.roleSelectorPillActiveAdmin
                  ]}
                  onPress={() => setFormUserTipo('admin')}
                >
                  <Ionicons name="shield-checkmark" size={15} color={formUserTipo === 'admin' ? '#a78bfa' : colors.textMuted} />
                  <Text style={[styles.roleSelectorPillText, formUserTipo === 'admin' && { color: '#a78bfa', fontWeight: '800' }]}>
                    Administrador
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
                Redefinir Senha (opcional)
              </Text>
              <TextInput
                style={[styles.fieldInput, { backgroundColor: colors.bg, color: colors.text, borderColor: colors.cardBorder }]}
                value={formUserSenha}
                onChangeText={setFormUserSenha}
                placeholder="Deixe em branco para manter a atual"
                placeholderTextColor={colors.textSubtle}
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.btnSalvar, { backgroundColor: colors.accent, marginTop: 16 }]}
                onPress={handleSalvarUsuario}
                disabled={savingUser}
              >
                {savingUser ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                    <Text style={styles.btnSalvarText}>Salvar Dados do Usuário</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
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
  adminTopHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161c2e',
    borderBottomWidth: 1,
    borderColor: '#334155'
  },
  adminIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#7c3aed',
    justifyContent: 'center',
    alignItems: 'center'
  },
  adminTopTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800'
  },
  adminTopSubtitle: {
    color: '#a78bfa',
    fontSize: 11,
    fontWeight: '600'
  },
  btnSairAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#312e81',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#818cf8'
  },
  btnSairAdminText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700'
  },
  tabBarContainer: {
    borderBottomWidth: 1,
    borderColor: '#334155'
  },
  tabBarScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center'
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },
  tabBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8'
  },
  tabText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600'
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '800'
  },
  tabContent: {
    flex: 1,
    padding: 16
  },
  sectionHeader: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 12
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20
  },
  kpiCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    width: '48%',
    borderWidth: 1
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  kpiLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'
  },
  kpiValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2
  },
  kpiSub: {
    color: '#64748b',
    fontSize: 11
  },
  alertCard: {
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155'
  },
  alertThumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: '#0f172a'
  },
  alertName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700'
  },
  alertPrice: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2
  },
  stockPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12
  },
  stockPillText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700'
  },
  emptyText: {
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 16
  },
  quickAddBanner: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#0284c7',
    marginTop: 10,
    marginBottom: 24
  },
  quickAddTitle: {
    color: '#38bdf8',
    fontSize: 15,
    fontWeight: '700'
  },
  quickAddSub: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  // Produtos CRUD
  productCrudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14
  },
  crudSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  crudSearchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    marginLeft: 8
  },
  btnNovoProduto: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4
  },
  btnNovoProdutoText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700'
  },
  crudProductRow: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  crudThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#0f172a'
  },
  crudInfo: {
    flex: 1,
    marginLeft: 12
  },
  crudName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700'
  },
  crudCategory: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2
  },
  crudPrice: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '800'
  },
  crudStock: {
    color: '#10b981',
    fontSize: 12,
    fontWeight: '600'
  },
  crudActions: {
    flexDirection: 'row',
    gap: 8
  },
  actionEditBtn: {
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8'
  },
  actionDeleteBtn: {
    backgroundColor: '#0f172a',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ef4444'
  },
  // Pedidos Admin
  adminOrderCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155'
  },
  adminOrderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  adminOrderId: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800'
  },
  adminOrderClient: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2
  },
  adminOrderTotal: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '800',
    flexShrink: 0
  },
  statusChangeRow: {
    marginVertical: 6,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155'
  },
  statusChangeLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700'
  },
  statusOptionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  statusOptionPillActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8'
  },
  statusOptionPillText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'
  },
  statusOptionPillTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  adminOrderMeta: {
    marginTop: 6
  },
  adminOrderMetaText: {
    color: '#64748b',
    fontSize: 12
  },
  // Modal de Formulário
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end'
  },
  modalFormContainer: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '92%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '800'
  },
  fieldLabel: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6
  },
  fieldInput: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12
  },
  categorySelectChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  categorySelectChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#38bdf8'
  },
  categorySelectText: {
    color: '#94a3b8',
    fontSize: 12
  },
  categorySelectTextActive: {
    color: '#ffffff',
    fontWeight: '700'
  },
  btnPickGallery: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38bdf8'
  },
  btnPickGalleryText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700'
  },
  previewContainer: {
    marginBottom: 12,
    alignItems: 'center'
  },
  formPreviewImage: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: '#0f172a'
  },
  previewLabel: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4
  },
  btnSalvar: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24
  },
  btnSalvarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  },
  userRowCard: {
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1
  },
  userIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center'
  },
  userRowName: {
    fontSize: 15,
    fontWeight: '800'
  },
  userRowEmail: {
    fontSize: 12,
    marginTop: 2
  },
  userRowRole: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4
  },
  btnPromover: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1
  },
  btnPromoverText: {
    fontSize: 12,
    fontWeight: '800'
  },
  btnActionEditUser: {
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  modalUserBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center'
  },
  roleSelectorPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6
  },
  roleSelectorPillActiveCliente: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8'
  },
  roleSelectorPillActiveAdmin: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: '#8b5cf6'
  },
  roleSelectorPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8'
  }
});

