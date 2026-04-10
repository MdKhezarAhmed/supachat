# SupaChat — Conversational Blog Analytics

AI-powered analytics chatbot built on Supabase PostgreSQL.

## Live URL
http://3.88.68.15

## Architecture
- **Frontend**: Next.js + Recharts
- **Backend**: FastAPI + Groq AI + MCP Query Translator
- **Database**: Supabase PostgreSQL
- **Infra**: Docker + Nginx + AWS EC2
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana + Loki

## Setup

### Prerequisites
- Docker Desktop
- Node.js 20+
- Python 3.11+

### Run Locally
```bash
git clone https://github.com/MdKhezarAhmed/supachat.git
cd supachat
cp backend/.env.example backend/.env
# Edit backend/.env with your keys
docker-compose up --build
```

App runs at http://localhost

## Environment Variables
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
GROQ_API_KEY=your_groq_api_key

## Deployment
Push to `main` branch → GitHub Actions auto deploys to EC2.

## CI/CD Pipeline
1. Code pushed to main
2. GitHub Actions triggers
3. Files synced to EC2 via rsync
4. Docker containers rebuilt
5. Health check verified

## Monitoring Dashboards
- Grafana: http://3.88.68.15:3001 (admin/admin123)
- Prometheus: http://3.88.68.15:9090
- Node Exporter dashboard imported (ID: 1860)
- Backend metrics: /metrics endpoint

## API Endpoints
- POST /api/query — Natural language chat
- POST /api/mcp/translate — MCP query translator
- POST /api/agent — DevOps agent
- GET /health — Health check
- GET /metrics — Prometheus metrics

## DevOps Agent
The agent supports: health check, restart containers, view logs, check resources, deployment status.

## AI Tools Used
- Claude (architecture + code generation)
- Groq LLaMA 3.3 70B (natural language to SQL + AI summaries)