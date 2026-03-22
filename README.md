# Projeto Concessionária Turing
![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![NODEJS](https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=Node.js&logoColor=white)
![JAVASCRIPT](https://shields.io/badge/JavaScript-F7DF1E?logo=JavaScript&logoColor=000&style=flat-square)
![POSTGRESQL](https://img.shields.io/badge/PostgreSQL-316192?logo=postgresql&logoColor=white)

## :pushpin: Descrição: 
É um Sistema Web de gestãoo para concessionárias com cadastro e gerenciamento de clientes, veículos, mercadorias, usuários e vendas.

**IMPORTANTE**: A ConcessionÁria Turing não existe no mundo real: ela é uma empresa fictícia criada exclusivamente para este projeto, com objetivo educacional e de demonstração técnica.

## :computer: Demonstração Online
O projeto está hospedado no Render e banco de dados no Neon para facilitar a visualização sem precisar configurar ambiente local.

- URL: https://concessionaria-turing.onrender.com/
- Credenciais de teste:
	- E-mail: admin@teste.com
	- Senha: 123456

## :hammer: Funcionalidades do Sistema
- CRUD de clientes;
- CRUD de veículos;
- CRUD de mercadorias;
- CRUD de usuários;
- CRUD de vendas;
- Autenticação com token;
- Criptografia de senhas;
- Controle de acesso para rotas protegidas;
- Servir front-end estático pelo proprio back-end;

## :bar_chart:; Tecnologias utilizadas

- **Node.js**: Runtime JavaScript que permite executar JavaScript no lado do servidor, fornecendo um ambiente eficiente e escalável para construir aplicações web.

- **Fastify**: Framework web de alta performance para Node.js. Oferece roteamento rapido, suporte a plugins e validação de esquemas nativamente.

- **PostgreSQL**: Sistema de gerenciamento de banco de dados relacional open-source, robusto e confiável. Utilizado para armazenar todos os dados da aplicação.

- **Bcrypt**: Biblioteca para hashing seguro de senhas. Aplica algoritmos criptográficos especializados para proteger senhas contra ataques de força bruta.

- **HTML, CSS e JavaScript**: Tecnologias fundamentais do front-end para construir a interface do usuário, estilos visuais e interações dinâmicas.

## &#x1F4C1; Estrutura do Projeto

```text
back-end/
	auth-token.js
	create-table.js
	database-postgres.js
	db.js
	server.js
database/
	Logico.sql
front-end/
	*.html
	scripts/
	assets/
```
## &#x25B6; Como Executar Localmente
### 1. Clonar o repositorio

```bash
git clone https://github.com/GustavoFreitasRod/concessionaria-turing
cd concessionaria-turing
```

### 2. Configurar o back-end

```bash
cd back-end
npm install
```

Crie o arquivo .env com base no exemplo abaixo:

```env
DATABASE_URL=postgres://usuario:senha@host/database?sslmode=require
AUTH_SECRET=troque-por-uma-chave-secreta-forte
CORS_ORIGIN=http://127.0.0.1:5500
```

&#x26A0; **Antes de iniciar a aplicação, crie o banco de dados PostgreSQL e conecte o projeto usando a DATABASE_URL:**
- Crie e conecte um banco PostgreSQL antes de rodar o sistema.
- Conexao centralizada no arquivo back-end/db.js.
- Criacao automatizada de tabelas no arquivo back-end/create-table.js.
- Schema SQL de referencia no arquivo database/Logico.sql.

### 3. Criar tabelas no banco

```bash
npm run db:setup
```

### 4. Iniciar a aplicação

```bash
npm start
```

**:bulb: Por padrão, a API sobe na porta 3333 em ambiente local.**
