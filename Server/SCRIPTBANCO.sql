-- ==========================================================
-- SCRIPT BANCO DE DADOS SQLITE - TECHSTORE (LOJA DE ELETRÔNICOS)
-- ==========================================================

PRAGMA foreign_keys = ON;

-- 1. Tabela de Usuários (Clientes e Administradores)
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  senha TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'cliente' CHECK (tipo IN ('cliente', 'admin')),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Categorias
CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT UNIQUE NOT NULL,
  icone TEXT NOT NULL
);

-- 3. Tabela de Produtos (Eletrônicos)
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
);

-- 4. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER,
  total REAL NOT NULL,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Enviado', 'Entregue', 'Cancelado')),
  forma_pagamento TEXT,
  endereco_entrega TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE SET NULL
);

-- 5. Tabela de Itens do Pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id INTEGER NOT NULL,
  produto_id INTEGER,
  quantidade INTEGER NOT NULL,
  preco_unitario REAL NOT NULL,
  FOREIGN KEY (pedido_id) REFERENCES pedidos (id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos (id) ON DELETE SET NULL
);

-- ==========================================================
-- INSERÇÃO DE DADOS INICIAIS (SEEDS)
-- ==========================================================

-- Usuários Padrão
INSERT INTO usuarios (nome, email, senha, tipo) VALUES 
('Administrador Tech', 'admin@loja.com', 'admin123', 'admin'),
('Lucas Silva (Cliente)', 'cliente@loja.com', '123456', 'cliente');

-- Categorias
INSERT INTO categorias (nome, icone) VALUES 
('Smartphones', 'mobile-phone'),
('Notebooks', 'laptop'),
('Áudio & Fones', 'headphones'),
('Gamers', 'gamepad'),
('Smartwatches', 'clock-o'),
('Acessórios', 'plug');

-- Produtos de Eletrônicos
INSERT INTO produtos (nome, descricao, preco, categoria_id, estoque, imagem_url, especificacoes) VALUES
('iPhone 15 Pro Max 256GB', 'Titânio natural, tela Super Retina XDR de 6.7 pol, Chip A17 Pro e câmera de 48MP.', 8999.00, 1, 12, 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&auto=format&fit=crop&q=80', 'Tela 6.7" OLED | 256GB | A17 Pro | Câmera Tripla 48MP | 5G'),
('Samsung Galaxy S24 Ultra 512GB', 'Galaxy AI integrada, câmera de 200MP, corpo em titânio e caneta S Pen.', 7499.00, 1, 15, 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=600&auto=format&fit=crop&q=80', 'Tela 6.8" Dynamic AMOLED | 512GB | Snapdragon 8 Gen 3 | 12GB RAM'),
('MacBook Air M3 15" 16GB 512GB', 'Superleve, bateria com até 18h de duração, tela Liquid Retina brilhante.', 11299.00, 2, 8, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80', 'Chip Apple M3 | 16GB RAM | SSD 512GB | Teclado Magic'),
('Notebook Gamer ASUS ROG Strix G16', 'Intel Core i9 13ª Geração, NVIDIA RTX 4070 8GB, tela 165Hz com Dolby Vision.', 12499.00, 2, 5, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80', 'Intel Core i9 | RTX 4070 | 16GB DDR5 | SSD 1TB NVMe'),
('Sony WH-1000XM5 Noise Cancelling', 'O melhor cancelamento de ruído do mercado, áudio de alta resolução e 30h de bateria.', 2299.00, 3, 20, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', 'Bluetooth 5.2 | ANC Duplo | Bateria 30h | Carregamento Rápido USB-C'),
('Console PlayStation 5 Slim 1TB', 'SSD de ultra-alta velocidade e controle DualSense com feedback tátil.', 3799.00, 4, 10, 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&auto=format&fit=crop&q=80', 'SSD 1TB Ultra-Fast | Ray Tracing 4K 120fps | Controle DualSense');
