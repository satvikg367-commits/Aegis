import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { getStatusBadgeClass } from "../utils/status";

export default function CsdPage() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);

  const load = async () => {
    try {
      const payload = await apiRequest("/csd", { token });
      setData({
        ...payload,
        products: Array.isArray(payload?.products) ? payload.products : [],
        popularItems: Array.isArray(payload?.popularItems) ? payload.popularItems : [],
        recentOrders: Array.isArray(payload?.recentOrders) ? payload.recentOrders : [],
        benefitHighlights: Array.isArray(payload?.benefitHighlights) ? payload.benefitHighlights : []
      });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  const addToCart = (product) => {
    setMessage("");
    setCart((current) => {
      const existing = current.find((item) => item.productId === product.id);
      if (existing) {
        return current.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...current,
        {
          productId: product.id,
          name: product.name,
          quantity: 1,
          subsidizedPrice: Number(product.subsidizedPrice || 0),
          mrp: Number(product.mrp || product.subsidizedPrice || 0)
        }
      ];
    });
  };

  const updateQuantity = (productId, nextQuantity) => {
    if (nextQuantity <= 0) {
      setCart((current) => current.filter((item) => item.productId !== productId));
      return;
    }
    setCart((current) =>
      current.map((item) => (item.productId === productId ? { ...item, quantity: nextQuantity } : item))
    );
  };

  const totals = useMemo(() => {
    return cart.reduce(
      (acc, item) => {
        acc.subsidized += item.subsidizedPrice * item.quantity;
        acc.mrp += item.mrp * item.quantity;
        return acc;
      },
      { subsidized: 0, mrp: 0 }
    );
  }, [cart]);

  const placeOrder = async () => {
    if (!cart.length) return;
    setError("");
    setMessage("");
    setPlacingOrder(true);

    try {
      const response = await apiRequest("/csd/orders", {
        method: "POST",
        token,
        body: {
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity
          }))
        }
      });
      setMessage(`Order ${response.order?.orderNumber || ""} placed successfully.`);
      setCart([]);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (error) return <div className="alert error">{error}</div>;
  if (!data) return <div className="center-note">Loading CSD store...</div>;

  return (
    <>
      <section>
        <h1>🛒 CSD Access</h1>
        <p className="subtle">Order subsidized grocery, electronics, and essentials with defence benefits applied automatically.</p>
      </section>

      {message && <div className="alert success">{message}</div>}

      <section className="grid cards-3">
        {data.benefitHighlights.map((item) => (
          <article key={item} className="card trust-card">
            <h3>Verified Benefit</h3>
            <p>{item}</p>
          </article>
        ))}
      </section>

      <section className="grid cards-2">
        <article className="card">
          <h2>Popular CSD Items</h2>
          <div className="product-grid">
            {data.popularItems.map((product) => (
              <article key={product.id} className="product-card">
                <span className="badge success">{product.benefitLabel}</span>
                <h3>{product.name}</h3>
                <p className="subtle">{product.description}</p>
                <p>
                  <strong>INR {Number(product.subsidizedPrice).toFixed(0)}</strong>{" "}
                  <span className="price-strike">INR {Number(product.mrp).toFixed(0)}</span>
                </p>
                <button type="button" onClick={() => addToCart(product)}>Add to Cart</button>
              </article>
            ))}
          </div>
        </article>

        <article className="card">
          <h2>Cart & Order Placement</h2>
          {cart.length ? (
            <>
              <ul className="list compact">
                {cart.map((item) => (
                  <li key={item.productId}>
                    <strong>{item.name}</strong>
                    <div className="cart-row">
                      <button type="button" className="ghost-btn" onClick={() => updateQuantity(item.productId, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button type="button" className="ghost-btn" onClick={() => updateQuantity(item.productId, item.quantity + 1)}>+</button>
                    </div>
                  </li>
                ))}
              </ul>
              <p><strong>Total:</strong> INR {totals.subsidized.toFixed(0)}</p>
              <p><strong>You save:</strong> INR {(totals.mrp - totals.subsidized).toFixed(0)}</p>
              <button type="button" onClick={placeOrder} disabled={placingOrder}>
                {placingOrder ? "Placing Order..." : "Place CSD Order"}
              </button>
            </>
          ) : (
            <p>Your cart is empty. Add a few subsidized products to place an order.</p>
          )}
        </article>
      </section>

      <section className="card">
        <h2>Full Product Listing</h2>
        <div className="product-grid">
          {data.products.map((product) => (
            <article key={product.id} className="product-card">
              <div className="product-card-head">
                <span className="badge">{product.category}</span>
                <span className={`badge ${product.stockStatus === "Low Stock" ? "warning" : "success"}`}>{product.stockStatus}</span>
              </div>
              <h3>{product.name}</h3>
              <p className="subtle">{product.description}</p>
              <p>
                <strong>INR {Number(product.subsidizedPrice).toFixed(0)}</strong>{" "}
                <span className="price-strike">INR {Number(product.mrp).toFixed(0)}</span>
              </p>
              <p className="subtle">{product.benefitLabel}</p>
              <button type="button" onClick={() => addToCart(product)}>Add to Cart</button>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <h2>Order History</h2>
        <ul className="list compact">
          {data.recentOrders.length ? data.recentOrders.map((order) => (
            <li key={order.id}>
              <strong>{order.orderNumber}</strong>
              <div>
                <span className={`badge ${getStatusBadgeClass(order.status)}`}>{order.status}</span>{" "}
                INR {Number(order.totalAmount).toFixed(0)} | Savings INR {Number(order.totalSavings).toFixed(0)}
              </div>
              <div className="subtle">
                Ordered {new Date(order.createdAt).toLocaleDateString()} | ETA {new Date(order.estimatedDelivery).toLocaleDateString()}
              </div>
            </li>
          )) : <li>No CSD orders placed yet.</li>}
        </ul>
      </section>
    </>
  );
}
