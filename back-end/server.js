import { fastify } from 'fastify'
import cors from '@fastify/cors'
import { databaseTest } from './database-postgres.js'

import path from 'path'
import { fileURLToPath } from 'url'
import fastifyStatic from '@fastify/static'

import bcrypt from 'bcrypt'
import { createAuthToken, verifyAuthToken } from './auth-token.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontEndPath = path.join(__dirname, '..', 'front-end')
const PORT = Number(process.env.PORT) || 3333
const AUTH_SECRET = process.env.AUTH_SECRET || 'change-me-in-production'

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((item) => item.trim())
  : true


const db = new databaseTest()
const server = fastify({
  logger: true, 
})

await server.register(cors, {
  origin: corsOrigin,
})

await server.register(fastifyStatic, {
  root: frontEndPath,
  prefix: '/', 
})

server.addHook('preHandler', async (request, reply) => {
  const protectedPrefixes = ['/clientes', '/veiculos', '/mercadorias', '/usuarios', '/vendas']
  const path = request.url.split('?')[0]

  if (path === '/' || path === '/login') return

  const isProtectedApi = protectedPrefixes.some((prefix) =>
    path.startsWith(prefix),
  )

  if (!isProtectedApi) return

  const authHeader = request.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Sessão inválida. Faça login novamente.' })
  }

  const token = authHeader.slice(7)
  const payload = verifyAuthToken(token, AUTH_SECRET)

  if (!payload) {
    return reply.status(401).send({ error: 'Sessão expirada. Faça login novamente.' })
  }

  request.user = payload
})

server.get('/', (request, reply) => {
  return reply.sendFile('login.html') //
})


server.post('/login', async (request, reply) => {
  const { email, senha } = request.body;

  try {
    const user = await db.verifyEmail(email);

    if (!user) {
      return reply.status(401).send({ error: 'E-mail ou senha incorretos' });
    }
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return reply.status(401).send({ error: 'E-mail ou senha incorretos' });
    }

    // LÓGICA DE ADMIN: Verifica se o nome é 'admin' (pode ajustar conforme sua necessidade)
    const isAdmin = user.nome.toLowerCase() === 'admin';

    // Retorna o flag isAdmin para o front-end
    const token = createAuthToken(
      {
        nome: user.nome,
        isAdmin,
      },
      AUTH_SECRET,
    )

    return reply.status(200).send({ 
        message: 'Login realizado com sucesso', 
        nome: user.nome,
        isAdmin: isAdmin,
        token,
    });

  } catch (error) {
    server.log.error(error);
    return reply.status(500).send({ error: 'Erro interno no servidor' });
  }
});


server.post('/clientes', async (request, reply) => {
  try {

    const {
      nome, cpf_cnpj, telefone, email, cep, rua,
      numero, bairro, cidade, uf, tipoPessoa 
    } = request.body

    const clienteParaSalvar = {
      nome_completo: nome,  
      cpf_cnpj: cpf_cnpj,
      telefone: telefone,
      email: email,
      estado: uf,        
      cidade: cidade,
      cep: cep,
      bairro: bairro,
      rua: rua,
      numero: parseInt(numero) || null, 
      tipo_cliente: tipoPessoa
    }

    await db.createCliente(clienteParaSalvar)
    return reply.status(201).send({ message: 'Cliente criado!' })

  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: error.message || 'Erro ao criar cliente' })
  }
})

server.get('/clientes', async (request, reply) => {
  try {
    const search = request.query.search
    const clientes = await db.listClientes(search)
    return clientes
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao listar clientes' })
  }
})

server.put('/clientes/:id', async (request, reply) => {
  try {
    const clienteID = request.params.id 
    
    // 1. Corrigido para ler 'cpf_cnpj' e 'tipoPessoa'
    const {
      nome, cpf_cnpj, telefone, email, cep, rua, 
      numero, bairro, cidade, uf, tipoPessoa
    } = request.body

    const clienteParaAtualizar = {
      nome_completo: nome,
      cpf_cnpj: cpf_cnpj, 
      telefone: telefone,
      email: email,
      estado: uf,
      cidade: cidade,
      cep: cep,
      bairro: bairro,
      rua: rua,
      numero: parseInt(numero) || null,
      tipo_cliente: tipoPessoa 
    }

    await db.updateCliente(clienteID, clienteParaAtualizar)
    return reply.status(204).send()

  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: error.message || 'Erro ao atualizar cliente' })
  }
})

server.delete('/clientes/:id', async (request, reply) => {
  try {
    const clienteID = request.params.id
    await db.deleteCliente(clienteID)
    return reply.status(204).send()
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao deletar cliente' })
  }
})



server.post('/veiculos', async (request, reply) => {
  try {
    const { chassi, cor, ano, modelo } = request.body
    
    const veiculoParaSalvar = {
      chassi,
      cor,
      ano: parseInt(ano) || null, 
      modelo
    }

    await db.createVeiculo(veiculoParaSalvar)
    return reply.status(201).send({ message: 'Veículo criado!' })

  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao criar veículo' })
  }
})

server.get('/veiculos', async (request, reply) => {
  try {
    const search = request.query.search
    const veiculos = await db.listVeiculos(search)
    return veiculos
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao listar veículos' })
  }
})

server.put('/veiculos/:chassi', async (request, reply) => {
  try {
    const veiculoChassi = request.params.chassi
    const { cor, ano, modelo } = request.body

    await db.updateVeiculo(veiculoChassi, {
      cor,
      ano: parseInt(ano) || null, 
      modelo
    })
    return reply.status(204).send()

  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao atualizar veículo' })
  }
})

server.delete('/veiculos/:chassi', async (request, reply) => {
  try {
    const veiculoChassi = request.params.chassi
    await db.deleteVeiculo(veiculoChassi)
    return reply.status(204).send()
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao deletar veículo' })
  }
})

server.post('/mercadorias', async (request, reply) => {
  try {
    
    const { codigo, item } = request.body
    await db.createMercadoria({
        cod_mercadoria : codigo,
        nome: item
    })
    return reply.status(201).send({ message: 'Mercadoria criada!' })

  } catch (error) {
    server.log.error(error)
    if (error.code === '23505') {
        return reply.status(409).send({ error: 'Este código de mercadoria já existe.' })
    }
    return reply.status(500).send({ error: 'Erro ao criar mercadoria' })
  }
})

server.get('/mercadorias', async (request, reply) => {
  try {
    const search = request.query.search
    const mercadorias = await db.listMercadorias(search)
    return mercadorias
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao listar mercadorias' })
  }
})

server.put('/mercadorias/:cod', async (request, reply) => {
  try {
    const codMercadoria = request.params.cod
    const { item } = request.body
    await db.updateMercadoria(codMercadoria, {
        nome: item
    })
    return reply.status(204).send()

  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao atualizar mercadoria' })
  }
})

server.delete('/mercadorias/:cod', async (request, reply) => {
  try {
    const codMercadoria = request.params.cod
    await db.deleteMercadoria(codMercadoria)
    return reply.status(204).send()
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao deletar mercadoria' })
  }
})


server.post('/usuarios', async (request, reply) => {
  try {
    const { nome, email, senha } = request.body

    const hashedPassword = await bcrypt.hash(senha, 10);

    const usuarioParaSalvar = {
      nome,
      email,
      senha: hashedPassword 
    }
    
    await db.createUsuario(usuarioParaSalvar)
    return reply.status(201).send({ message: 'Usuario criado!' })

  } catch (error) {
    server.log.error(error)
    if (error.code === '23505') { 
        return reply.status(409).send({ error: 'Este e-mail já está cadastrado.' })
    }
    return reply.status(500).send({ error: 'Erro ao criar usuario' })
  }
})

server.get('/usuarios', async (request, reply) => {
  try {
    const search = request.query.search
    const usuarios = await db.listUsuarios(search)
    return usuarios
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao listar Usuarios' })
  }
})

server.put('/usuarios/:cod', async (request, reply) => {
  try {
    const codUsuario = request.params.cod
    const { nome, email, senha } = request.body

    const usuarioAtual = await db.getUsuarioById(codUsuario)
    if (!usuarioAtual) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    let senhaFinal = usuarioAtual.senha
    if (senha && senha.trim() !== '') {
      senhaFinal = await bcrypt.hash(senha, 10)
    }
    
    await db.updateUsuario(codUsuario, {
        nome,
        email,
        senha: senhaFinal
    })
    return reply.status(204).send()

  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao atualizar usuario' })
  }
})

server.delete('/usuarios/:cod', async (request, reply) => {
  try {
    const codUsuario = request.params.cod
    await db.deleteUsuario(codUsuario)
    return reply.status(204).send()
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao deletar Usuario' })
  }
})

server.post('/vendas', async (request, reply) => {
  try {
    const { cliente, data, 'mercadoria-veiculo': itemInput, quantidade, valor, is_veiculo } = request.body

    let cod_mercadoria = null;
    let veiculo_chassi = null;

    if (is_veiculo === true || (itemInput && itemInput.length === 17 && isNaN(itemInput))) {
        veiculo_chassi = itemInput ? itemInput.trim() : null;
    } else {
        const codigoMercadoria = Number.parseInt(itemInput, 10);
        if (Number.isNaN(codigoMercadoria)) {
          return reply.status(400).send({ error: 'Código da mercadoria inválido.' });
        }
        cod_mercadoria = codigoMercadoria;
    }

    const vendaParaSalvar = {
      data_venda: data,
      valor: parseFloat(valor) || 0,
      qtd_mercadoria: parseInt(quantidade) || 1,
      cod_mercadoria: cod_mercadoria,
      veiculo_chassi: veiculo_chassi,
      cliente_cpf_cnpj: cliente
    }

    const result = await db.createVenda(vendaParaSalvar)
    return reply.status(201).send({ message: 'Venda criada!', cod_venda: result.cod_venda })

  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: error.message || 'Erro ao criar venda' })
  }
})

server.get('/vendas', async (request, reply) => {
  try {
    const search = request.query.search
    const vendas = await db.listVendas(search)
    return vendas
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao listar vendas' })
  }
})

server.put('/vendas/:id', async (request, reply) => {
  try {
    const vendaId = request.params.id
    const { "mercadoria-veiculo": itemInput, quantidade, valor, is_veiculo } = request.body

    let cod_mercadoria = null;
    let veiculo_chassi = null;

    if (is_veiculo === true) {
      veiculo_chassi = itemInput ? itemInput.trim() : null;
        cod_mercadoria = null;
    } else {
      if (itemInput && itemInput.trim() !== '') {
        const codigoMercadoria = Number.parseInt(itemInput, 10);
        if (Number.isNaN(codigoMercadoria)) {
          return reply.status(400).send({ error: 'Código da mercadoria inválido.' });
        }
        cod_mercadoria = codigoMercadoria;
      } else {
        cod_mercadoria = null;
        }
        veiculo_chassi = null;
    }

    await db.updateVenda(vendaId, {
      valor: parseFloat(valor) || 0,
      qtd_mercadoria: parseInt(quantidade) || 0,
      cod_mercadoria: cod_mercadoria, // Agora envia a string corretamente
      veiculo_chassi: veiculo_chassi
    })
    return reply.status(204).send()

  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao atualizar venda' })
  }
})

server.delete('/vendas/:id', async (request, reply) => {
  try {
    const vendaId = request.params.id
    await db.deleteVenda(vendaId)
    return reply.status(204).send()
  } catch (error) {
    server.log.error(error)
    return reply.status(500).send({ error: 'Erro ao deletar venda' })
  }
})


server.listen({
  host: '0.0.0.0',
  port: PORT,
}).then(() => {
  console.log(`Servidor HTTP rodando na porta ${PORT}`)
})