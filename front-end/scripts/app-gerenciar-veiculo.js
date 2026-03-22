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

const tbody = document.querySelector("#veiculosTable tbody");
const searchInput = document.querySelector("#searchInput");
const searchBtn = document.querySelector("#searchBtn");
const editBtn = document.querySelector("#editBtn");
const deleteBtn = document.querySelector("#deleteBtn");

let veiculoSelecionado = null;
const API_URL = "/veiculos";
let alertaSemResultadoAtivo = false;

async function carregarVeiculos(search = "") {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Erro ao buscar veículos");
    const veiculos = await response.json();
    const termoBusca = search.trim();

    // --- FILTRO ATUALIZADO ---
    let veiculosFiltrados = veiculos;
    if (termoBusca) {
      const searchUpper = termoBusca.toUpperCase();
      veiculosFiltrados = veiculos.filter(
        (veiculo) =>
          veiculo.modelo.toUpperCase().includes(searchUpper) ||
          veiculo.chassi.toUpperCase().includes(searchUpper) ||
          veiculo.cor.toUpperCase().includes(searchUpper) ||
          String(veiculo.ano).includes(searchUpper),
      );
    }

    renderTable(veiculosFiltrados);

    if (veiculosFiltrados.length === 0 && !termoBusca) {
      alertaSemResultadoAtivo = false;
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">NÃO HÁ VEÍCULOS CADASTRADOS.</td></tr>`;
      return;
    }

    if (veiculosFiltrados.length === 0 && termoBusca) {
      if (!alertaSemResultadoAtivo) {
        mostrarAlerta("NENHUM RESULTADO ENCONTRADO!");
        alertaSemResultadoAtivo = true;
      }
    } else {
      alertaSemResultadoAtivo = false;
    }
  } catch (error) {
    console.error("Erro:", error);
  }
}

function renderTable(data) {
  tbody.innerHTML = "";
  data.forEach((veiculo) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                <td>${veiculo.modelo}</td>
                <td>${veiculo.chassi}</td>
                <td>${veiculo.cor}</td>
                <td>${veiculo.ano}</td>
            `;
    tr.addEventListener("click", () => selectVeiculo(tr, veiculo));
    tbody.appendChild(tr);
  });
  resetButtons();
}

function selectVeiculo(row, veiculo) {
  document
    .querySelectorAll("tr")
    .forEach((tr) => tr.classList.remove("selected"));
  row.classList.add("selected");
  veiculoSelecionado = veiculo;

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
  veiculoSelecionado = null;
  editBtn.disabled = true;
  deleteBtn.disabled = true;
}

// Eventos
searchBtn.addEventListener("click", () => carregarVeiculos(searchInput.value));
searchInput.addEventListener("input", () =>
  carregarVeiculos(searchInput.value),
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

function renderTable(data) {
  tbody.innerHTML = "";
  data.forEach((veiculo) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
                        <td>${veiculo.modelo}</td>
                        <td>${veiculo.chassi}</td>
                        <td>${veiculo.cor}</td>
                        <td>${veiculo.ano}</td>
                    `;
    tr.addEventListener("click", () => selectVeiculo(tr, veiculo));
    tbody.appendChild(tr);
  });
  resetButtons();
}

function selectVeiculo(row, veiculo) {
  document
    .querySelectorAll("tr")
    .forEach((tr) => tr.classList.remove("selected"));
  row.classList.add("selected");
  veiculoSelecionado = veiculo;

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
  veiculoSelecionado = null;
  editBtn.disabled = true;
  deleteBtn.disabled = true;
}

searchBtn.addEventListener("click", () => carregarVeiculos(searchInput.value));
searchInput.addEventListener("input", () =>
  carregarVeiculos(searchInput.value),
);

deleteBtn.addEventListener("click", async () => {
  if (!veiculoSelecionado) return;
  const confirmarExclusao = await mostrarModalConfirmacao(
    `Excluir o veículo ${veiculoSelecionado.modelo}?`,
  );

  if (confirmarExclusao) {
    try {
      const response = await fetch(`${API_URL}/${veiculoSelecionado.chassi}`, {
        method: "DELETE",
      });
      if (response.ok) {
        alert("Veículo excluído!");
        carregarVeiculos(searchInput.value);
      } else {
        alert("Erro ao excluir.");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro de rede.");
    }
  }
});

editBtn.addEventListener("click", () => {
  if (!veiculoSelecionado) return;
  localStorage.setItem("veiculoEditando", JSON.stringify(veiculoSelecionado));
  window.location.href = "editar-veiculo.html";
});

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

carregarVeiculos();
