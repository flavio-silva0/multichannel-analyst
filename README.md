# Analista de Sentimento de Múltiplos Canais (NLP + APIs)

Este projeto é um painel completo para análise de sentimentos multicanal (ex: Instagram, etc) utilizando Processamento de Linguagem Natural (NLP) e APIs externas.

Ele é dividido em um Backend construído em Node.js/Express e um Frontend moderno criado com React e Vite.

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js & Express**: Servidor e API Rest.
- **Google Generative AI (Gemini)**: Utilizado para a análise de sentimentos e processamento de linguagem natural (NLP).
- **Supabase**: Banco de dados e autenticação / persistência de dados.
- **Apify Client**: Para automação e extração de dados de redes sociais (Web Scraping).
- **TypeScript**: Tipagem estática para JavaScript.

### Frontend
- **React 19**: Biblioteca para criação de interfaces de usuário.
- **Vite**: Ferramenta de build de front-end extremamente rápida.
- **Tailwind CSS v4**: Framework CSS utilitário para estilização rápida e responsiva.
- **TypeScript**: Tipagem estática e maior segurança no código.

## ⚙️ Como executar o projeto localmente

### 1. Pré-requisitos
- Ter o **Node.js** instalado na sua máquina.
- Ter as chaves de API necessárias configuradas em um arquivo `.env` na raiz do projeto (como chaves do Google Gemini, Supabase, Apify, etc).

### 2. Rodando o Backend

Abra um terminal na pasta raiz do projeto e instale as dependências caso ainda não tenha feito:
```bash
npm install
```

Inicie o servidor backend (rodará na porta 3001 por padrão):
```bash
npm start
```

### 3. Rodando o Frontend

Abra outro terminal, acesse a pasta `frontend` e instale as dependências:
```bash
cd frontend
npm install
```

Inicie o servidor de desenvolvimento do frontend (rodará na porta 5173 por padrão):
```bash
npm run dev
```

Acesse `http://localhost:5173` no seu navegador para ver a aplicação funcionando.

## 📝 Licença
Desenvolvido como projeto pessoal/estudo de integração de IA, Scraping e Dashboards.
