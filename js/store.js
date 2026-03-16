;(function (global) {
  const STORAGE_KEY = 'ninja_cart_v1';
  const ORDER_KEY = 'ninja_last_order_v1';

  const CATALOG = {
    cup:   { id: 'cup',   name: 'Cup',          price: 28 },
    bowl:  { id: 'bowl',  name: 'Bowl',         price: 34 },
    plate: { id: 'plate', name: 'Dinner Plate', price: 42 },
    vase:  { id: 'vase',  name: 'Vase',         price: 68 },
  };

  function readCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function writeCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart || {}));
      dispatchCartChanged();
    } catch {
      // ignore
    }
  }

  function dispatchCartChanged() {
    try {
      const ev = new Event('ninja:cart-changed');
      window.dispatchEvent(ev);
    } catch {
      // ignore
    }
  }

  function getCartCount() {
    const cart = readCart();
    return Object.values(cart).reduce((sum, qty) => sum + Number(qty || 0), 0);
  }

  function addToCart(id, qty) {
    const item = CATALOG[id];
    if (!item) return;
    const cart = readCart();
    const current = Number(cart[id] || 0);
    const next = current + Number(qty || 1);
    cart[id] = next <= 0 ? 0 : next;
    if (cart[id] === 0) delete cart[id];
    writeCart(cart);
  }

  function setQty(id, qty) {
    const item = CATALOG[id];
    if (!item) return;
    const cart = readCart();
    const n = Math.max(0, Number(qty || 0));
    if (!n) delete cart[id];
    else cart[id] = n;
    writeCart(cart);
  }

  function clearCart() {
    writeCart({});
  }

  function cartLines() {
    const cart = readCart();
    const lines = [];
    Object.keys(cart).forEach((id) => {
      const qty = Number(cart[id] || 0);
      if (!qty) return;
      const prod = CATALOG[id];
      if (!prod) return;
      const lineTotal = prod.price * qty;
      lines.push({
        id,
        name: prod.name,
        price: prod.price,
        qty,
        lineTotal,
      });
    });
    return lines;
  }

  function calcSubtotal(lines) {
    return (lines || cartLines()).reduce((sum, l) => sum + Number(l.lineTotal || 0), 0);
  }

  function calcShipping(subtotal, mode) {
    if (!subtotal) return 0;
    if (mode === 'pickup') return 0;
    // simple flat-rate shipping with free threshold
    if (subtotal >= 120) return 0;
    return 8; // €8 flat
  }

  function calcDiscount(subtotal, code) {
    if (!subtotal) return 0;
    const c = String(code || '').trim().toUpperCase();
    if (c === 'NINJA10') {
      return Math.round(subtotal * 0.1);
    }
    return 0;
  }

  function formatEUR(cents) {
    const value = Number(cents || 0);
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  function saveLastOrder(order) {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(order || {}));
    } catch {
      // ignore
    }
  }

  function readLastOrder() {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  global.NinjaStore = {
    CATALOG,
    readCart,
    writeCart,
    getCartCount,
    addToCart,
    setQty,
    clearCart,
    cartLines,
    calcSubtotal,
    calcShipping,
    calcDiscount,
    formatEUR,
    saveLastOrder,
    readLastOrder,
  };
})(window);

