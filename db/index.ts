// db/index.ts
import * as SQLite from "expo-sqlite";

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

let _db: SQLite.WebSQLDatabase | null = null;
function db() {
  if (!_db) _db = SQLite.openDatabase("amanteigados.db");
  return _db!;
}

// Helpers promisificados
function execAsync(sql: string, params: any[] = []): Promise<SQLite.SQLResultSet> {
  return new Promise((resolve, reject) => {
    db().transaction(
      (tx) => {
        tx.executeSql(
          sql,
          params,
          (_, rs) => resolve(rs),
          // @ts-ignore
          (_, err) => {
            reject(err);
            return true;
          }
        );
      },
      reject
    );
  });
}

export async function migrate() {
  await execAsync(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      cost REAL NOT NULL,
      stock INTEGER NOT NULL
    );
  `);

  await execAsync(`
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY NOT NULL,
      created_at TEXT NOT NULL,
      total REAL NOT NULL
    );
  `);

  await execAsync(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id TEXT PRIMARY KEY NOT NULL,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      qty INTEGER NOT NULL,
      unit_price REAL NOT NULL
    );
  `);

  // Seed inicial se não houver produtos
  const rs = await execAsync(`SELECT COUNT(*) as c FROM products;`);
  const count = (rs.rows.item(0) as any).c as number;
  if (count === 0) {
    const seed: Product[] = [
      { id: "p1", name: "Amanteigado Tradicional", price: 10, cost: 4, stock: 20 },
      { id: "p2", name: "Amanteigado com Goiabada", price: 10, cost: 4.5, stock: 15 },
      { id: "p3", name: "Amanteigado com Chocolate", price: 10, cost: 5, stock: 18 },
    ];
    for (const p of seed) {
      await execAsync(
        `INSERT INTO products (id, name, price, cost, stock) VALUES (?, ?, ?, ?, ?);`,
        [p.id, p.name, p.price, p.cost, p.stock]
      );
    }
  }
}

export async function getAllProducts(): Promise<Product[]> {
  const rs = await execAsync(`SELECT * FROM products ORDER BY name;`);
  const arr: Product[] = [];
  for (let i = 0; i < rs.rows.length; i++) {
    arr.push(rs.rows.item(i) as Product);
  }
  return arr;
}

function nowId(prefix = "") {
  // ID simples e único o bastante p/ MVP
  return `${prefix}${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
}

export async function finalizeSale(items: CartItemInput[]): Promise<{ saleId: string; total: number }> {
  if (items.length === 0) throw new Error("Nenhum item no carrinho.");
  const total = items.reduce((acc, it) => acc + it.unitPrice * it.qty, 0);
  const saleId = nowId("s_");
  const createdAt = new Date().toISOString();

  return new Promise((resolve, reject) => {
    db().transaction(
      (tx) => {
        // Verifica estoque e prepara updates
        for (const it of items) {
          tx.executeSql(
            `SELECT stock FROM products WHERE id = ?;`,
            [it.productId],
            (_, rs) => {
              if (rs.rows.length === 0) throw new Error("Produto não encontrado.");
              const stock = (rs.rows.item(0) as any).stock as number;
              if (stock < it.qty) throw new Error("Estoque insuficiente para algum item.");
            }
          );
        }

        // Insere a venda
        tx.executeSql(
          `INSERT INTO sales (id, created_at, total) VALUES (?, ?, ?);`,
          [saleId, createdAt, total]
        );

        // Insere itens e baixa estoque
        for (const it of items) {
          const itemId = nowId("si_");
          tx.executeSql(
            `INSERT INTO sale_items (id, sale_id, product_id, qty, unit_price) VALUES (?, ?, ?, ?, ?);`,
            [itemId, saleId, it.productId, it.qty, it.unitPrice]
          );
          tx.executeSql(
            `UPDATE products SET stock = stock - ? WHERE id = ?;`,
            [it.qty, it.productId]
          );
        }
      },
      (err) => reject(err),
      () => resolve({ saleId, total })
    );
  });
}
