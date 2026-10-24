interface Aluno {
  id: number;
  nome: string;
  email: string;
  curso: string;
}

const formAluno = document.getElementById("formAluno") as HTMLFormElement;
const inputNome = document.getElementById("nome") as HTMLInputElement;
const inputEmail = document.getElementById("email") as HTMLInputElement;
const inputCurso = document.getElementById("curso") as HTMLInputElement;
const inputBusca = document.getElementById("busca") as HTMLInputElement;
const btnBuscar = document.getElementById("btnBuscar") as HTMLButtonElement;
const btnLimpar = document.getElementById("btnLimpar") as HTMLButtonElement;
const lista = document.getElementById("lista") as HTMLTableSectionElement;
const mensagem = document.getElementById("mensagem") as HTMLParagraphElement;
const painel = document.getElementById("painelConfirmacao") as HTMLElement;
const textoConfirmacao = document.getElementById("textoConfirmacao") as HTMLParagraphElement;
const btnConfirmar = document.getElementById("btnConfirmar") as HTMLButtonElement;
const btnCancelar = document.getElementById("btnCancelar") as HTMLButtonElement;

let idParaExcluir: number | null = null;

function mostrarMensagem(texto: string, tipo: "ok" | "erro"): void {
  mensagem.textContent = texto;
  mensagem.className = tipo;
}

async function lerErro(resposta: Response): Promise<string> {
  try {
    const dados = (await resposta.json()) as { erro?: string };
    return dados.erro ?? "Ocorreu um erro.";
  } catch {
    return "Ocorreu um erro.";
  }
}

function desenharLista(alunos: Aluno[]): void {
  lista.textContent = "";

  if (alunos.length === 0) {
    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.colSpan = 5;
    celula.textContent = "Nenhum aluno encontrado.";
    linha.appendChild(celula);
    lista.appendChild(linha);
    return;
  }

  for (const aluno of alunos) {
    const linha = document.createElement("tr");

    for (const valor of [String(aluno.id), aluno.nome, aluno.email, aluno.curso]) {
      const celula = document.createElement("td");
      celula.textContent = valor; // textContent evita injetar HTML
      linha.appendChild(celula);
    }

    const celulaAcao = document.createElement("td");
    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "perigo";
    botao.textContent = "Excluir";
    botao.addEventListener("click", () => pedirConfirmacao(aluno));
    celulaAcao.appendChild(botao);
    linha.appendChild(celulaAcao);

    lista.appendChild(linha);
  }
}

async function consultar(): Promise<void> {
  const nome = inputBusca.value.trim();
  const url = nome ? `/api/alunos?nome=${encodeURIComponent(nome)}` : "/api/alunos";

  try {
    const resposta = await fetch(url);
    if (!resposta.ok) {
      mostrarMensagem(await lerErro(resposta), "erro");
      return;
    }
    desenharLista((await resposta.json()) as Aluno[]);
  } catch {
    mostrarMensagem("Não foi possível falar com o servidor.", "erro");
  }
}

async function cadastrar(evento: Event): Promise<void> {
  evento.preventDefault();

  const nome = inputNome.value.trim();
  const email = inputEmail.value.trim();
  const curso = inputCurso.value.trim();

  if (!nome || !email || !curso) {
    mostrarMensagem("Preencha nome, e-mail e curso.", "erro");
    return;
  }

  try {
    const resposta = await fetch("/api/alunos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, curso }),
    });

    if (!resposta.ok) {
      mostrarMensagem(await lerErro(resposta), "erro");
      return;
    }

    formAluno.reset();
    mostrarMensagem("Aluno cadastrado com sucesso.", "ok");
    await consultar();
  } catch {
    mostrarMensagem("Não foi possível falar com o servidor.", "erro");
  }
}

function pedirConfirmacao(aluno: Aluno): void {
  idParaExcluir = aluno.id;
  textoConfirmacao.textContent = `Excluir o aluno ${aluno.nome} (ID ${aluno.id})?`;
  painel.hidden = false;
}

function cancelarExclusao(): void {
  idParaExcluir = null;
  painel.hidden = true;
}

async function confirmarExclusao(): Promise<void> {
  if (idParaExcluir === null) return;
  const id = idParaExcluir;
  cancelarExclusao();

  try {
    const resposta = await fetch(`/api/alunos/${id}`, { method: "DELETE" });
    if (!resposta.ok) {
      mostrarMensagem(await lerErro(resposta), "erro");
      return;
    }
    mostrarMensagem("Aluno excluído com sucesso.", "ok");
    await consultar();
  } catch {
    mostrarMensagem("Não foi possível falar com o servidor.", "erro");
  }
}

formAluno.addEventListener("submit", cadastrar);
btnBuscar.addEventListener("click", consultar);
btnLimpar.addEventListener("click", () => {
  inputBusca.value = "";
  void consultar();
});
btnConfirmar.addEventListener("click", confirmarExclusao);
btnCancelar.addEventListener("click", cancelarExclusao);

void consultar();