"use strict";
const formAluno = document.getElementById("formAluno");
const inputNome = document.getElementById("nome");
const inputEmail = document.getElementById("email");
const inputCurso = document.getElementById("curso");
const inputBusca = document.getElementById("busca");
const btnBuscar = document.getElementById("btnBuscar");
const btnLimpar = document.getElementById("btnLimpar");
const lista = document.getElementById("lista");
const mensagem = document.getElementById("mensagem");
const painel = document.getElementById("painelConfirmacao");
const textoConfirmacao = document.getElementById("textoConfirmacao");
const btnConfirmar = document.getElementById("btnConfirmar");
const btnCancelar = document.getElementById("btnCancelar");
let idParaExcluir = null;
function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = tipo;
}
async function lerErro(resposta) {
    try {
        const dados = (await resposta.json());
        return dados.erro ?? "Ocorreu um erro.";
    }
    catch {
        return "Ocorreu um erro.";
    }
}
function desenharLista(alunos) {
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
async function consultar() {
    const nome = inputBusca.value.trim();
    const url = nome ? `/api/alunos?nome=${encodeURIComponent(nome)}` : "/api/alunos";
    try {
        const resposta = await fetch(url);
        if (!resposta.ok) {
            mostrarMensagem(await lerErro(resposta), "erro");
            return;
        }
        desenharLista((await resposta.json()));
    }
    catch {
        mostrarMensagem("Não foi possível falar com o servidor.", "erro");
    }
}
async function cadastrar(evento) {
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
    }
    catch {
        mostrarMensagem("Não foi possível falar com o servidor.", "erro");
    }
}
function pedirConfirmacao(aluno) {
    idParaExcluir = aluno.id;
    textoConfirmacao.textContent = `Excluir o aluno ${aluno.nome} (ID ${aluno.id})?`;
    painel.hidden = false;
}
function cancelarExclusao() {
    idParaExcluir = null;
    painel.hidden = true;
}
async function confirmarExclusao() {
    if (idParaExcluir === null)
        return;
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
    }
    catch {
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
