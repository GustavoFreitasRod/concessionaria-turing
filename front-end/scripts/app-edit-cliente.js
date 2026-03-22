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
    
    const clienteData = localStorage.getItem('clienteEditando');

    if (!clienteData) {
        alert("Nenhum cliente selecionado para edição.");
        window.location.href = 'gerenciar-cliente.html';
        return;
    }

    const cliente = JSON.parse(clienteData);
    
    form.nome.value = cliente.nome_completo;
    form.cpf_cnpj.value = cliente.cpf_cnpj;
    form.telefone.value = cliente.telefone;
    form.email.value = cliente.email;
    form.cep.value = cliente.cep || '';
    form.rua.value = cliente.rua || '';
    form.numero.value = cliente.numero || '';
    form.bairro.value = cliente.bairro || '';
    form.cidade.value = cliente.cidade || '';
    form.uf.value = cliente.estado || ''; 

    if (cliente.tipo_cliente === 'pf') {
        form.tipoPF.checked = true;
    } else if (cliente.tipo_cliente === 'pj') {
        form.tipoPJ.checked = true;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        const clienteID = cliente.cpf_cnpj;

        try {
            const response = await fetch(`/clientes/${clienteID}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                mostrarAlerta('Cliente atualizado com sucesso!', 'sucesso');
                localStorage.removeItem('clienteEditando'); 
                setTimeout(() => {
                    window.location.href = 'gerenciar-cliente.html';
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
         localStorage.removeItem('clienteEditando');
         window.location.href = 'gerenciar-cliente.html'; 
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