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
  const chassiInput = document.getElementById('chassi');
  const anoInput = document.getElementById('ano');

  // Validação em tempo real do CHASSI
  chassiInput.addEventListener('input', (e) => {
    // Converte para maiúsculas e remove caracteres inválidos
    e.target.value = e.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '');
  });

  // Validação do CHASSI
  function validarChassi(chassi) {
    // Verifica o tamanho
    if (chassi.length !== 17) {
      return { valido: false, mensagem: 'O chassi deve conter exatamente 17 caracteres.' };
    }

    // Verifica caracteres inválidos (I, O, Q não são permitidos em chassi)
    if (/[IOQ]/.test(chassi)) {
      return { valido: false, mensagem: 'O chassi não pode conter as letras I, O ou Q.' };
    }

    // Verifica se contém apenas caracteres alfanuméricos válidos
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(chassi)) {
      return { valido: false, mensagem: 'O chassi contém caracteres inválidos.' };
    }

    return { valido: true };
  }

  // Validação do ANO
  function validarAno(ano) {
    const anoNum = parseInt(ano, 10);
    
    if (isNaN(anoNum)) {
      return { valido: false, mensagem: 'Ano inválido.' };
    }

    if (anoNum < 2000 || anoNum > 2100) {
      return { valido: false, mensagem: 'O ano deve estar entre 2000 e 2100.' };
    }

    return { valido: true };
  }

  btnCancel.addEventListener('click', (event) => {
    event.preventDefault();
    window.location.href = 'gerenciar-veiculo.html';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // Validação do CHASSI
    const validacaoChassi = validarChassi(data.chassi);
    if (!validacaoChassi.valido) {
      alert(validacaoChassi.mensagem);
      chassiInput.focus();
      return;
    }

    // Validação do ANO
    const validacaoAno = validarAno(data.ano);
    if (!validacaoAno.valido) {
      alert(validacaoAno.mensagem);
      anoInput.focus();
      return;
    }

    try {
      const response = await fetch('/veiculos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        mostrarAlerta('Veículo salvo com sucesso!', 'sucesso');
        form.reset();
      } else {
        const error = await response.json();
        alert(`Erro ao salvar: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro de rede:', error);
      alert('Não foi possível conectar ao servidor. Verifique o console.');
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