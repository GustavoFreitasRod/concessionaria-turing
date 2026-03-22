const usuarioLogado = localStorage.getItem("usuarioLogado");
const authToken = localStorage.getItem("authToken");
if (!usuarioLogado || !authToken) {
  localStorage.removeItem("usuarioLogado");
  localStorage.removeItem("isAdmin");
  localStorage.removeItem("authToken");
  window.location.href = "login.html";
}

if (!window.__authFetchPatched) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const tokenAtual = localStorage.getItem("authToken");
    const headers = new Headers(init.headers || {});

    if (tokenAtual) {
      headers.set("Authorization", "Bearer " + tokenAtual);
    }

    const response = await originalFetch(input, { ...init, headers });

    if (response.status === 401) {
      localStorage.removeItem("usuarioLogado");
      localStorage.removeItem("isAdmin");
      localStorage.removeItem("authToken");
      window.location.href = "login.html";
    }

    return response;
  };
  window.__authFetchPatched = true;
}

const tbody = document.querySelector("#mercadoriasTable tbody");
const searchInput = document.querySelector("#searchInput");
const searchBtn = document.querySelector("#searchBtn");
const editBtn = document.querySelector("#editBtn");
const deleteBtn = document.querySelector("#deleteBtn");

let selectedMercadoria = null;
const API_URL = "/mercadorias";
let alertaSemResultadoAtivo = false;

// Carregar Mercadorias
async function carregarMercadorias(search = "") {
  let url = API_URL;
  const termoBusca = search.trim();
  if (termoBusca) {
    url += `?search=${encodeURIComponent(termoBusca)}`;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro na API");
    const dados = await response.json();
    renderTable(dados);

    if (dados.length === 0 && !termoBusca) {
      alertaSemResultadoAtivo = false;
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">NÃO HÁ MERCADORIAS CADASTRADAS.</td></tr>`;
    return;
    }

    if (dados.length === 0 && termoBusca) {
      if (!alertaSemResultadoAtivo) {
        mostrarAlerta("NENHUM RESULTADO ENCONTRADO!");
        alertaSemResultadoAtivo = true;
      }
    } else {
      alertaSemResultadoAtivo = false;
    }
  } catch (error) {
    console.error(error);
    alert("Erro ao carregar mercadorias.");
  }
}

// Renderizar Tabela
function renderTable(data) {
  tbody.innerHTML = "";
  data.forEach((item) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td>${item.cod_mercadoria}</td>
                    <td>${item.nome}</td>
                `;
    tr.addEventListener("click", () => selectItem(tr, item));
    tbody.appendChild(tr);
  });
  resetButtons();
}

// Selecionar Item com Lógica de Admin
function selectItem(row, item) {
  document
    .querySelectorAll("tr")
    .forEach((tr) => tr.classList.remove("selected"));
  row.classList.add("selected");
  selectedMercadoria = item;

  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (isAdmin) {
    editBtn.disabled = false;
    deleteBtn.disabled = false;
  } else {
    editBtn.disabled = true;
    deleteBtn.disabled = true;
  }
}

function resetButtons() {
  selectedMercadoria = null;
  editBtn.disabled = true;
  deleteBtn.disabled = true;
}

// Botão Editar
editBtn.addEventListener("click", () => {
  if (!selectedMercadoria) return;
  localStorage.setItem(
    "mercadoriaEditando",
    JSON.stringify(selectedMercadoria),
  );
  window.location.href = "editar-mercadoria.html";
});

// Botão Excluir
deleteBtn.addEventListener("click", async () => {
  if (!selectedMercadoria) return;

  const confirmarExclusao = await mostrarModalConfirmacao(
    `Tem certeza que deseja excluir a mercadoria "${selectedMercadoria.nome}"?`,
  );

  if (confirmarExclusao) {
    try {
      const response = await fetch(
        `${API_URL}/${selectedMercadoria.cod_mercadoria}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        alert("Mercadoria excluída com sucesso!");
        carregarMercadorias(searchInput.value);
      } else {
        const error = await response.json();
        alert(
          "Erro ao excluir: " +
            (error.error || "Pode estar vinculada a uma venda."),
        );
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro de rede ao tentar excluir.");
    }
  }
});

// Filtros e Busca
searchBtn.addEventListener("click", () =>
  carregarMercadorias(searchInput.value),
);
searchInput.addEventListener("input", () =>
  carregarMercadorias(searchInput.value),
);

function mostrarAlerta(mensagem) {
  const alerta = document.createElement("div");

  alerta.className = "alerta erro";
  alerta.innerText = mensagem;

  document.body.appendChild(alerta);

  setTimeout(() => {
    alerta.classList.add("show");
  }, 10);

  setTimeout(() => {
    alerta.classList.remove("show");
    setTimeout(() => alerta.remove(), 300);
  }, 3000);
}

function mostrarModalConfirmacao(mensagem) {
  return new Promise((resolve) => {
    const modal = document.getElementById("confirmacaoModal");
    const mensagemEl = document.getElementById("confirmacaoMensagem");
    const btnCancelar = document.getElementById("confirmacaoCancelar");
    const btnConfirmar = document.getElementById("confirmacaoConfirmar");

    if (!modal || !mensagemEl || !btnCancelar || !btnConfirmar) {
      resolve(false);
      return;
    }

    mensagemEl.textContent = mensagem;
    modal.classList.add("active");

    const fecharModal = (confirmou) => {
      modal.classList.remove("active");
      btnCancelar.removeEventListener("click", onCancelar);
      btnConfirmar.removeEventListener("click", onConfirmar);
      resolve(confirmou);
    };

    const onCancelar = () => fecharModal(false);
    const onConfirmar = () => fecharModal(true);

    btnCancelar.addEventListener("click", onCancelar);
    btnConfirmar.addEventListener("click", onConfirmar);
  });
}

// Inicialização
carregarMercadorias();
