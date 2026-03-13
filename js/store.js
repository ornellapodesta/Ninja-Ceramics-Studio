// Simple front-end cart + checkout logic (localStorage).
(function () {
  const CART_KEY = "ninja_cart_v1";
  const ORDER_KEY = "ninja_last_order_v1";

  const CATALOG = {
    "pure-drop": { id: "pure-drop", name: "Pure Drop", price: 120 },
    "tall-ovoid": { id: "tall-ovoid", name: "Tall Ovoid", price: 79 },
    "scolumn": { id: "scolumn", name: "Scolumn", price: 52 },
    "horizon": { id: "horizon", name: "Horizon", price: 68 },
  };

  function readCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (!raw) return { items: {} };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return { items: {} };
      if (!parsed.items || typeof parsed.items !== "object") return { items: {} };
      return parsed;
    } catch {
      return { items: {} };
    }
  }

  function writeCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent("ninja:cart-changed"));
  }

  function getCartCount(cart = readCart()) {
    return Object.values(cart.items).reduce((sum, qty) => sum + (Number(qty) || 0), 0);
  }

  function addToCart(productId, qty = 1) {
    const product = CATALOG[productId];
    if (!product) return;
    const cart = readCart();
    cart.items[productId] = (Number(cart.items[productId]) || 0) + (Number(qty) || 0);
    if (cart.items[productId] <= 0) delete cart.items[productId];
    writeCart(cart);
  }

  function setQty(productId, qty) {
    const product = CATALOG[productId];
    if (!product) return;
    const cart = readCart();
    const n = Number(qty) || 0;
    if (n <= 0) delete cart.items[productId];
    else cart.items[productId] = n;
    writeCart(cart);
  }

  function clearCart() {
    writeCart({ items: {} });
  }

  function cartLines(cart = readCart()) {
    return Object.entries(cart.items)
      .map(([id, qty]) => {
        const p = CATALOG[id];
        if (!p) return null;
        const q = Number(qty) || 0;
        if (q <= 0) return null;
        return { ...p, qty: q, lineTotal: q * p.price };
      })
      .filter(Boolean);
  }

  function calcSubtotal(lines) {
    return lines.reduce((sum, l) => sum + l.lineTotal, 0);
  }

  function calcShipping({ method, zone }) {
    if (method === "pickup") return 0;
    // simple flat rates
    if (zone === "spain") return 6;
    if (zone === "eu") return 12;
    return 20; // international
  }

  function calcDiscount({ code, subtotal }) {
    const c = (code || "").trim().toUpperCase();
    if (!c) return 0;
    if (c === "NINJA10") return Math.round(subtotal * 0.1 * 100) / 100;
    if (c === "FREESHIP") return 0; // handled in UI by setting shipping to 0 if desired
    return 0;
  }

  function formatEUR(n) {
    return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
  }

  function saveLastOrder(order) {
    localStorage.setItem(ORDER_KEY, JSON.stringify(order));
  }

  function readLastOrder() {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  window.NinjaStore = {
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
})();

