import "dotenv/config";
import express from "express";
import path from "path";
import { testarConexao } from "./config/database";
import alunosRouter from "./routes/alunos";

const app = express();
const porta = Number(process.env.PORT ?? 3000);

app.use(express.json());

// Serve o frontend (HTML, CSS e JS) da pasta public.
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/alunos", alunosRouter);

async function iniciar(): Promise<void> {
  try {
    await testarConexao();
    app.listen(porta, () => {
      console.log(`Aplicação disponível em http://localhost:${porta}`);
    });
  } catch (erro) {
    console.error("Falha ao conectar ao MySQL:", (erro as Error).message);
    process.exit(1);
  }
}

void iniciar();