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

  const tipoPF = document.getElementById('tipoPF');
  const tipoPJ = document.getElementById('tipoPJ');
  const labelDocumento = document.getElementById('labelDocumento');
  const inputDocumento = document.getElementById('cpf_cnpj');
  const inputTelefone = document.getElementById('telefone');
  const inputCep = document.getElementById('cep');
  const inputRua = document.getElementById('rua');
  const inputBairro = document.getElementById('bairro');
  const inputCidade = document.getElementById('cidade');
  const inputUf = document.getElementById('uf');
  let enderecoTravado = false;

  function travarCamposEndereco(travar) {
    inputRua.readOnly = travar;
    inputBairro.readOnly = travar;
    inputCidade.readOnly = travar;
    inputUf.disabled = travar;
    enderecoTravado = travar;
  }

  function mascaraCPF(valor) {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }

  function mascaraCNPJ(valor) {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }

  function mascaraTelefone(valor) {
    valor = valor.replace(/\D/g, '');
    
    if (valor.length <= 11) {
      valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
      valor = valor.replace(/(\d{1})(\d{4})(\d{4})$/, '$1 $2-$3');
    }
    
    return valor.substring(0, 16);
  }

  function mascaraCEP(valor) {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1');
  }

  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '');
    
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let soma = 0;
    let resto;
    
    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(9, 10))) return false;
    
    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    }
    
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.substring(10, 11))) return false;
    
    return true;
  }

  function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '');
    
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(0)) return false;
    
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado != digitos.charAt(1)) return false;
    
    return true;
  }

  async function buscarCEP(cep) {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) return;
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        mostrarAlerta('CEP não encontrado!');
        travarCamposEndereco(false);
        return;
      }
      
      inputRua.value = data.logradouro || '';
      inputBairro.value = data.bairro || '';
      inputCidade.value = data.localidade || '';
      inputUf.value = data.uf || '';
      travarCamposEndereco(true);
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      alert('Erro ao buscar CEP. Verifique sua conexão.');
      travarCamposEndereco(false);
    }
  }

  function atualizarCampoDocumento() {
    if (tipoPJ.checked) {
      labelDocumento.innerHTML = 'CNPJ: <span class="required">*</span>';
      inputDocumento.placeholder = '00.000.000/0000-00';
      inputDocumento.maxLength = 18;
    } else {
      labelDocumento.innerHTML = 'CPF: <span class="required">*</span>';
      inputDocumento.placeholder = '000.000.000-00';
      inputDocumento.maxLength = 14;
    }
    inputDocumento.value = '';
  }

  tipoPF.addEventListener('change', atualizarCampoDocumento);
  tipoPJ.addEventListener('change', atualizarCampoDocumento);

  inputDocumento.addEventListener('input', function(e) {
    if (tipoPJ.checked) {
      e.target.value = mascaraCNPJ(e.target.value);
    } else {
      e.target.value = mascaraCPF(e.target.value);
    }
  });

  // blur CPF/CNPJ
  inputDocumento.addEventListener('blur', function(e) {
    const valor = e.target.value.replace(/\D/g, '');
    
    if (valor.length === 0) return;
    
    if (tipoPJ.checked) {
      if (!validarCNPJ(e.target.value)) {
        mostrarAlerta('CNPJ inválido!');
        e.target.value = '';
      }
    } else {
      if (!validarCPF(e.target.value)) {
        mostrarAlerta('CPF inválido!');
        e.target.value = '';
      }
    }
  });

  inputTelefone.addEventListener('input', function(e) {
    e.target.value = mascaraTelefone(e.target.value);
  });
  inputTelefone.maxLength = 16;

  inputCep.addEventListener('input', function(e) {
    e.target.value = mascaraCEP(e.target.value);
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length < 8 && enderecoTravado) {
      travarCamposEndereco(false);
    }
  });
  inputCep.maxLength = 9;

  // blur de busca de dados
  inputCep.addEventListener('blur', function(e) {
    const cep = e.target.value.replace(/\D/g, '');
    if (cep.length === 8) {
      buscarCEP(cep);
    } else {
      travarCamposEndereco(false);
    }
  });

  atualizarCampoDocumento();

  //navegação com enter
  const inputs = form.querySelectorAll('input');
  inputs.forEach(input => {
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        input.blur();
      }
    });
  });

  btnCancel.addEventListener('click', (event) => {
    event.preventDefault(); 
    window.location.href = 'gerenciar-cliente.html';
  });

  // Por este novo:
  form.addEventListener('submit', async (event) => {
    event.preventDefault(); // impede o recarregamento da página

    // ✅ Validação HTML5 antes de continuar
    if (!form.checkValidity()) {
      form.reportValidity(); // mostra mensagens nativas do navegador
      return;
    }

    const ufEstavaDesabilitado = inputUf.disabled;
    if (ufEstavaDesabilitado) {
      inputUf.disabled = false;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    if (ufEstavaDesabilitado) {
      inputUf.disabled = true;
    }

    // Remove máscaras
    if (data.cpf_cnpj) data.cpf_cnpj = data.cpf_cnpj.replace(/\D/g, '');
    if (data.telefone) data.telefone = data.telefone.replace(/\D/g, '');
    if (data.cep) data.cep = data.cep.replace(/\D/g, '');

    try {
      const response = await fetch('/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        mostrarAlerta('Cliente salvo com sucesso!', 'sucesso');
        form.reset();
        setTimeout(() => {
          window.location.href = 'gerenciar-cliente.html';
        }, 1200);
      } else {
        const error = await response.json();

        let mensagemErro = 'Erro ao salvar cliente.';
        if (response.status === 409 || (error.error && error.error.includes('duplicate'))) {
          mensagemErro = 'Este CPF/CNPJ já está cadastrado no sistema.';
        } else if (response.status === 400) {
          mensagemErro = 'Dados inválidos. Verifique as informações e tente novamente.';
        } else if (error.error) {
          mensagemErro = error.error;
        }

        alert(mensagemErro);
      }
    } catch (error) {
      console.error('Erro de rede:', error);
      alert('Erro ao cadastrar cliente. Verifique sua conexão.');
    }
  });
});

function mostrarAlerta(mensagem, tipo = "erro") {
  const alerta = document.createElement("div");

  alerta.className = `alerta ${tipo}`;
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