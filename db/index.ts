import { openDatabaseSync } from "expo-sqlite";

export type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  image: string;
};

export type CartItemInput = {
  productId: string;
  qty: number;
  unitPrice: number;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: string;       
  unit_price: number; 
  qty: number;       
};

export type SaleRow = {
  id: string;
  created_at: string;
  total: number;
  items: number;
};

const db = openDatabaseSync("amanteigados.db");

function nowId(prefix = "") {
  return `${prefix}${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export async function migrate() {
  await db.withTransactionAsync(async () => {
    await db.execAsync("PRAGMA foreign_keys = ON;");

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        cost REAL NOT NULL,
        stock INTEGER NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sales (
        id TEXT PRIMARY KEY NOT NULL,
        created_at TEXT NOT NULL,
        total REAL NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id TEXT PRIMARY KEY NOT NULL,
        sale_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        qty INTEGER NOT NULL,
        unit_price REAL NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ingredients (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        unit TEXT NOT NULL,
        unit_cost REAL NOT NULL,
        stock_qty REAL NOT NULL
      );
    `);

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS ingredient_purchases (
        id TEXT PRIMARY KEY NOT NULL,
        ingredient_id TEXT NOT NULL,
        qty REAL NOT NULL,
        unit_cost REAL NOT NULL,
        total REAL NOT NULL,
        date TEXT NOT NULL
      );
    `);

    const row = await db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) AS c FROM products;"
    );
    if ((row?.c ?? 0) === 0) {
      const seed: Product[] = [
        { id: "p1", name: "Amanteigado Tradicional",  price: 10, cost: 4,   stock: 20 },
        { id: "p2", name: "Amanteigado com Goiabada",  price: 10, cost: 4.5, stock: 15 },
        { id: "p3", name: "Amanteigado com Chocolate", price: 10, cost: 5,   stock: 18 },
      ];
      for (const p of seed) {
        await db.runAsync(
          `INSERT INTO products (id, name, price, cost, stock) VALUES (?, ?, ?, ?, ?);`,
          [p.id, p.name, p.price, p.cost, p.stock]
        );
      }
    }
  });
}


export async function getAllProducts(): Promise<Product[]> {
  return await db.getAllAsync<Product>(
    "SELECT * FROM products ORDER BY name;"
  );
}

export async function addProduct(p: Omit<Product, "id">): Promise<string> {
  const id = nowId("p_");
  await db.runAsync(
    "INSERT INTO products (id, name, price, cost, stock) VALUES (?, ?, ?, ?, ?);",
    [id, p.name.trim(), Number(p.price), Number(p.cost), Math.max(0, Math.floor(p.stock || 0))]
  );
  return id;
}

export async function updateProduct(p: {
  id: string; name: string; price: number; cost: number; stock: number;
}): Promise<void> {
  const name = p.name.trim();
  const price = Number(p.price);
  const cost  = Number(p.cost);
  const stock = Math.max(0, Math.floor(Number(p.stock) || 0));
  if (!name) throw new Error("Nome obrigatório.");
  if (!(price >= 0)) throw new Error("Preço inválido.");
  if (!(cost  >= 0)) throw new Error("Custo inválido.");
  await db.runAsync(
    "UPDATE products SET name = ?, price = ?, cost = ?, stock = ? WHERE id = ?;",
    [name, price, cost, stock, p.id]
  );
}

export async function deleteProduct(id: string): Promise<void> {
  const used = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM sale_items WHERE product_id = ?;",
    [id]
  );
  if ((used?.c ?? 0) > 0) {
    throw new Error("Não é possível excluir: produto já usado em vendas.");
  }
  await db.runAsync("DELETE FROM products WHERE id = ?;", [id]);
}

export async function setProductStock(id: string, stock: number): Promise<void> {
  const safe = Math.max(0, Math.floor(Number(stock) || 0));
  await db.runAsync("UPDATE products SET stock = ? WHERE id = ?;", [safe, id]);
}

export async function incrementProductStock(id: string, delta: number): Promise<void> {
  await db.runAsync(
    "UPDATE products SET stock = MAX(0, stock + ?) WHERE id = ?;",
    [delta, id]
  );
}

export async function clearAllProductStock(): Promise<void> {
  await db.runAsync("UPDATE products SET stock = 0;");
}


export async function finalizeSale(
  items: CartItemInput[]
): Promise<{ saleId: string; total: number }> {
  if (!items.length) throw new Error("Nenhum item no carrinho.");

  const total = items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
  const saleId = nowId("s_");
  const createdAt = new Date().toISOString();

  await db.withTransactionAsync(async () => {
    for (const it of items) {
      const row = await db.getFirstAsync<{ stock: number }>(
        "SELECT stock FROM products WHERE id = ?;",
        [it.productId]
      );
      const stock = row?.stock ?? 0;
      if (stock < it.qty) throw new Error("Estoque insuficiente para algum item.");
    }

    await db.runAsync(
      "INSERT INTO sales (id, created_at, total) VALUES (?, ?, ?);",
      [saleId, createdAt, total]
    );

    for (const it of items) {
      const itemId = nowId("si_");
      await db.runAsync(
        "INSERT INTO sale_items (id, sale_id, product_id, qty, unit_price) VALUES (?, ?, ?, ?, ?);",
        [itemId, saleId, it.productId, it.qty, it.unitPrice]
      );
      await db.runAsync(
        "UPDATE products SET stock = stock - ? WHERE id = ?;",
        [it.qty, it.productId]
      );
    }
  });

  return { saleId, total };
}

export async function getRevenueTotal(): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(total), 0) AS total FROM sales;"
  );
  return row?.total ?? 0;
}

export async function getCOGSEstimate(): Promise<number> {
  const row = await db.getFirstAsync<{ cogs: number }>(`
    SELECT COALESCE(SUM(si.qty * p.cost), 0) AS cogs
    FROM sale_items si
    JOIN products p ON p.id = si.product_id;
  `);
  return row?.cogs ?? 0;
}

export async function getProductsInventoryValue(): Promise<number> {
  const row = await db.getFirstAsync<{ val: number }>(`
    SELECT COALESCE(SUM(stock * cost), 0) AS val FROM products;
  `);
  return row?.val ?? 0;
}

export async function getRecentSales(limit = 20): Promise<SaleRow[]> {
  return await db.getAllAsync<SaleRow>(
    `
    SELECT
      s.id,
      s.created_at,
      s.total,
      (SELECT COALESCE(SUM(qty),0) FROM sale_items WHERE sale_id = s.id) AS items
    FROM sales s
    ORDER BY s.created_at DESC
    LIMIT ?;
  `,
    [limit]
  );
}

export async function clearAllSales(): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync("DELETE FROM sale_items;");
    await db.runAsync("DELETE FROM sales;");
  });
}


export async function listIngredients(): Promise<Ingredient[]> {
  const rows = await db.getAllAsync<any>(`
    SELECT id, name, unit, unit_cost, stock_qty FROM ingredients ORDER BY name;
  `);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    unit: r.unit,
    unit_price: Number(r.unit_cost ?? 0),
    qty: Number(r.stock_qty ?? 0),
  }));
}

export async function addIngredient(i: {
  name: string; unit: string; unit_price: number; qty: number;
}): Promise<string> {
  const id = nowId("ing_");
  await db.runAsync(
    "INSERT INTO ingredients (id, name, unit, unit_cost, stock_qty) VALUES (?, ?, ?, ?, ?);",
    [id, i.name.trim(), i.unit.trim(), Number(i.unit_price), Number(i.qty)]
  );
  return id;
}

export async function updateIngredient(i: {
  id: string; name: string; unit: string; unit_price: number; qty: number;
}): Promise<void> {
  await db.runAsync(
    "UPDATE ingredients SET name = ?, unit = ?, unit_cost = ?, stock_qty = ? WHERE id = ?;",
    [i.name.trim(), i.unit.trim(), Number(i.unit_price), Number(i.qty), i.id]
  );
}

export async function deleteIngredient(id: string): Promise<void> {
  const used = await db.getFirstAsync<{ c: number }>(
    "SELECT COUNT(*) AS c FROM ingredient_purchases WHERE ingredient_id = ?;",
    [id]
  );
  if ((used?.c ?? 0) > 0) {
    throw new Error("Não é possível excluir: ingrediente já possui compras registradas.");
  }
  await db.runAsync("DELETE FROM ingredients WHERE id = ?;", [id]);
}

export async function incrementIngredientQty(id: string, delta: number): Promise<void> {
  await db.runAsync(
    "UPDATE ingredients SET stock_qty = MAX(0, stock_qty + ?) WHERE id = ?;",
    [delta, id]
  );
}

export async function setIngredientQty(id: string, qty: number): Promise<void> {
  const v = Math.max(0, Number(qty) || 0);
  await db.runAsync("UPDATE ingredients SET stock_qty = ? WHERE id = ?;", [v, id]);
}

export async function addIngredientPurchase(params: {
  ingredient_id: string;
  qty: number;
  unit_price: number;
  purchased_at?: string; 
}): Promise<string> {
  const id = nowId("ip_");
  const date = params.purchased_at ?? new Date().toISOString();
  const qty = Number(params.qty);
  const unit_cost = Number(params.unit_price);
  const total = qty * unit_cost;

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      "INSERT INTO ingredient_purchases (id, ingredient_id, qty, unit_cost, total, date) VALUES (?, ?, ?, ?, ?, ?);",
      [id, params.ingredient_id, qty, unit_cost, total, date]
    );
    await db.runAsync(
      "UPDATE ingredients SET stock_qty = stock_qty + ?, unit_cost = ? WHERE id = ?;",
      [qty, unit_cost, params.ingredient_id]
    );
  });

  return id;
}

export async function getIngredientSpendTotal(): Promise<number> {
  const row = await db.getFirstAsync<{ total: number }>(
    "SELECT COALESCE(SUM(total), 0) AS total FROM ingredient_purchases;"
  );
  return row?.total ?? 0;
}

export async function getIngredientsInventoryValue(): Promise<number> {
  const row = await db.getFirstAsync<{ val: number }>(`
    SELECT COALESCE(SUM(stock_qty * unit_cost), 0) AS val FROM ingredients;
  `);
  return row?.val ?? 0;
}
