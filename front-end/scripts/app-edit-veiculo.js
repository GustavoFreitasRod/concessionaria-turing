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

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const btnCancel = document.querySelector('.btn-cancel');
    
    const veiculoData = localStorage.getItem('veiculoEditando');

    if (!veiculoData) {
        alert("Nenhum veículo selecionado para edição.");
        window.location.href = 'gerenciar-veiculo.html';
        return;
    }

    const veiculo = JSON.parse(veiculoData);
    

    form.chassi.value = veiculo.chassi;
    form.cor.value = veiculo.cor;
    form.ano.value = veiculo.ano;
    form.modelo.value = veiculo.modelo;

    form.chassi.disabled = true;

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const veiculoID = veiculo.chassi;

        try {
            const response = await fetch(`/veiculos/${veiculoID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },

                body: JSON.stringify({
                    cor: data.cor,
                    ano: data.ano,
                    modelo: data.modelo
                }),
            });

            if (response.ok) {
                mostrarAlerta('Veículo atualizado com sucesso!', 'sucesso');
                localStorage.removeItem('veiculoEditando');
                setTimeout(() => {
                    window.location.href = 'gerenciar-veiculo.html';
                }, 1200);
            } else {
                const error = await response.json();
                alert(`Erro ao atualizar: ${error.error || 'Erro desconhecido'}`);
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Não foi possível conectar ao servidor.');
        }
    });

    btnCancel.addEventListener('click', (event) => {
         event.preventDefault();
         localStorage.removeItem('veiculoEditando');
         window.location.href = 'gerenciar-veiculo.html';
    });
});

function mostrarAlerta(mensagem, tipo = 'erro') {
    const alerta = document.createElement('div');

    alerta.className = `alerta ${tipo}`;
    alerta.innerText = mensagem;

    document.body.appendChild(alerta);

    setTimeout(() => {
        alerta.classList.add('show');
    }, 10);

    setTimeout(() => {
        alerta.classList.remove('show');
        setTimeout(() => alerta.remove(), 300);
    }, 3000);
}