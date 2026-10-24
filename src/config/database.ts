import "dotenv/config";
import mysql from "mysql2/promise";

// Pool de conexões: reaproveita conexões em vez de abrir uma por requisição.
export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  charset: "utf8mb4",
});

// Testa a conexão antes de o servidor abrir a porta HTTP.
export async function testarConexao(): Promise<void> {
  const conexao = await pool.getConnection();
  conexao.release();
  console.log("Conexão com MySQL estabelecida.");
}