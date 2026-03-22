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

const tbody = document.getElementById("tbody-vendas");
const campoBusca = document.getElementById("campoBusca");

const editBtn = document.getElementById("editBtn");
const deleteBtn = document.getElementById("deleteBtn");

let vendaSelecionada = null;
const API_URL = "/vendas";
let alertaSemResultadoAtivo = false;

// Carregar vendas ao iniciar
document.addEventListener("DOMContentLoaded", carregarVendas);

// Filtro de busca
campoBusca.addEventListener("input", () => {
  const termo = campoBusca.value.toLowerCase();
  filtrarVendas(termo);
});

// carregar vendas
async function carregarVendas() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error();

    const vendas = await response.json();
    exibirVendas(vendas);
  } catch (error) {
    tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="erro">Erro ao carregar vendas.</td>
                    </tr>
                `;
  }
}

// exibir vendas
function exibirVendas(vendas) {
  tbody.innerHTML = "";

  if (vendas.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">NÃO HÁ VENDAS CADASTRADAS.</td></tr>`;
    return;
  }

  vendas.forEach((venda) => {
    const tr = document.createElement("tr");

    tr.addEventListener("click", () => selecionarLinha(tr, venda.cod_venda));

    const dataFormatada = venda.data_venda
      ? new Date(venda.data_venda).toLocaleDateString("pt-BR")
      : "-";

    const exibirCliente = venda.nome_cliente || venda.cliente_cpf_cnpj || "-";

    let exibirItem = "-";
    if (venda.nome_mercadoria) {
      exibirItem = venda.nome_mercadoria;
    } else if (venda.modelo_veiculo) {
      exibirItem = `${venda.modelo_veiculo} (${venda.cor_veiculo || ""})`;
    } else {
      exibirItem = venda.cod_mercadoria || venda.veiculo_chassi || "-";
    }

    // Formatar Valor para Moeda Brasileira (R$)
    const valorFormatado = parseFloat(venda.valor).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

    tr.innerHTML = `
                    <td>${venda.cod_venda}</td>
                    <td>${exibirCliente}</td>
                    <td>${dataFormatada}</td>
                    <td>${exibirItem}</td>
                    <td>${venda.qtd_mercadoria || 0}</td>
                    <td>${valorFormatado}</td> 
                `;

    tbody.appendChild(tr);
  });
}

// seleção da linha
function selecionarLinha(linha, idVenda) {
  document
    .querySelectorAll("tr")
    .forEach((l) => l.classList.remove("selected"));
  linha.classList.add("selected");

  vendaSelecionada = idVenda;

  const isAdmin = localStorage.getItem("isAdmin") === "true";

  if (isAdmin) {
    editBtn.disabled = false;
    deleteBtn.disabled = false;
  } else {
    editBtn.disabled = true;
    deleteBtn.disabled = true;
  }

  editBtn.onclick = () => {
    if (isAdmin) editarVenda(vendaSelecionada);
  };
  deleteBtn.onclick = () => {
    if (isAdmin) deletarVenda(vendaSelecionada);
  };
}

// filtrar
function filtrarVendas(termo) {
  const linhas = tbody.querySelectorAll("tr");
  const termoBusca = termo.trim();

  let encontrou = false;

  linhas.forEach((linha) => {
    const texto = linha.innerText.toLowerCase();
    const match = texto.includes(termo);

    linha.style.display = match ? "" : "none";

    if (match) encontrou = true;
  });

  if (termoBusca && !encontrou) {
    if (!alertaSemResultadoAtivo) {
      mostrarAlerta("NENHUM RESULTADO ENCONTRADO!");
      alertaSemResultadoAtivo = true;
    }
  } else {
    alertaSemResultadoAtivo = false;
  }
}

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

// editar
function editarVenda(id) {
  window.location.href = `editar-venda.html?id=${id}`;
}

// deletar
async function deletarVenda(id) {
  const confirmar = confirm("Deseja realmente excluir esta venda?");
  if (!confirmar) return;

  try {
    const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });

    if (!response.ok) {
      alert("Erro ao excluir venda.");
      return;
    }

    alert("Venda excluída com sucesso!");
    carregarVendas();
  } catch (error) {
    alert("Erro ao excluir venda.");
  }
}
