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

    const usuarioData = localStorage.getItem('usuarioEditando');

    if (!usuarioData) {
        alert("Nenhum usuário selecionado para edição.");
        window.location.href = 'gerenciar-usuario.html';
        return;
    }

    const usuario = JSON.parse(usuarioData);

    // Preenche os campos
    document.getElementById('nome').value = usuario.nome;
    document.getElementById('email').value = usuario.email;

    form.senha.value = "";
    form.confirmar_senha.value = "";

    btnCancel.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.removeItem('usuarioEditando');
        window.location.href = 'gerenciar-usuario.html';
    });

    function validarSenha() {
        const senha = form.senha.value;
        const confirmar = form.confirmar_senha.value;

        if (senha.length > 20) {
            alert("A senha deve ter no máximo 20 caracteres.");
            return false;
        }

        if (senha !== confirmar) {
            alert("As senhas não conferem.");
            return false;
        }

        return true;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!validarSenha()) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch(`/usuarios/${usuario.cod_usuario}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: data.nome,
                    email: data.email,
                    senha: data.senha
                })
            });

            if (response.ok) {
                mostrarAlerta('Usuário atualizado com sucesso!', 'sucesso');
                localStorage.removeItem('usuarioEditando');
                setTimeout(() => {
                    window.location.href = 'gerenciar-usuario.html';
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
