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
    const form = document.querySelector('#formUsuario'); // Certifique-se que o ID no HTML é formUsuario
    const btnCancel = document.querySelector('.btn-cancel');

    btnCancel.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'gerenciar-usuario.html';
    });

    // Função de validação existente
    window.validarSenha = function() {
        const senha = document.getElementById("senha").value;
        const confirmar = document.getElementById("confirmar_senha").value;
        
        if(senha.length > 20) {
            alert("A senha deve ter no máximo 20 caracteres.");
            return false;
        }
        if(senha !== confirmar) {
            alert("As senhas não conferem.");
            return false;
        }
        return true;
    };

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (!window.validarSenha()) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const response = await fetch('/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome: data.nome,
                    email: data.email,
                    senha: data.senha,
                    cod_usuario: null // O banco gera automático (serial), mas o back espera o campo no body
                }),
            });

            if (response.ok) {
                mostrarAlerta('Usuário criado com sucesso!', 'sucesso');
                setTimeout(() => {
                    window.location.href = 'gerenciar-usuario.html';
                }, 1200);
            } else {
                const err = await response.json();
                alert(`Erro: ${err.error || 'Falha ao criar usuário'}`);
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