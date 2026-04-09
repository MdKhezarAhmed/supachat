# SupaChat — Conversational Blog Analytics

AI-powered analytics chatbot built on Supabase PostgreSQL.

## Architecture
- **Frontend**: Next.js + Recharts
- **Backend**: FastAPI + Groq AI
- **Database**: Supabase PostgreSQL
- **Infra**: Docker + Nginx + AWS EC2
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana + Loki

## Local Setup

### Prerequisites
- Docker Desktop
- Node.js 20+
- Python 3.11+

### Run Locally
```bash
git clone https://github.com/MdKhezarAhmed/supachat.git
cd supachat

# Add your keys
cp backend/.env.example backend/.env
# Edit backend/.env with your keys

# Start everything
docker-compose up --build
```

App runs at http://localhost

## Environment Variables
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
GROQ_API_KEY=your_groq_api_key_here

## Deployment
Push to `main` branch → GitHub Actions auto deploys to EC2.

## Monitoring
- Grafana: http://your-ip:3001
- Prometheus: http://your-ip:9090

## AI Tools Used
- Claude (architecture + code generation)
- Groq LLaMA 3.3 (natural language to SQL)