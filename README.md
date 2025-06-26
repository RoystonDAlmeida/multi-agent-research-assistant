# Multi-Agent Researcher

[![Python](https://img.shields.io/badge/Python-3.10+-blue?logo=python)](https://www.python.org/) 
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-green?logo=fastapi)](https://fastapi.tiangolo.com/) 
[![LangGraph](https://img.shields.io/badge/AI-LangGraph-purple?logo=python)](https://github.com/langchain-ai/langgraph) 
[![Supabase](https://img.shields.io/badge/Auth/DB-Supabase-3ecf8e?logo=supabase)](https://supabase.com/) 
[![Gemini](https://img.shields.io/badge/AI-Gemini-4285F4?logo=google)](https://ai.google.dev/) 
[![React](https://img.shields.io/badge/Frontend-React-61dafb?logo=react)](https://react.dev/) 
[![Vite](https://img.shields.io/badge/Bundler-Vite-646cff?logo=vite)](https://vitejs.dev/) 
[![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 🚀 Overview

**Multi-Agent Researcher** is a full-stack, AI-powered research assistant platform. It automates the process of researching, synthesizing, and reporting on complex topics using a pipeline of specialized AI agents. The system features real-time progress tracking, authentication, and a modern, user-friendly interface.

---

## Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture & Workflow](#-architecture--workflow)
  - [How it Works](#how-it-works)
  - [Agent Pipeline](#agent-pipeline)
- [Tech Stack Explained](#-tech-stack-explained)
- [Setup (Local Development)](#setup-local-development)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [API Endpoints](#-api-endpoints)
  - [`GET /api/health`](#get-apihealth)
  - [`POST /api/research-agent`](#post-apiresearch-agent)
- [User Experience Flow](#-user-experience-flow)
- [Deployment](#-deployment)
- [Contributing](#contributing)
- [License](#-license)

---

## ✨ Features

- **Automated Multi-Agent Research:** Submit a topic and let a pipeline of AI agents handle web search, outlining, research, review, synthesis, and publishing.
- **Real-Time Progress Tracking:** See each agent's status and progress live as your research is processed.
- **Authentication & User History:** Secure login, personalized settings, and a dashboard of all your past research queries and results.
- **Rich Results & Export:** Download research reports, view sources and perspectives, and export or share results in multiple formats.
- **Modern, Responsive UI:** Beautiful, accessible interface that works on desktop and mobile.
- **Customizable Workflow:** Easily add, remove, or modify agents and research steps.
- **Supabase Integration:** Real-time database and authentication for seamless user experience.
- **Gemini AI & LangGraph:** Advanced content generation and multi-agent orchestration.

---

## 🧩 Architecture & Workflow


### How it Works
- **User** interacts with the web UI to submit research queries and view results.
- **Frontend** authenticates users, submits queries, and displays real-time progress/results.
- **Supabase** manages user accounts, stores research data, and streams updates to the UI.
- **Backend** receives research requests, authenticates via Supabase JWT, and launches a multi-agent workflow.
- **LangGraph Agents** (in the backend) perform research, synthesis, review, and reporting, updating progress in the database.

### Agent Pipeline
Each agent is a specialized AI module:
- **Browser Agent**: Performs initial web research and gathers sources.
- **Editor Agent**: Creates a structured outline for the research topic.
- **Researcher Agent**: Conducts in-depth research and drafts content for each section.
- **Reviewer Agent**: Fact-checks and revises the draft for accuracy and clarity.
- **Writer Agent**: Synthesizes the final report in the requested format.
- **Publisher Agent**: Saves the results and updates the query status.

---

## 🛠️ Tech Stack Explained

- **Backend:**
  - **FastAPI**: High-performance Python web framework for building APIs.
  - **LangGraph**: Orchestrates a pipeline of AI agents, each handling a stage of the research process.
  - **Supabase**: Provides authentication, real-time database, and secure data storage.
  - **Gemini AI**: Used for advanced content generation and analysis.
- **Frontend:**
  - **React + Vite**: Fast, modern UI with instant feedback and hot reloading.
  - **Supabase JS**: Handles authentication and real-time data updates in the browser.
  - **Tailwind CSS & shadcn/ui**: For a beautiful, responsive, and accessible design.

---

## Setup (Local Development)

### Backend
1. **Create and activate a Python virtual environment (recommended):**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows use: .venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   - Create a file named `.env` in the `backend` directory (if it doesn't exist) and add the following:

     ```env
     SUPABASE_URL=<your-supabase-url>
     SUPABASE_ANON_KEY=<your-supabase-anon-key>
     GEMINI_API_KEY=<your-gemini-api-key>
     FRONTEND_URL=<your-local-frontend-url>
     PORT=8000
     ```

   - Replace the placeholders with your actual values.

4. **Run the backend server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Configure environment variables:**
   - Create a file named `.env` in the root directory (if it doesn't exist) and add the following:

     ```env
     VITE_SUPABASE_URL=<your-supabase-url>
     VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
     VITE_BACKEND_URL=http://localhost:8000
     ```

   - Replace the placeholders with your actual values.
   
3. **Run the frontend dev server:**
   ```bash
   npm run dev
   ```

---

## 📄 API Endpoints

- `GET /api/health` — Health check (returns status of backend)
- `POST /api/research-agent` — Start a research workflow (requires JWT)
  - Body: 
  ```json
  { "queryId": "uuid-of-research-query" }
  ```

All endpoints are documented and protected as needed. The main workflow endpoint requires a valid Supabase JWT for user context and Row-Level Security.

---

## 🧑‍💻 User Experience Flow
1. **Sign up or log in** (Supabase authentication)
2. **Submit a research query** (topic, depth, perspectives, sources, etc.)
3. **Track progress** in real-time as each agent completes its task
4. **View results**: Download, review sources, perspectives, and provide feedback
5. **Access history**: All your past queries and results are available in your dashboard

---

## 📦 Deployment

- **Backend**: Deploy on Railway, Render, or any platform supporting FastAPI + Python. Set environment variables for Supabase, Gemini and deployed frontend URL.

- **Frontend**: Deploy on Vercel, Netlify, or any static hosting. Set environment variables for Supabase and deployed backend URL.

---

## 🤝 Contributing

We welcome contributions from the community! To contribute:

1. **Fork** this repository.
2. **Create a new branch** for your feature or bugfix.
3. **Make your changes** and commit them with clear messages.
4. **Open a Pull Request** describing your changes.

Thank you for helping improve Multi-Agent Researcher!

---

## 📚 License

This project is licensed under the [MIT](https://opensource.org/licenses/MIT) License.

---