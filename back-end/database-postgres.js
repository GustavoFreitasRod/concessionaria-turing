import { sql } from './db.js'

export class databaseTest {

    async listClientes(search) {
        let clientes;

        if (search) {
            clientes = await sql`
                SELECT * FROM Cliente 
                WHERE nome_completo ILIKE ${'%' + search + '%'}
                OR cpf_cnpj ILIKE ${'%' + search + '%'}
            `;
        } else {
            clientes = await sql`SELECT * FROM Cliente`;
        }
        
        return clientes;
    }

    async createCliente(cliente) {
        const {
            cpf_cnpj,
            nome_completo,
            telefone,
            email,
            estado,
            cidade,
            cep,
            bairro,
            rua,
            numero,
            tipo_cliente
        } = cliente;

        await sql`
            INSERT INTO Cliente (
                cpf_cnpj, nome_completo, telefone, email, estado, cidade,
                cep, bairro, rua, numero, tipo_cliente
            ) VALUES (
                ${cpf_cnpj}, ${nome_completo}, ${telefone}, ${email}, ${estado}, ${cidade},
                ${cep}, ${bairro}, ${rua}, ${numero}, ${tipo_cliente}
            )
        `;
    }

    async updateCliente(id, cliente) {
        const {
            nome_completo,
            telefone,
            email,
            estado,
            cidade,
            cep,
            bairro,
            rua,
            numero,
            tipo_cliente
        } = cliente;

        await sql`
            UPDATE Cliente SET
                nome_completo = ${nome_completo},
                telefone = ${telefone},
                email = ${email},
                estado = ${estado},
                cidade = ${cidade},
                cep = ${cep},
                bairro = ${bairro},
                rua = ${rua},
                numero = ${numero},
                tipo_cliente = ${tipo_cliente}
            WHERE cpf_cnpj = ${id}
        `;
    }

    async deleteCliente(id) {
        await sql`DELETE FROM Cliente WHERE cpf_cnpj = ${id}`;
    }

    async listVeiculos(search) {
        let veiculos;
        
        if (search) {
            veiculos = await sql`
                SELECT * FROM Veiculo 
                WHERE modelo ILIKE ${'%' + search + '%'}
                OR chassi ILIKE ${'%' + search + '%'}
            `;
        } else {
            veiculos = await sql`SELECT * FROM Veiculo`;
        }

        return veiculos;
    }

    async createVeiculo(veiculo) {
        const { chassi, cor, ano, modelo } = veiculo;

        await sql`
            INSERT INTO Veiculo (chassi, cor, ano, modelo)
            VALUES (${chassi}, ${cor}, ${ano}, ${modelo})
        `;
    }

    async updateVeiculo(chassi, veiculo) {
        const { cor, ano, modelo } = veiculo;

        await sql`
            UPDATE Veiculo SET
                cor = ${cor},
                ano = ${ano},
                modelo = ${modelo}
            WHERE chassi = ${chassi}
        `;
    }

    async deleteVeiculo(chassi) {
        await sql`DELETE FROM Veiculo WHERE chassi = ${chassi}`;
    }

    async listMercadorias(search) {
        let mercadorias;

        if (search) {
            mercadorias = await sql`
                SELECT * FROM Mercadoria 
                WHERE nome ILIKE ${'%' + search + '%'}
                OR cod_mercadoria::text ILIKE ${'%' + search + '%'}
            `;
        } else {
            mercadorias = await sql`SELECT * FROM Mercadoria`;
        }

        return mercadorias;
    }

    async createMercadoria(mercadoria) {
        const { cod_mercadoria, nome } = mercadoria;

        await sql`
            INSERT INTO Mercadoria (cod_mercadoria, nome)
            VALUES (${cod_mercadoria}, ${nome})
        `;
    }

    async updateMercadoria(id, mercadoria) {
        const { nome } = mercadoria;

        await sql`
            UPDATE Mercadoria SET
                nome = ${nome}
            WHERE cod_mercadoria = ${id}
        `;
    }

    async deleteMercadoria(id) {
        await sql`DELETE FROM Mercadoria WHERE cod_mercadoria = ${id}`;
    }

    async listUsuarios(search) {
        let usuarios;

        if (search) {
            usuarios = await sql`
                SELECT * FROM Usuario
                WHERE nome ILIKE ${'%' + search + '%'}
                OR cod_usuario::text ILIKE ${'%' + search + '%'}
            `;
        } else {
            usuarios = await sql`SELECT * FROM Usuario`;
        }

        return usuarios;
    }

    async verifyUser(nome) {
        const result = await sql`
            SELECT * FROM Usuario WHERE nome = ${nome}
        `;
        return result[0];
    }

      async verifyEmail(email) {
        const result = await sql`
            SELECT * FROM Usuario WHERE email = ${email}
        `;
        return result[0];
    }

    async createUsuario(usuario) {
        const { nome, email, senha } = usuario;

        await sql`
            INSERT INTO Usuario (nome, email, senha)
            VALUES (${nome}, ${email}, ${senha})
        `;
    }

    async getUsuarioById(id) {
        const result = await sql`
            SELECT * FROM Usuario WHERE cod_usuario = ${id}
        `;
        return result[0];
    }

    async updateUsuario(id, usuario) {
        const { nome, email, senha } = usuario;

        await sql`
            UPDATE Usuario SET
                nome = ${nome},
                email = ${email},
                senha = ${senha}
            WHERE cod_usuario = ${id}
        `;
    }

    async deleteUsuario(id) {
        await sql`DELETE FROM Usuario WHERE cod_usuario = ${id}`;
    }

    async listVendas(search) {
        let vendas;

        if (search) {
            // Consulta COM filtro
            vendas = await sql`
                SELECT 
                    v.cod_venda,
                    v.data_venda,
                    v.valor,
                    v.qtd_mercadoria,
                    v.cliente_cpf_cnpj,
                    v.cod_mercadoria,
                    v.veiculo_chassi,
                    c.nome_completo AS nome_cliente,
                    m.nome AS nome_mercadoria,
                    ve.modelo AS modelo_veiculo,
                    ve.cor AS cor_veiculo
                FROM Venda v
                LEFT JOIN Cliente c ON v.cliente_cpf_cnpj = c.cpf_cnpj
                -- FORÇANDO COMPARAÇÃO COMO TEXTO
                LEFT JOIN Mercadoria m ON v.cod_mercadoria::text = m.cod_mercadoria::text
                LEFT JOIN Veiculo ve ON v.veiculo_chassi = ve.chassi
                WHERE v.cod_venda::text ILIKE ${'%' + search + '%'}
                OR c.nome_completo ILIKE ${'%' + search + '%'}
                OR m.nome ILIKE ${'%' + search + '%'}
                OR ve.modelo ILIKE ${'%' + search + '%'}
            `;
        } else {
            vendas = await sql`
                SELECT 
                    v.cod_venda,
                    v.data_venda,
                    v.valor,
                    v.qtd_mercadoria,
                    v.cliente_cpf_cnpj,
                    v.cod_mercadoria,
                    v.veiculo_chassi,
                    c.nome_completo AS nome_cliente,
                    m.nome AS nome_mercadoria,
                    ve.modelo AS modelo_veiculo,
                    ve.cor AS cor_veiculo
                FROM Venda v
                LEFT JOIN Cliente c ON v.cliente_cpf_cnpj = c.cpf_cnpj
                -- FORÇANDO COMPARAÇÃO COMO TEXTO
                LEFT JOIN Mercadoria m ON v.cod_mercadoria::text = m.cod_mercadoria::text
                LEFT JOIN Veiculo ve ON v.veiculo_chassi = ve.chassi
                ORDER BY v.data_venda DESC
            `;
        }

        return vendas;
    }

    async createVenda(venda) {
        const { data_venda, valor, qtd_mercadoria, cod_mercadoria, veiculo_chassi, cliente_cpf_cnpj } = venda;

        const result = await sql`
            INSERT INTO Venda (data_venda, valor, qtd_mercadoria, cod_mercadoria, veiculo_chassi, cliente_cpf_cnpj)
            VALUES (${data_venda}, ${valor}, ${qtd_mercadoria}, ${cod_mercadoria}, ${veiculo_chassi}, ${cliente_cpf_cnpj})
            RETURNING cod_venda
        `;

        return result[0];
    }

    async updateVenda(id, venda) {
        const { valor, qtd_mercadoria, cod_mercadoria, veiculo_chassi } = venda;

        await sql`
            UPDATE Venda SET
                valor = ${valor},
                qtd_mercadoria = ${qtd_mercadoria},
                cod_mercadoria = ${cod_mercadoria},
                veiculo_chassi = ${veiculo_chassi}
            WHERE cod_venda = ${id}
        `;
    }

    async deleteVenda(id) {
        await sql`DELETE FROM Venda WHERE cod_venda = ${id}`;
    }

}