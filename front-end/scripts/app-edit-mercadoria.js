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
    
    // Recupera dados salvos no localStorage (vindos da tela de gerenciar)
    const mercadoriaData = localStorage.getItem('mercadoriaEditando');

    if (!mercadoriaData) {
        alert("Nenhuma mercadoria selecionada.");
        window.location.href = 'gerenciar-mercadoria.html';
        return;
    }

    const mercadoria = JSON.parse(mercadoriaData);
    
    // Preenche o formulário
    document.getElementById('codigo').value = mercadoria.cod_mercadoria;
    document.getElementById('item').value = mercadoria.nome;
    
    // O código é a chave primária, geralmente não se edita, mas depende da regra de negócio.
    // Vamos deixar como readonly para garantir integridade com o backend
    document.getElementById('codigo').readOnly = true;

    btnCancel.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('mercadoriaEditando');
        window.location.href = 'gerenciar-mercadoria.html';
    });

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const itemAtualizado = document.getElementById('item').value;
        const codigo = mercadoria.cod_mercadoria;

        try {
            const response = await fetch(`/mercadorias/${codigo}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item: itemAtualizado }),
            });

            if (response.ok || response.status === 204) {
                mostrarAlerta('Mercadoria atualizada com sucesso!', 'sucesso');
                localStorage.removeItem('mercadoriaEditando');
                setTimeout(() => {
                    window.location.href = 'gerenciar-mercadoria.html';
                }, 1200);
            } else {
                alert('Erro ao atualizar mercadoria.');
            }
        } catch (error) {
            console.error(error);
            alert('Erro de conexão.');
        }
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