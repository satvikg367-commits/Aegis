import { Router } from "express";
import { addNotification, getDb, nextId, updateDb } from "../lib/db.js";
import { buildCsdSummary } from "../lib/portal.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  const userId = req.auth.userId;
  const summary = buildCsdSummary(db, userId);

  return res.status(200).json({
    products: summary.products,
    popularItems: summary.popularItems,
    recentOrders: summary.recentOrders,
    benefitHighlights: [
      "Defence subsidized pricing on selected essentials and electronics.",
      "Verified ordering flow with order history and delivery tracking.",
      "Priority-friendly essentials curated for retired personnel."
    ]
  });
});

router.post("/orders", requireAuth, (req, res) => {
  const userId = req.auth.userId;
  const items = Array.isArray(req.body?.items) ? req.body.items : [];

  if (!items.length) {
    return res.status(400).json({ error: "At least one item is required to place an order" });
  }

  const db = getDb();
  const productMap = new Map(db.csdProducts.map((product) => [product.id, product]));

  const normalizedItems = items
    .map((item) => {
      const product = productMap.get(Number(item.productId));
      const quantity = Math.max(1, Number(item.quantity) || 1);
      if (!product || product.isActive === false) return null;

      return {
        productId: product.id,
        name: product.name,
        quantity,
        subsidizedPrice: Number(product.subsidizedPrice || 0),
        mrp: Number(product.mrp || product.subsidizedPrice || 0)
      };
    })
    .filter(Boolean);

  if (!normalizedItems.length) {
    return res.status(400).json({ error: "Selected CSD items are unavailable" });
  }

  let order = null;
  updateDb((draft) => {
    const id = nextId(draft, "csdOrders");
    const totalAmount = normalizedItems.reduce((sum, item) => sum + item.subsidizedPrice * item.quantity, 0);
    const totalSavings = normalizedItems.reduce((sum, item) => sum + (item.mrp - item.subsidizedPrice) * item.quantity, 0);
    order = {
      id,
      userId,
      orderNumber: `CSD-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${100 + id}`,
      status: "Processing",
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      totalAmount,
      totalSavings,
      items: normalizedItems
    };
    draft.csdOrders.push(order);
    addNotification(
      draft,
      userId,
      "CSD",
      "CSD order placed",
      `Your order ${order.orderNumber} has been placed with savings of INR ${totalSavings.toFixed(0)}.`
    );
    return draft;
  });

  return res.status(201).json({ message: "Order placed successfully", order });
});

export default router;
