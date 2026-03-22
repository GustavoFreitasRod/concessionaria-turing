// create-table.js
import { sql } from './db.js';

async function createTables() {
  console.log("Iniciando a criação das tabelas...");

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS Cliente (
        cpf_cnpj VARCHAR(14) PRIMARY KEY,
        nome_completo VARCHAR(50),
        telefone VARCHAR(11),
        email VARCHAR(100),
        estado CHAR(2),
        cidade VARCHAR(30),
        cep VARCHAR(8),
        bairro VARCHAR(30),
        rua VARCHAR(30),
        numero INTEGER,
        tipo_cliente VARCHAR(2) CHECK (tipo_cliente IN ('pf', 'pj'))
      );
    `;
    console.log("Tabela 'Cliente' criada com sucesso (ou já existe).");

    await sql`
      CREATE TABLE IF NOT EXISTS Veiculo (
        chassi VARCHAR(17) PRIMARY KEY,
        cor VARCHAR(30),
        ano INTEGER,
        modelo VARCHAR(40)
      );
    `;
    console.log("Tabela 'Veiculo' criada com sucesso (ou já existe).");
    
    await sql`
      CREATE TABLE IF NOT EXISTS Mercadoria (
        cod_mercadoria INTEGER PRIMARY KEY,
        nome VARCHAR(30),
        tipo VARCHAR(15) CHECK (tipo IN ('peca','boutique','capacete','oleo'))
        );
      `;
    console.log("Tabela 'Mercadoria' criada com sucesso (ou já existe).");

    await sql`
      CREATE TABLE IF NOT EXISTS Usuario (
        cod_usuario SMALLSERIAL PRIMARY KEY,
        nome VARCHAR(30),
        email VARCHAR(100),
        senha VARCHAR(100)
        );
      `;
    console.log("Tabela 'Usuario' criada com sucesso (ou já existe).");

    await sql`
      CREATE TABLE IF NOT EXISTS Venda (
        cod_venda BIGSERIAL PRIMARY KEY,
        data_venda TIMESTAMP,
        valor DECIMAL(8,2),
        qtd_mercadoria SMALLINT,

        cod_mercadoria INTEGER,
        veiculo_chassi VARCHAR(17),
        cliente_cpf_cnpj VARCHAR(14),

        CONSTRAINT fk_venda_mercadoria
            FOREIGN KEY (cod_mercadoria)
            REFERENCES Mercadoria(cod_mercadoria)
            ON DELETE SET NULL,

        CONSTRAINT fk_venda_veiculo
            FOREIGN KEY (veiculo_chassi)
            REFERENCES Veiculo(chassi)
            ON DELETE SET NULL,

        CONSTRAINT fk_venda_cliente
            FOREIGN KEY (cliente_cpf_cnpj)
            REFERENCES Cliente(cpf_cnpj)
            ON DELETE RESTRICT
        );
      `;
    console.log("Tabela 'Venda' criada com sucesso (ou já existe).");
    
    console.log("\nCriação de tabelas concluída!");
      
  } catch (error) {
    console.error("Erro ao criar as tabelas:", error);
  }
}

createTables();