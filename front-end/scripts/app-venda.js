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
    const form = document.querySelector('#formVenda');
    const btnCancel = document.querySelector('.btn-cancel');

    // Inputs e datalists
    const datalistClientes = document.getElementById('lista-clientes');
    const datalistItens = document.getElementById('lista-itens');
    const inputCliente = document.getElementById('cliente');
    const inputItem = document.getElementById('mercadoria-veiculo');

    // Botões de rádio
    const radioMercadoria = document.getElementById('radioMercadoria');
    const radioVeiculo = document.getElementById('radioVeiculo');

    // Dados locais
    let todosClientes = [];
    let todasMercadorias = [];
    let todosVeiculos = [];

    // Carregar dados
    carregarDadosIniciais();

    btnCancel.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.href = 'gerenciar-venda.html';
    });

    // Alternar mercadoria/veículo (apenas limpa e muda o placeholder)
    radioMercadoria.addEventListener('change', () => atualizarTipoInput('mercadoria'));
    radioVeiculo.addEventListener('change', () => atualizarTipoInput('veiculo'));

    // Filtros dinâmicos (ao digitar)
    inputCliente.addEventListener('input', filtrarClientes);
    inputItem.addEventListener('input', filtrarItens);

    async function carregarDadosIniciais() {
        try {
            // Carrega todos os dados para a memória do navegador
            const resClientes = await fetch('/clientes');
            todosClientes = await resClientes.json();

            const resMercadorias = await fetch('/mercadorias');
            todasMercadorias = await resMercadorias.json();

            const resVeiculos = await fetch('/veiculos');
            todosVeiculos = await resVeiculos.json();

            // Define o estado inicial do input
            atualizarTipoInput('mercadoria'); 

        } catch (error) {
            console.error("Erro ao carregar listas:", error);
            alert("Erro ao carregar dados do servidor.");
        }
    }

    // --- LÓGICA DE CLIENTE (Mantida igual) ---
    function filtrarClientes() {
        const termo = inputCliente.value.toLowerCase();
        datalistClientes.innerHTML = "";

        if (termo.length < 1) return;

        const resultados = todosClientes.filter(c =>
            c.nome_completo.toLowerCase().includes(termo) ||
            c.cpf_cnpj.includes(termo)
        );

        resultados.slice(0, 20).forEach(cliente => {
            const option = document.createElement('option');
            option.value = `${cliente.nome_completo} | CPF: ${cliente.cpf_cnpj}`;
            datalistClientes.appendChild(option);
        });
    }

    // --- NOVA LÓGICA DE MERCADORIA/VEÍCULO ---

    // 1. Apenas prepara o campo quando troca o rádio, sem carregar a lista toda
    function atualizarTipoInput(tipo) {
        datalistItens.innerHTML = ''; // Limpa as opções anteriores
        inputItem.value = '';         // Limpa o que foi digitado

        if (tipo === 'mercadoria') {
            inputItem.placeholder = "Pesquise a mercadoria pelo nome ou código...";
        } else {
            inputItem.placeholder = "Pesquise o veículo pelo modelo ou chassi...";
        }
    }

    // 2. Filtra conforme o usuário digita
    function filtrarItens() {
        const termo = inputItem.value.toLowerCase();
        datalistItens.innerHTML = ""; // Limpa a lista atual

        // Só começa a buscar se tiver algo digitado
        if (termo.length < 1) return;

        if (radioMercadoria.checked) {
            // --- FILTRO DE MERCADORIAS ---
            const resultados = todasMercadorias.filter(item => 
                item.nome.toLowerCase().includes(termo) || 
                String(item.cod_mercadoria).includes(termo)
            );

            // Exibe no máximo 20 resultados para não travar a tela
            resultados.slice(0, 20).forEach(item => {
                const option = document.createElement('option');
                option.value = `${item.nome} | REF: ${item.cod_mercadoria}`;
                datalistItens.appendChild(option);
            });

        } else {
            // --- FILTRO DE VEÍCULOS ---
            const resultados = todosVeiculos.filter(veiculo => 
                veiculo.modelo.toLowerCase().includes(termo) || 
                veiculo.chassi.toLowerCase().includes(termo)
            );

            resultados.slice(0, 20).forEach(veiculo => {
                const option = document.createElement('option');
                option.value = `${veiculo.modelo} (${veiculo.cor}) | CHASSI: ${veiculo.chassi}`;
                datalistItens.appendChild(option);
            });
        }
    }

    // --- ENVIO DO FORMULÁRIO (Mantido igual) ---
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Tratamento do Cliente
        let clienteInput = data.cliente;
        let clienteLimpo = clienteInput.includes('| CPF:')
            ? clienteInput.split('| CPF:')[1].trim()
            : clienteInput;

        clienteLimpo = clienteLimpo.replace(/\D/g, '');

        // Tratamento de Mercadoria/Veículo
        const isVeiculo = radioVeiculo.checked;
        let itemInput = data['mercadoria-veiculo'];
        let itemLimpo = itemInput;

        // Extrai o ID ou Chassi da string formatada
        if (isVeiculo && itemInput.includes('| CHASSI:')) {
            itemLimpo = itemInput.split('| CHASSI:')[1].trim();
        }
        if (!isVeiculo && itemInput.includes('| REF:')) {
            itemLimpo = itemInput.split('| REF:')[1].trim();
        }

        const bodyFinal = {
            cliente: clienteLimpo,
            data: data.data,
            quantidade: data.quantidade,
            valor: data.valor,
            "mercadoria-veiculo": itemLimpo,
            is_veiculo: isVeiculo
        };

        try {
            const response = await fetch('/vendas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyFinal),
            });

            if (response.ok) {
                mostrarAlerta('Venda cadastrada com sucesso!', 'sucesso');
                setTimeout(() => {
                    window.location.href = 'gerenciar-venda.html';
                }, 1200);
            } else {
                const error = await response.json();

                let msg = error.error || 'Erro desconhecido';
                if (msg.includes('fk_venda_cliente')) msg = 'Cliente não encontrado. Verifique o CPF.';
                if (msg.includes('fk_venda_mercadoria')) msg = 'Código da mercadoria inválido.';
                if (msg.includes('fk_venda_veiculo')) msg = 'Chassi do veículo inválido.';

                alert(`Erro ao salvar: ${msg}`);
            }

        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Erro de conexão com o servidor.');
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