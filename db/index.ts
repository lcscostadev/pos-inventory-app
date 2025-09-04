import { openDatabaseSync } from "expo-sqlite";

export type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
};

export type CartItemInput = {
  productId: string;
  qty: number;
  unitPrice: number;
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

    const row = await db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) AS c FROM products;"
    );
    const count = row?.c ?? 0;

    if (count === 0) {
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
  const rows = await db.getAllAsync<Product>(
    "SELECT * FROM products ORDER BY name;"
  );
  return rows;
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
      if (stock < it.qty) {
        throw new Error("Estoque insuficiente para algum item.");
      }
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

export async function addProduct(p: Omit<Product, "id">): Promise<string> {
  const id = `p_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  await db.runAsync(
    "INSERT INTO products (id, name, price, cost, stock) VALUES (?, ?, ?, ?, ?);",
    [id, p.name, p.price, p.cost, p.stock]
  );
  return id;
}

export async function setProductStock(id: string, stock: number): Promise<void> {
  const safe = Math.max(0, Math.floor(Number(stock) || 0));
  await db.runAsync("UPDATE products SET stock = ? WHERE id = ?;", [safe, id]);
}

export async function incrementProductStock(id: string, delta: number): Promise<void> {
  await db.runAsync("UPDATE products SET stock = MAX(0, stock + ?) WHERE id = ?;", [delta, id]);
}
