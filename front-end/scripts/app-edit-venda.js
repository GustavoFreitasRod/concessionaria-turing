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

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.querySelector('form');
    const btnCancel = document.querySelector('.btn-cancel');
    
    // Elementos da tela
    const datalistItens = document.getElementById('lista-itens');
    const inputItem = document.getElementById('mercadoria-veiculo');
    const radioMercadoria = document.getElementById('radioMercadoria');
    const radioVeiculo = document.getElementById('radioVeiculo');

    // Variáveis para armazenar as listas carregadas
    let todasMercadorias = [];
    let todosVeiculos = [];

    // Pega o ID da venda da URL
    const urlParams = new URLSearchParams(window.location.search);
    const vendaID = urlParams.get('id');

    if (!vendaID) {
        alert("Nenhuma venda selecionada para edição.");
        window.location.href = 'gerenciar-venda.html';
        return;
    }

    // 1. Carregar listas e depois os dados da venda
    async function carregarDadosIniciais() {
        try {
            // Carregar Mercadorias
            const resMercadorias = await fetch('/mercadorias');
            todasMercadorias = await resMercadorias.json();

            // Carregar Veículos
            const resVeiculos = await fetch('/veiculos');
            todosVeiculos = await resVeiculos.json();

            // Após ter as listas, carrega a venda para preencher o formulário
            await carregarDadosVenda();

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Erro ao conectar com o servidor.");
        }
    }

    // Função para configurar o campo (placeholder e limpar) - NÃO carrega a lista toda
    function atualizarTipoInput(tipo) {
        datalistItens.innerHTML = '';
        inputItem.value = ''; // Limpa o campo ao trocar o tipo manualmente
        
        if (tipo === 'mercadoria') {
            inputItem.placeholder = "Pesquise a mercadoria pelo nome ou código...";
        } else {
            inputItem.placeholder = "Pesquise o veículo pelo modelo ou chassi...";
        }
    }

    // Função de filtro dinâmico (igual ao cadastrar venda)
    function filtrarItens() {
        const termo = inputItem.value.toLowerCase();
        datalistItens.innerHTML = ""; // Limpa lista atual

        // Só busca se tiver termo digitado
        if (termo.length < 1) return;

        if (radioMercadoria.checked) {
            // --- FILTRO DE MERCADORIAS ---
            const resultados = todasMercadorias.filter(item => 
                item.nome.toLowerCase().includes(termo) || 
                String(item.cod_mercadoria).includes(termo)
            );

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

    // Eventos de troca de botão (Radio Buttons)
    radioMercadoria.addEventListener('change', () => atualizarTipoInput('mercadoria'));
    radioVeiculo.addEventListener('change', () => atualizarTipoInput('veiculo'));

    // Evento de digitação para filtro
    inputItem.addEventListener('input', filtrarItens);

    // 2. Carregar e Preencher a Venda
    async function carregarDadosVenda() {
        try {
            const response = await fetch(`/vendas?search=${vendaID}`);
            const vendas = await response.json();
            const venda = vendas.find(v => v.cod_venda == vendaID);

            if (!venda) {
                alert("Venda não encontrada.");
                window.location.href = 'gerenciar-venda.html';
                return;
            }

            // Preenche dados básicos
            form.cliente.value = venda.nome_cliente || venda.cliente_cpf_cnpj;
            form.data.value = venda.data_venda ? venda.data_venda.split('T')[0] : '';
            form.quantidade.value = venda.qtd_mercadoria || 1;
            form.valor.value = venda.valor || 0;

            // Lógica Inteligente dos Botões
            if (venda.veiculo_chassi) {
                // É Veículo
                radioVeiculo.checked = true;
                // Configura placeholder manualmente sem limpar valor
                inputItem.placeholder = "Pesquise o veículo pelo modelo ou chassi..."; 

                // Preenche o input com formato legível
                if (venda.modelo_veiculo) {
                    inputItem.value = `${venda.modelo_veiculo} (${venda.cor_veiculo}) | CHASSI: ${venda.veiculo_chassi}`;
                } else {
                    inputItem.value = venda.veiculo_chassi;
                }

            } else {
                // É Mercadoria
                radioMercadoria.checked = true;
                // Configura placeholder manualmente sem limpar valor
                inputItem.placeholder = "Pesquise a mercadoria pelo nome ou código...";

                // Preenche o input com formato legível
                if (venda.nome_mercadoria) {
                    inputItem.value = `${venda.nome_mercadoria} | REF: ${venda.cod_mercadoria}`;
                } else {
                    inputItem.value = venda.cod_mercadoria || '';
                }
            }

        } catch (error) {
            console.error(error);
        }
    }

    // Inicializa a tela
    carregarDadosIniciais();

    // 3. Salvar Edição
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        // Verifica qual botão está selecionado para saber como tratar o dado
        const isVeiculo = radioVeiculo.checked;
        let itemInput = data["mercadoria-veiculo"];
        let itemLimpo = itemInput;

        // Extração do ID ou Chassi
        if (isVeiculo) {
            if (itemInput.includes('| CHASSI:')) {
                itemLimpo = itemInput.split('| CHASSI:')[1].trim();
            }
        } else {
            if (itemInput.includes('| REF:')) {
                itemLimpo = itemInput.split('| REF:')[1].trim();
            }
        }

        // Valor original (caso esteja disabled/readonly)
        const valorOriginal = document.getElementById('valor').value;

        try {
            const response = await fetch(`/vendas/${vendaID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    "mercadoria-veiculo": itemLimpo,
                    quantidade: Number(data.quantidade),
                    valor: Number(valorOriginal),
                    is_veiculo: isVeiculo // Envia flag explícita para o Back-end
                })
            });

            if (response.ok || response.status === 204) {
                mostrarAlerta('Venda atualizada com sucesso!', 'sucesso');
                setTimeout(() => {
                    window.location.href = 'gerenciar-venda.html';
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
        window.location.href = 'gerenciar-venda.html';
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