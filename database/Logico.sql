CREATE TABLE Cliente (
    cpf_cnpj VARCHAR(14) PRIMARY KEY,
    nome_completo VARCHAR(50),
    telefone VARCHAR(11),
    email VARCHAR(30),
    estado CHAR(2),
    cidade VARCHAR(30),
    cep VARCHAR(8),
    bairro VARCHAR(30),
    rua VARCHAR(30),
    numero SMALLINT,
    tipo_cliente VARCHAR(2) CHECK (tipo_cliente IN ('pf', 'pj'))
)

CREATE TABLE Veiculo (
    chassi VARCHAR(17) PRIMARY KEY,
    cor VARCHAR(30),
    ano INTEGER,
    modelo VARCHAR(10) CHECK (modelo IN ('Pop 110', 'Biz125', 'CG 160', 'XRE 200', 'CB 300'))
)

CREATE TABLE Mercadoria (
    cod_mercadoria INTEGER PRIMARY KEY,
    nome VARCHAR(30),
    tipo VARCHAR(15) CHECK (tipo IN ('peca','boutique','capacete','oleo'))
);

CREATE TABLE Usuario (
    cod_usuario SMALLSERIAL PRIMARY KEY,
    nome VARCHAR(30),
    email VARCHAR(30),
    senha VARCHAR(20)
);

CREATE TABLE Venda (
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