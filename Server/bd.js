const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { hashPassword } = require('./security');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco SQLite:', err.message);
  } else {
    console.log('Conectado com sucesso ao SQLite:', dbPath);
  }
});

// Habilitar foreign keys no SQLite
db.run('PRAGMA foreign_keys = ON');

// Promisified helpers para uso limpo com async/await
const dbAsync = {
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  // Inicialização das tabelas e carga inicial de dados (Seed)
  async init() {
    // 1. Tabela de Usuários
    await this.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha TEXT NOT NULL,
        tipo TEXT NOT NULL DEFAULT 'cliente',
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Tabela de Categorias
    await this.run(`
      CREATE TABLE IF NOT EXISTS categorias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT UNIQUE NOT NULL,
        icone TEXT NOT NULL
      )
    `);

    // 3. Tabela de Produtos
    await this.run(`
      CREATE TABLE IF NOT EXISTS produtos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        descricao TEXT,
        preco REAL NOT NULL,
        categoria_id INTEGER,
        estoque INTEGER NOT NULL DEFAULT 0,
        imagem_url TEXT,
        especificacoes TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (categoria_id) REFERENCES categorias (id) ON DELETE SET NULL
      )
    `);

    // 4. Tabela de Pedidos
    await this.run(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER,
        total REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pendente',
        forma_pagamento TEXT,
        endereco_entrega TEXT,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
      )
    `);

    // 5. Tabela de Itens de Pedido
    await this.run(`
      CREATE TABLE IF NOT EXISTS itens_pedido (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pedido_id INTEGER NOT NULL,
        produto_id INTEGER,
        quantidade INTEGER NOT NULL,
        preco_unitario REAL NOT NULL,
        FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
        FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE SET NULL
      )
    `);

    // Seed: Usuários - Garantir admin oficial Cabryello e cliente padrão
    const adminCabryello = await this.get('SELECT * FROM usuarios WHERE email = ?', ['cabryello@gmail.com']);
    if (!adminCabryello) {
      console.log('Criando administrador oficial Cabryello...');
      await this.run(
        `INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`,
        ['Cabryello (Admin MuriloveStore)', 'cabryello@gmail.com', hashPassword('123456'), 'admin']
      );
    } else if (adminCabryello.tipo !== 'admin') {
      await this.run(`UPDATE usuarios SET tipo = 'admin' WHERE email = ?`, ['cabryello@gmail.com']);
    }

    const clientePadrao = await this.get('SELECT * FROM usuarios WHERE email = ?', ['cliente@loja.com']);
    if (!clientePadrao) {
      console.log('Criando cliente padrão...');
      await this.run(
        `INSERT INTO usuarios (nome, email, senha, tipo) VALUES (?, ?, ?, ?)`,
        ['Lucas Silva (Cliente)', 'cliente@loja.com', hashPassword('123456'), 'cliente']
      );
    }

    // Seed: Categorias
    const catCount = await this.get('SELECT COUNT(*) as count FROM categorias');
    if (catCount.count === 0) {
      console.log('Inserindo categorias padrão...');
      const categorias = [
        ['Smartphones', 'mobile-phone'],
        ['Notebooks', 'laptop'],
        ['Áudio & Fones', 'headphones'],
        ['Gamers', 'gamepad'],
        ['Smartwatches', 'clock-o'],
        ['Acessórios', 'plug']
      ];
      for (const [nome, icone] of categorias) {
        await this.run('INSERT INTO categorias (nome, icone) VALUES (?, ?)', [nome, icone]);
      }
    }

    // Seed: Produtos de Eletrônicos
    const prodCount = await this.get('SELECT COUNT(*) as count FROM produtos');
    if (prodCount.count === 0) {
      console.log('Inserindo produtos eletrônicos iniciais...');
      const produtosIniciais = [
        {
          nome: 'iPhone 15 Pro Max 256GB',
          descricao: 'Titânio natural, tela Super Retina XDR de 6.7 pol, Chip A17 Pro com GPU de 6 núcleos e câmera de 48MP.',
          preco: 8999.00,
          categoria_id: 1,
          estoque: 12,
          imagem_url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80',
          especificacoes: 'Tela 6.7" OLED | 256GB | A17 Pro | Câmera Tripla 48MP | 5G'
        },
        {
          nome: 'Samsung Galaxy S24 Ultra 512GB',
          descricao: 'Galaxy AI integrada, câmera de 200MP, corpo em titânio e caneta S Pen inclusa com tela AMOLED 120Hz.',
          preco: 7499.00,
          categoria_id: 1,
          estoque: 15,
          imagem_url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80',
          especificacoes: 'Tela 6.8" Dynamic AMOLED | 512GB | Snapdragon 8 Gen 3 | 12GB RAM'
        },
        {
          nome: 'MacBook Air M3 15" 16GB 512GB',
          descricao: 'Superleve, bateria com até 18h de duração, tela Liquid Retina brilhante e potência incrível para trabalho e criação.',
          preco: 11299.00,
          categoria_id: 2,
          estoque: 8,
          imagem_url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
          especificacoes: 'Chip Apple M3 | 16GB Memória Unificada | SSD 512GB | Teclado Magic'
        },
        {
          nome: 'Notebook Gamer ASUS ROG Strix G16',
          descricao: 'Intel Core i9 13ª Geração, NVIDIA GeForce RTX 4070 8GB, 16GB DDR5 e tela 165Hz com Dolby Vision.',
          preco: 12499.00,
          categoria_id: 2,
          estoque: 5,
          imagem_url: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80',
          especificacoes: 'Intel Core i9-13980HX | RTX 4070 | 16GB DDR5 | SSD 1TB NVMe'
        },
        {
          nome: 'Sony WH-1000XM5 Noise Cancelling',
          descricao: 'O melhor cancelamento de ruído do mercado, áudio de alta resolução, chamadas ultranítidas e 30h de bateria.',
          preco: 2299.00,
          categoria_id: 3,
          estoque: 20,
          imagem_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80',
          especificacoes: 'Bluetooth 5.2 | ANC Duplo | Bateria 30h | Carregamento Rápido USB-C'
        },
        {
          nome: 'Console PlayStation 5 Slim 1TB',
          descricao: 'Experimente carregamento ultrarrápido com SSD de ultra-alta velocidade e imersão mais profunda com feedback tátil.',
          preco: 3799.00,
          categoria_id: 4,
          estoque: 10,
          imagem_url: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80',
          especificacoes: 'SSD 1TB Ultra-Fast | Ray Tracing 4K 120fps | Controle DualSense Incluso'
        },
        {
          nome: 'Apple Watch Series 9 GPS 45mm',
          descricao: 'Chip S9 de ponta, tela mais brilhante, gesto inovador de dois toques e monitoramento avançado de saúde cardíaca e sono.',
          preco: 3999.00,
          categoria_id: 5,
          estoque: 14,
          imagem_url: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&auto=format&fit=crop&q=80',
          especificacoes: 'Tela OLED Always-On | ECG + Oxigênio no Sangue | Resistente à Água 50m'
        },
        {
          nome: 'Teclado Mecânico Logitech G Pro X RGB',
          descricao: 'Switches mecânicos GX Brown táteis, design tenkeyless compacto de torneio e iluminação LIGHTSYNC RGB personalizável.',
          preco: 799.00,
          categoria_id: 6,
          estoque: 25,
          imagem_url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80',
          especificacoes: 'Layout Compacto TKL | Switches Mecânicos | Cabo Destacável | RGB LIGHTSYNC'
        },
        {
          nome: 'Mouse Gamer Razer DeathAdder V3 Pro',
          descricao: 'Sensor óptico Focus Pro de 30K DPI, tecnologia sem fio HyperSpeed ultraveloz e apenas 63g de peso ergonômico.',
          preco: 849.00,
          categoria_id: 6,
          estoque: 18,
          imagem_url: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80',
          especificacoes: '30.000 DPI Óptico | 90 Horas de Bateria | Sem Fio HyperSpeed 2.4GHz'
        }
      ];

      for (const p of produtosIniciais) {
        await this.run(
          `INSERT INTO produtos (nome, descricao, preco, categoria_id, estoque, imagem_url, especificacoes) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [p.nome, p.descricao, p.preco, p.categoria_id, p.estoque, p.imagem_url, p.especificacoes]
        );
      }
    }

    // Seed: Pedido de demonstração se não houver pedidos
    const pedCount = await this.get('SELECT COUNT(*) as count FROM pedidos');
    if (pedCount.count === 0) {
      console.log('Inserindo pedido de demonstração...');
      const pedidoRes = await this.run(
        `INSERT INTO pedidos (usuario_id, total, status, forma_pagamento, endereco_entrega)
         VALUES (?, ?, ?, ?, ?)`,
        [2, 2299.00, 'Pago', 'PIX', 'Av. Paulista, 1000, Apto 42 - São Paulo/SP']
      );
      await this.run(
        `INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario)
         VALUES (?, ?, ?, ?)`,
        [pedidoRes.lastID, 5, 1, 2299.00]
      );
    }
  }
};

module.exports = dbAsync;