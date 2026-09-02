# DataLoy

Sistema web de fidelização de clientes desenvolvido como projeto acadêmico do curso de Sistemas de Informação.

O DataLoy foi desenvolvido para auxiliar pequenos estabelecimentos comerciais na gestão do relacionamento com seus clientes, permitindo acompanhar vendas, pontos de fidelidade e recompensas, além de disponibilizar indicadores e relatórios para apoiar a tomada de decisão.

## Funcionalidades

- Cadastro e gerenciamento de clientes
- Registro de vendas
- Sistema de pontuação por compras
- Histórico de movimentações de pontos
- Cadastro e gerenciamento de recompensas
- Resgate de recompensas
- Dashboard com indicadores
- Relatórios de vendas, clientes e pontos
- Autenticação de usuários
- Controle de acesso por perfil
- Estrutura para múltiplas lojas

## Tecnologias

### Back-end

- Ruby 4.0
- Ruby on Rails 8.1
- PostgreSQL
- JWT
- BCrypt

### Front-end

- React
- Vite
- Axios
- Tailwind CSS
- Recharts
- React Router
- Lucide React

## Arquitetura

```text
React + Vite
      │
      │ HTTP / REST API
      ▼
Ruby on Rails
      │
      ▼
PostgreSQL


## Instalação

### Backend

```bash
cd backend
bundle install
rails db:create
rails db:migrate
rails db:seed


cd frontend
npm install
npm run dev