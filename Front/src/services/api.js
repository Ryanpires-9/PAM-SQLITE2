// Serviço central de comunicação com a API REST Express + SQLite

let currentBaseUrl = 'http://192.168.0.12:3000';
let currentAuthToken = null;

export const getBaseUrl = () => currentBaseUrl;

export const setBaseUrl = (newUrl) => {
  if (newUrl) {
    let cleanUrl = newUrl.trim();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    currentBaseUrl = cleanUrl;
  }
  return currentBaseUrl;
};

export const setAuthToken = (token) => {
  currentAuthToken = token;
};

export const getAuthToken = () => currentAuthToken;

// Requisição genérica com timeout, token JWT seguro e tratamento de erros
async function request(endpoint, options = {}) {
  const url = `${currentBaseUrl}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 9000);

  try {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers || {})
    };

    if (currentAuthToken) {
      headers['Authorization'] = `Bearer ${currentAuthToken}`;
    }

    const config = {
      ...options,
      headers,
      signal: controller.signal
    };

    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.erro || `Erro HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Tempo de resposta esgotado. Verifique se o backend está ligado.');
    }
    throw error;
  }
}

// Métodos da API
export const api = {
  setAuthToken,
  getAuthToken,

  // Status
  async ping() {
    return request('/');
  },

  // Autenticação
  async login(email, senha) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha })
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  async register(nome, email, senha) {
    const data = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha })
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  // Categorias
  async getCategorias() {
    return request('/api/categorias');
  },

  // Produtos (Vitrine pública)
  async getProdutos(categoriaId, busca) {
    const params = new URLSearchParams();
    if (categoriaId && categoriaId !== 'todos' && categoriaId !== 0) {
      params.append('categoria', categoriaId);
    }
    if (busca && busca.trim()) {
      params.append('busca', busca.trim());
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/api/produtos${query}`);
  },

  async getProduto(id) {
    return request(`/api/produtos/${id}`);
  },

  // Pedidos
  async criarPedido(pedidoData) {
    return request('/api/pedidos', {
      method: 'POST',
      body: JSON.stringify(pedidoData)
    });
  },

  async getPedidos(usuarioId = null) {
    const query = usuarioId ? `?usuario_id=${usuarioId}` : '';
    return request(`/api/pedidos${query}`);
  },

  // Rotas restritas do Administrador (requerem Token JWT no header)
  async criarProduto(produtoData) {
    return request('/api/produtos', {
      method: 'POST',
      body: JSON.stringify(produtoData)
    });
  },

  async atualizarProduto(id, produtoData) {
    return request(`/api/produtos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(produtoData)
    });
  },

  async excluirProduto(id) {
    return request(`/api/produtos/${id}`, {
      method: 'DELETE'
    });
  },

  async atualizarStatusPedido(pedidoId, status) {
    return request(`/api/pedidos/${pedidoId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  async getDashboard() {
    return request('/api/admin/dashboard');
  },

  async getUsuariosAdmin() {
    return request('/api/admin/usuarios');
  },

  async atualizarPapelUsuario(id, tipo) {
    return request(`/api/admin/usuarios/${id}/tipo`, {
      method: 'PATCH',
      body: JSON.stringify({ tipo })
    });
  },

  async editarUsuarioAdmin(id, dados) {
    return request(`/api/admin/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
  },

  async updateProfile(dados) {
    const data = await request('/api/usuarios/perfil', {
      method: 'PUT',
      body: JSON.stringify(dados)
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  }
};
