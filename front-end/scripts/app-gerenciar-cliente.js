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

const tbody = document.querySelector("#clientesTable tbody");
const searchInput = document.querySelector("#searchInput");
const searchBtn = document.querySelector("#searchBtn");
const popup = document.querySelector("#popupMsg");
const editBtn = document.querySelector("#editBtn");
const deleteBtn = document.querySelector("#deleteBtn");

let selectedClient = null;
const API_URL = "/clientes";
let alertaSemResultadoAtivo = false;
let ultimaRequisicaoId = 0;

// --- FUNÇÕES DE FORMATAÇÃO ---
function formatarDocumento(doc) {
  if (!doc) return "";
  const limpo = doc.replace(/\D/g, "");
  if (limpo.length === 11)
    return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  else if (limpo.length === 14)
    return limpo.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      "$1.$2.$3/$4-$5",
    );
  return doc;
}

function formatarTelefone(tel) {
  if (!tel) return "";
  const limpo = tel.replace(/\D/g, "");
  if (limpo.length === 11)
    return limpo.replace(/(\d{2})(\d{5})(\d{4})/, "($1)$2-$3");
  else if (limpo.length === 10)
    return limpo.replace(/(\d{2})(\d{4})(\d{4})/, "($1)$2-$3");
  return tel;
}
// -----------------------------

async function carregarClientes(search = "") {
  const requisicaoId = ++ultimaRequisicaoId;
  const termoBusca = search.trim();
  // ALTERAÇÃO IMPORTANTE:
  // Não enviamos mais o '?search=' para o backend.
  // Buscamos todos os dados (API_URL pura) e filtramos aqui no navegador.
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erro ao buscar clientes");
    const clientes = await response.json();

    if (requisicaoId !== ultimaRequisicaoId) return;

    // --- FILTRO LOCAL (FRONT-END) ---
    let clientesFiltrados = clientes;

    if (termoBusca) {
      const termoTexto = termoBusca.toLowerCase(); // Para nome e email
      const termoNumerico = termoBusca.replace(/\D/g, ""); // Para CPF e telefone (apenas números)

      clientesFiltrados = clientes.filter((cliente) => {
        // Verifica Nome
        const nomeMatch = cliente.nome_completo
          .toLowerCase()
          .includes(termoTexto);

        // Verifica Email
        const emailMatch = cliente.email.toLowerCase().includes(termoTexto);

        // Verifica CPF (apenas se tiver números digitados)
        const cpfMatch = termoNumerico
          ? cliente.cpf_cnpj.replace(/\D/g, "").includes(termoNumerico)
          : false;

        // Verifica Telefone (apenas se tiver números digitados)
        const telMatch = termoNumerico
          ? cliente.telefone.replace(/\D/g, "").includes(termoNumerico)
          : false;

        return nomeMatch || emailMatch || cpfMatch || telMatch;
      });
    }

    renderTable(clientesFiltrados);

    if (clientesFiltrados.length === 0 && !termoBusca) {
      alertaSemResultadoAtivo = false;
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">NÃO HÁ CLIENTES CADASTRADOS.</td></tr>`;
      return;
    }

    if (clientesFiltrados.length === 0 && termoBusca) {
      if (!alertaSemResultadoAtivo) {
        mostrarAlerta("NENHUM RESULTADO ENCONTRADO!");
        alertaSemResultadoAtivo = true;
      }
    } else {
      alertaSemResultadoAtivo = false;
    }
  } catch (error) {
    console.error("Erro:", error);
    // Opcional: mostrar mensagem na tabela se der erro
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:red;">Erro de conexão com o servidor.</td></tr>`;
  }
}

function renderTable(data) {
  tbody.innerHTML = "";
  data.forEach((cliente) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                <td>${cliente.nome_completo}</td> 
                <td>${formatarDocumento(cliente.cpf_cnpj)}</td>
                <td>${formatarTelefone(cliente.telefone)}</td>
                <td>${cliente.email}</td>
            `;
    tr.addEventListener("click", () => selectClient(tr, cliente));
    tbody.appendChild(tr);
  });
  resetButtons();
}

function selectClient(row, cliente) {
  document
    .querySelectorAll("tr")
    .forEach((tr) => tr.classList.remove("selected"));
  row.classList.add("selected");
  selectedClient = cliente;

  // Verifica se é admin
  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (isAdmin) {
    editBtn.disabled = false;
    deleteBtn.disabled = false;
  } else {
    // Se não for admin, mantém desabilitado
    editBtn.disabled = true;
    deleteBtn.disabled = true;
  }
}

function resetButtons() {
  selectedClient = null;
  editBtn.disabled = true;
  deleteBtn.disabled = true;
}

// Eventos de Busca
searchBtn.addEventListener("click", () => carregarClientes(searchInput.value));

// Filtro dinâmico (enquanto digita)
searchInput.addEventListener("input", () =>
  carregarClientes(searchInput.value),
);

// Deletar
deleteBtn.addEventListener("click", async () => {
  if (!selectedClient) return;
  if (
    confirm(`Tem certeza que deseja excluir ${selectedClient.nome_completo}?`)
  ) {
    try {
      const response = await fetch(`${API_URL}/${selectedClient.cpf_cnpj}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Cliente excluído com sucesso!");
        carregarClientes(searchInput.value); // Recarrega mantendo o filtro atual
      } else {
        alert("Erro ao excluir cliente.");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro de rede.");
    }
  }
});

// Editar
editBtn.addEventListener("click", () => {
  if (!selectedClient) return;
  localStorage.setItem("clienteEditando", JSON.stringify(selectedClient));
  window.location.href = "editar-cliente.html";
});

// Carregamento inicial
carregarClientes();

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
