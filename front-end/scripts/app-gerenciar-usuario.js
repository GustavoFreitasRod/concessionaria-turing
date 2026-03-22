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

const tbody = document.querySelector("#usuariosTable tbody");
const searchInput = document.querySelector("#searchInput");
const searchBtn = document.querySelector("#searchBtn");
const editBtn = document.querySelector("#editBtn");
const deleteBtn = document.querySelector("#deleteBtn");

let selectedUser = null;
const API_URL = "/usuarios";
let alertaSemResultadoAtivo = false;

// Carregar usuários (com filtro se houver busca)
async function carregarUsuarios(search = "") {
  let url = API_URL;
  const termoBusca = search.trim();
  if (termoBusca) url += `?search=${encodeURIComponent(termoBusca)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Erro na API");
    const dados = await response.json();

    renderTable(dados);

    if (dados.length === 0 && !termoBusca) {
      alertaSemResultadoAtivo = false;
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">NÃO HÁ USUÁRIOS CADASTRADOS.</td></tr>`;
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
    alert("Erro ao carregar usuários.");
  }
}

// Renderizar Tabela
function renderTable(data) {
  tbody.innerHTML = "";
  data.forEach((user) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                    <td>${user.cod_usuario}</td>
                    <td>${user.nome}</td>
                    <td>${user.email}</td>
                `;
    tr.addEventListener("click", () => selectUser(tr, user));
    tbody.appendChild(tr);
  });
  resetButtons();
}

// Selecionar Usuário com Lógica de Admin
function selectUser(row, user) {
  document
    .querySelectorAll("tr")
    .forEach((tr) => tr.classList.remove("selected"));
  row.classList.add("selected");
  selectedUser = user;

  // Verifica se é admin recuperando do Login
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (isAdmin) {
    editBtn.disabled = false;
    deleteBtn.disabled = false;
  } else {
    // Mantém desabilitado se não for admin
    editBtn.disabled = true;
    deleteBtn.disabled = true;
  }
}

function resetButtons() {
  selectedUser = null;
  editBtn.disabled = true;
  deleteBtn.disabled = true;
}

// Botão Editar
editBtn.addEventListener("click", () => {
  if (!selectedUser) return;
  localStorage.setItem("usuarioEditando", JSON.stringify(selectedUser));
  window.location.href = "editar-usuario.html";
});

// Botão Excluir
deleteBtn.addEventListener("click", async () => {
  if (!selectedUser) return;

  // Opcional: Proteção extra para não excluir o próprio admin se for regra de negócio
  if (selectedUser.nome.toLowerCase() === "admin") {
    alert("Não é possível excluir o administrador principal.");
    return;
  }

  if (
    confirm(`Tem certeza que deseja excluir o usuário ${selectedUser.nome}?`)
  ) {
    try {
      const response = await fetch(`${API_URL}/${selectedUser.cod_usuario}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Usuário excluído com sucesso!");
        carregarUsuarios(searchInput.value);
      } else {
        const error = await response.json();
        alert(`Erro ao excluir: ${error.error || "Erro desconhecido"}`);
      }
    } catch (error) {
      console.error("Erro ao deletar:", error);
      alert("Erro de conexão ao tentar excluir.");
    }
  }
});

// Filtros
searchBtn.addEventListener("click", () => carregarUsuarios(searchInput.value));
searchInput.addEventListener("input", () =>
  carregarUsuarios(searchInput.value),
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

// Inicialização
carregarUsuarios();
