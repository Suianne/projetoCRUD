import { Router, Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { pool } from "../config/database";
import { Aluno, NovoAluno } from "../types/aluno";

const router = Router();

interface AlunoRow extends RowDataPacket, Aluno {}

function textoValido(valor: unknown, maximo: number): valor is string {
  return (
    typeof valor === "string" &&
    valor.trim().length > 0 &&
    valor.trim().length <= maximo
  );
}

const padraoEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// CADASTRAR (INSERT)
router.post("/", async (req: Request, res: Response): Promise<void> => {
  const { nome, email, curso } = (req.body ?? {}) as Partial<NovoAluno>;

  if (
    !textoValido(nome, 120) ||
    !textoValido(email, 160) ||
    !textoValido(curso, 120) ||
    !padraoEmail.test(email.trim())
  ) {
    res.status(400).json({ erro: "Dados inválidos. Preencha nome, e-mail e curso." });
    return;
  }

  try {
    const [resultado] = await pool.execute<ResultSetHeader>(
      "INSERT INTO alunos (nome, email, curso) VALUES (?, ?, ?)",
      [nome.trim(), email.trim(), curso.trim()]
    );
    const criado: Aluno = {
      id: resultado.insertId,
      nome: nome.trim(),
      email: email.trim(),
      curso: curso.trim(),
    };
    res.status(201).json(criado);
  } catch (erro) {
    if ((erro as { code?: string }).code === "ER_DUP_ENTRY") {
      res.status(409).json({ erro: "Já existe um aluno com este e-mail." });
      return;
    }
    console.error(erro);
    res.status(500).json({ erro: "Erro interno ao cadastrar o aluno." });
  }
});

// CONSULTAR (SELECT), com filtro opcional por nome
router.get("/", async (req: Request, res: Response): Promise<void> => {
  const nome = typeof req.query.nome === "string" ? req.query.nome.trim() : "";

  try {
    let linhas: AlunoRow[];
    if (nome) {
      [linhas] = await pool.execute<AlunoRow[]>(
        "SELECT id, nome, email, curso FROM alunos WHERE nome LIKE ? ORDER BY id DESC",
        [`%${nome}%`]
      );
    } else {
      [linhas] = await pool.execute<AlunoRow[]>(
        "SELECT id, nome, email, curso FROM alunos ORDER BY id DESC"
      );
    }
    res.status(200).json(linhas);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro interno ao consultar os alunos." });
  }
});

// EXCLUIR (DELETE)
router.delete("/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ erro: "ID inválido." });
    return;
  }

  try {
    const [resultado] = await pool.execute<ResultSetHeader>(
      "DELETE FROM alunos WHERE id = ?",
      [id]
    );
    if (resultado.affectedRows === 0) {
      res.status(404).json({ erro: "Aluno não encontrado." });
      return;
    }
    res.status(200).json({ mensagem: "Aluno excluído com sucesso." });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: "Erro interno ao excluir o aluno." });
  }
});

export default router;