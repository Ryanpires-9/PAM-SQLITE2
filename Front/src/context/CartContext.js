import React, { createContext, useContext, useState } from 'react';

const CartContext = createContext({});

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const addToCart = (produto, quantidade = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.produto.id === produto.id);

      if (existingIndex > -1) {
        const updated = [...prevItems];
        const novaQtd = updated[existingIndex].quantidade + quantidade;
        // Limitar pela quantidade em estoque se disponível
        if (produto.estoque && novaQtd > produto.estoque) {
          updated[existingIndex].quantidade = produto.estoque;
        } else {
          updated[existingIndex].quantidade = novaQtd;
        }
        return updated;
      }

      return [...prevItems, { produto, quantidade: Math.min(quantidade, produto.estoque || 1) }];
    });
  };

  const removeFromCart = (produtoId) => {
    setItems((prev) => prev.filter((item) => item.produto.id !== produtoId));
  };

  const updateQuantity = (produtoId, quantidade) => {
    if (quantidade <= 0) {
      removeFromCart(produtoId);
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.produto.id === produtoId) {
          const max = item.produto.estoque || 99;
          return { ...item, quantidade: Math.min(quantidade, max) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, item) => acc + item.quantidade, 0);

  const totalValue = items.reduce((acc, item) => {
    const preco = parseFloat(item.produto.preco) || 0;
    return acc + preco * item.quantidade;
  }, 0);

  const formatPrice = (val) => {
    return Number(val || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalValue,
        formattedTotal: formatPrice(totalValue),
        formatPrice
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);

