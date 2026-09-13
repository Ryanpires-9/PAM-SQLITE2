const express = require('express');
const cors = require('cors');
const db = require('./bd');
const {
  hashPassword,
  verifyPassword,
  generateToken,
  authMiddleware,
  adminOnly
} = require('./security');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Log simples de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Inicializar banco de dados SQLite e tabelas
db.init()
  .then(() => console.log('Banco de dados SQLite inicializado com sucesso!'))
  .catch((err) => console.error('Falha ao inicializar o banco:', err));

// ==========================================
// STATUS DA API (Público)
// ==========================================
app.get('/', (req, res) => {
  res.json({
    app: 'MuriloveStore API - Loja de Eletrônicos',
    status: 'online',
    sqlite: 'conectado'
  });
});

// ==========================================
// AUTENTICAÇÃO E CONTAS
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    const usuario = await db.get(
      'SELECT id, nome, email, senha, tipo FROM usuarios WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (!usuario || !verifyPassword(senha, usuario.senha)) {
      return res.status(401).json({ erro: 'Credenciais inválidas. Verifique seu e-mail e senha.' });
    }

    const token = generateToken(usuario);

    res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo
      }
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve conter no mínimo 6 caracteres.' });
    }

    const existe = await db.get('SELECT id FROM usuarios WHERE email = ?', [email.trim().toLowerCase()]);
    if (existe) {
      return res.status(409).json({ erro: 'Já existe uma conta cadastrada com este e-mail. Por favor, faça login.' });
    }

    // Hash criptografado da senha antes de inserir no SQLite
    const senhaHash = hashPassword(senha);

    const result = await db.run(
      'INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)',
      [nome.trim(), email.trim().toLowerCase(), senhaHash, 'cliente']
    );

    const novoUsuario = await db.get(
      'SELECT id, nome, email, tipo FROM usuarios WHERE id = ?',
      [result.lastID]
    );

    const token = generateToken(novoUsuario);

    res.status(201).json({
      mensagem: 'Conta criada com sucesso!',
      token,
      usuario: novoUsuario
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// ==========================================
// CATEGORIAS & VITRINE PÚBLICA
// ==========================================
app.get('/api/categorias', async (req, res) => {
  try {
    const categorias = await db.all('SELECT * FROM categorias ORDER BY id ASC');
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/produtos', async (req, res) => {
  try {
    const { categoria, busca } = req.query;
    let sql = `
      SELECT p.*, c.nome as categoria_nome, c.icone as categoria_icone 
      FROM produtos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (categoria && categoria !== '0' && categoria !== 'todos') {
      sql += ' AND p.categoria_id = ?';
      params.push(categoria);
    }

    if (busca && busca.trim()) {
      sql += ' AND (p.nome LIKE ? OR p.descricao LIKE ? OR p.especificacoes LIKE ?)';
      const termo = `%${busca.trim()}%`;
      params.push(termo, termo, termo);
    }

    sql += ' ORDER BY p.id DESC';
    const produtos = await db.all(sql, params);
    res.json(produtos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/produtos/:id', async (req, res) => {
  try {
    const produto = await db.get(
      `SELECT p.*, c.nome as categoria_nome, c.icone as categoria_icone 
       FROM produtos p
       LEFT JOIN categorias c ON p.categoria_id = c.id
       WHERE p.id = ?`,
      [req.params.id]
    );

    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }
    res.json(produto);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// ==========================================
// ROTAS DE PEDIDOS (Clientes e Checkout)
// ==========================================
app.post('/api/pedidos', async (req, res) => {
  try {
    const { usuario_id, itens, forma_pagamento, endereco_entrega } = req.body;

    if (!usuario_id || !itens || !Array.isArray(itens) || itens.length === 0) {
      return res.status(400).json({ erro: 'Dados do pedido incompletos ou carrinho vazio.' });
    }

    // Calcular o total e validar estoque real no SQLite
    let totalCalculado = 0;
    const itensValidados = [];

    for (const item of itens) {
      const prod = await db.get('SELECT * FROM produtos WHERE id = ?', [item.produto_id]);
      if (!prod) {
        return res.status(404).json({ erro: `Produto ID ${item.produto_id} não encontrado.` });
      }

      if (prod.estoque < item.quantidade) {
        return res.status(400).json({
          erro: `Estoque insuficiente para o produto "${prod.nome}". Disponível: ${prod.estoque}`
        });
      }

      const precoUnit = prod.preco;
      totalCalculado += precoUnit * item.quantidade;
      itensValidados.push({
        produto_id: prod.id,
        nome: prod.nome,
        quantidade: item.quantidade,
        preco_unitario: precoUnit
      });
    }

    // Desconto de 5% se for PIX
    if (forma_pagamento === 'PIX') {
      totalCalculado = totalCalculado * 0.95;
    }

    // INSERÇÃO REAL NO BANCO SQLITE (Tabela pedidos)
    const pedidoResult = await db.run(
      `INSERT INTO pedidos (usuario_id, total, status, forma_pagamento, endereco_entrega)
       VALUES (?, ?, ?, ?, ?)`,
      [usuario_id, totalCalculado, 'Pago', forma_pagamento || 'PIX', endereco_entrega || 'Endereço Principal']
    );

    const pedidoId = pedidoResult.lastID;

    // INSERÇÃO REAL DOS ITENS (Tabela itens_pedido) & BAIXA DE ESTOQUE
    for (const item of itensValidados) {
      await db.run(
        `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
         VALUES (?, ?, ?, ?)`,
        [pedidoId, item.produto_id, item.quantidade, item.preco_unitario]
      );

      await db.run(
        'UPDATE produtos SET estoque = MAX(0, estoque - ?) WHERE id = ?',
        [item.quantidade, item.produto_id]
      );
    }

    const pedidoCompleto = await db.get(
      `SELECT p.*, u.nome as cliente_nome, u.email as cliente_email
       FROM pedidos p
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.id = ?`,
      [pedidoId]
    );

    const itensRegistrados = await db.all(
      `SELECT ip.*, pr.nome as produto_nome, pr.imagem_url
       FROM itens_pedido ip
       LEFT JOIN produtos pr ON ip.produto_id = pr.id
       WHERE ip.pedido_id = ?`,
      [pedidoId]
    );

    pedidoCompleto.itens = itensRegistrados;

    res.status(201).json({
      mensagem: 'Pedido realizado e gravado no SQLite com sucesso!',
      pedido: pedidoCompleto
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Listagem de pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const { usuario_id } = req.query;
    let sql = `
      SELECT p.*, u.nome as cliente_nome, u.email as cliente_email
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
    `;
    const params = [];

    if (usuario_id) {
      sql += ' WHERE p.usuario_id = ?';
      params.push(usuario_id);
    }

    sql += ' ORDER BY p.id DESC';
    const pedidos = await db.all(sql, params);

    for (const ped of pedidos) {
      ped.itens = await db.all(
        `SELECT ip.*, pr.nome as produto_nome, pr.imagem_url 
         FROM itens_pedido ip
         LEFT JOIN produtos pr ON ip.produto_id = pr.id
         WHERE ip.pedido_id = ?`,
        [ped.id]
      );
    }

    res.json(pedidos);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// ==========================================
// ROTAS RESTRITAS DO ADMINISTRADOR (adminOnly)
// ==========================================

// Criar produto no SQLite
app.post('/api/produtos', adminOnly, async (req, res) => {
  try {
    const { nome, descricao, preco, categoria_id, estoque, imagem_url, especificacoes } = req.body;

    if (!nome || preco === undefined) {
      return res.status(400).json({ erro: 'Nome e Preço são campos obrigatórios.' });
    }

    const result = await db.run(
      `INSERT INTO produtos (nome, descricao, preco, categoria_id, estoque, imagem_url, especificacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        nome.trim(),
        descricao || '',
        parseFloat(preco) || 0,
        categoria_id || 1,
        parseInt(estoque) || 0,
        imagem_url || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80',
        especificacoes || ''
      ]
    );

    const novoProduto = await db.get('SELECT * FROM produtos WHERE id = ?', [result.lastID]);
    res.status(201).json({
      mensagem: 'Produto inserido com sucesso no SQLite!',
      produto: novoProduto
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Atualizar produto no SQLite
app.put('/api/produtos/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, preco, categoria_id, estoque, imagem_url, especificacoes } = req.body;

    const produtoAtual = await db.get('SELECT * FROM produtos WHERE id = ?', [id]);
    if (!produtoAtual) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    await db.run(
      `UPDATE produtos 
       SET nome = ?, descricao = ?, preco = ?, categoria_id = ?, estoque = ?, imagem_url = ?, especificacoes = ?
       WHERE id = ?`,
      [
        nome !== undefined ? nome.trim() : produtoAtual.nome,
        descricao !== undefined ? descricao : produtoAtual.descricao,
        preco !== undefined ? parseFloat(preco) : produtoAtual.preco,
        categoria_id !== undefined ? categoria_id : produtoAtual.categoria_id,
        estoque !== undefined ? parseInt(estoque) : produtoAtual.estoque,
        imagem_url !== undefined ? imagem_url : produtoAtual.imagem_url,
        especificacoes !== undefined ? especificacoes : produtoAtual.especificacoes,
        id
      ]
    );

    const atualizado = await db.get('SELECT * FROM produtos WHERE id = ?', [id]);
    res.json({
      mensagem: 'Produto atualizado com sucesso!',
      produto: atualizado
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Excluir produto no SQLite
app.delete('/api/produtos/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const produto = await db.get('SELECT id FROM produtos WHERE id = ?', [id]);
    if (!produto) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    await db.run('DELETE FROM produtos WHERE id = ?', [id]);
    res.json({ mensagem: 'Produto excluído com sucesso do SQLite!', id: Number(id) });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Mudar status de pedido
app.patch('/api/pedidos/:id/status', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const statusValidos = ['Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado'];
    if (!status || !statusValidos.includes(status)) {
      return res.status(400).json({ erro: `Status inválido. Escolha: ${statusValidos.join(', ')}` });
    }

    const pedido = await db.get('SELECT * FROM pedidos WHERE id = ?', [id]);
    if (!pedido) {
      return res.status(404).json({ erro: 'Pedido não encontrado.' });
    }

    await db.run('UPDATE pedidos SET status = ? WHERE id = ?', [status, id]);
    const atualizado = await db.get('SELECT * FROM pedidos WHERE id = ?', [id]);

    res.json({
      mensagem: `Status do pedido #${id} atualizado para "${status}".`,
      pedido: atualizado
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Métricas do Dashboard Admin
app.get('/api/admin/dashboard', adminOnly, async (req, res) => {
  try {
    const faturamentoRes = await db.get(`
      SELECT SUM(total) as total_faturado, COUNT(id) as total_pedidos 
      FROM pedidos 
      WHERE status != 'Cancelado'
    `);

    const produtosRes = await db.get(`
      SELECT COUNT(id) as total_produtos,
             SUM(CASE WHEN estoque <= 5 THEN 1 ELSE 0 END) as estoque_critico,
             SUM(CASE WHEN estoque = 0 THEN 1 ELSE 0 END) as sem_estoque
      FROM produtos
    `);

    const clientesRes = await db.get(`
      SELECT COUNT(id) as total_clientes FROM usuarios WHERE tipo = 'cliente'
    `);

    const ultimosPedidos = await db.all(`
      SELECT p.id, p.total, p.status, p.criado_em, u.nome as cliente_nome
      FROM pedidos p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      ORDER BY p.id DESC
      LIMIT 5
    `);

    const produtosEstoqueBaixo = await db.all(`
      SELECT id, nome, preco, estoque, imagem_url 
      FROM produtos 
      WHERE estoque <= 10 
      ORDER BY estoque ASC 
      LIMIT 6
    `);

    res.json({
      metricas: {
        faturamento_total: faturamentoRes.total_faturado || 0,
        total_pedidos: faturamentoRes.total_pedidos || 0,
        total_produtos: produtosRes.total_produtos || 0,
        estoque_critico: produtosRes.estoque_critico || 0,
        sem_estoque: produtosRes.sem_estoque || 0,
        total_clientes: clientesRes.total_clientes || 0
      },
      ultimos_pedidos: ultimosPedidos,
      produtos_alerta_estoque: produtosEstoqueBaixo
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// ==========================================
// GESTÃO DE USUÁRIOS (Admin: Listar e Promover)
// ==========================================
app.get('/api/admin/usuarios', adminOnly, async (req, res) => {
  try {
    const usuarios = await db.all(
      'SELECT id, nome, email, tipo, criado_em FROM usuarios ORDER BY id ASC'
    );
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.patch('/api/admin/usuarios/:id/tipo', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo } = req.body;

    if (!['admin', 'cliente'].includes(tipo)) {
      return res.status(400).json({ erro: 'Tipo deve ser "admin" ou "cliente".' });
    }

    await db.run('UPDATE usuarios SET tipo = ? WHERE id = ?', [tipo, id]);
    const atualizado = await db.get(
      'SELECT id, nome, email, tipo FROM usuarios WHERE id = ?',
      [id]
    );

    res.json({
      mensagem: `Usuário #${id} atualizado para o cargo "${tipo}".`,
      usuario: atualizado
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Admin: Editar Dados Completos de Qualquer Usuário
app.put('/api/admin/usuarios/:id', adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, tipo, senha } = req.body;

    const userAtual = await db.get('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (!userAtual) {
      return res.status(404).json({ erro: 'Usuário não encontrado no sistema.' });
    }

    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e e-mail são campos obrigatórios.' });
    }

    const emailNorm = email.trim().toLowerCase();
    const emailExistente = await db.get(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [emailNorm, id]
    );
    if (emailExistente) {
      return res.status(409).json({ erro: 'Este e-mail já pertence a outro usuário.' });
    }

    let senhaHash = userAtual.senha;
    if (senha && senha.trim().length > 0) {
      if (senha.trim().length < 6) {
        return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres.' });
      }
      senhaHash = hashPassword(senha.trim());
    }

    const tipoFinal = ['admin', 'cliente'].includes(tipo) ? tipo : userAtual.tipo;

    await db.run(
      `UPDATE usuarios 
       SET nome = ?, email = ?, tipo = ?, senha = ? 
       WHERE id = ?`,
      [nome.trim(), emailNorm, tipoFinal, senhaHash, id]
    );

    const atualizado = await db.get(
      'SELECT id, nome, email, tipo, criado_em FROM usuarios WHERE id = ?',
      [id]
    );

    res.json({
      mensagem: `Usuário "${atualizado.nome}" atualizado com sucesso!`,
      usuario: atualizado
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// ==========================================
// CONFIGURAÇÃO DE PERFIL DO USUÁRIO (Autenticado)
// ==========================================
app.put('/api/usuarios/perfil', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nome, email, senha } = req.body;

    if (!nome || !email) {
      return res.status(400).json({ erro: 'Nome e e-mail são obrigatórios.' });
    }

    const emailNorm = email.trim().toLowerCase();

    // Verificar se outro usuário já usa esse e-mail
    const emailExistente = await db.get(
      'SELECT id FROM usuarios WHERE email = ? AND id != ?',
      [emailNorm, userId]
    );
    if (emailExistente) {
      return res.status(409).json({ erro: 'Este e-mail já está sendo utilizado por outra conta.' });
    }

    if (senha && senha.trim().length > 0) {
      if (senha.trim().length < 6) {
        return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres.' });
      }
      const senhaHash = hashPassword(senha.trim());
      await db.run(
        'UPDATE usuarios SET nome = ?, email = ?, senha = ? WHERE id = ?',
        [nome.trim(), emailNorm, senhaHash, userId]
      );
    } else {
      await db.run(
        'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?',
        [nome.trim(), emailNorm, userId]
      );
    }

    const usuarioAtualizado = await db.get(
      'SELECT id, nome, email, tipo, criado_em FROM usuarios WHERE id = ?',
      [userId]
    );

    const novoToken = generateToken(usuarioAtualizado);

    res.json({
      mensagem: 'Perfil atualizado com sucesso no banco de dados!',
      usuario: usuarioAtualizado,
      token: novoToken
    });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Inicialização do servidor
app.listen(port, '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(`  MuriloveStore API Server Segura online!`);
  console.log(`  Local:   http://localhost:${port}`);
  console.log(`  Rede:    http://192.168.0.12:${port}`);
  console.log(`=========================================`);
});