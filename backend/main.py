from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from groq import Groq
from prometheus_fastapi_instrumentator import Instrumentator
import os
import json
from dotenv import load_dotenv
from agent import router as agent_router
load_dotenv()

app = FastAPI(title="SupaChat API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)
app.include_router(agent_router)

# Clients
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# Request model
class QueryRequest(BaseModel):
    question: str
    history: list = []

# Format AI summary
def format_response(question: str, data: list) -> str:
    if not data:
        return "No results found for your query."

    prompt = f"""
User asked: {question}
Data: {json.dumps(data[:10])}
Write a short 2-3 sentence summary of this data. Be clear and helpful.
"""
    response = groq_client.chat.completions.create(
       model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    return response.choices[0].message.content

# Detect chart type
def detect_chart_type(question: str) -> str:
    q = question.lower()
    if any(w in q for w in ["trend", "over time", "daily", "weekly"]):
        return "line"
    if any(w in q for w in ["compare", "top", "ranking", "most"]):
        return "bar"
    if any(w in q for w in ["distribution", "breakdown", "percentage"]):
        return "pie"
    return "bar"

# Health check
@app.get("/health")
def health():
    return {"status": "ok", "service": "supachat-backend"}

# Main chat endpoint
@app.post("/api/query")
async def query(req: QueryRequest):
    try:
        q = req.question.lower()
        data = []
        
        # Handle greetings
        greetings = ["hi", "hello", "hey", "sup", "what's up", "howdy"]
        if any(q == g for g in greetings):
            return {
                "response": "Hey! 👋 I'm SupaChat. Ask me anything about the blog analytics. Try: 'Show top trending topics' or 'Compare article engagement by topic'",
                "data": [],
                "chart_type": "table"
            }
        
        if "trending" in q or "topic" in q:
            result = supabase.table("article_engagement")\
                .select("*, articles(title, topic)")\
                .order("likes", desc=True)\
                .limit(10)\
                .execute()
            data = result.data

        elif "engagement" in q or "compare" in q or "likes" in q:
            result = supabase.table("article_engagement")\
                .select("likes, comments, shares, articles(title, topic)")\
                .order("likes", desc=True)\
                .limit(10)\
                .execute()
            data = result.data

        elif "views" in q or "trend" in q or "daily" in q:
            result = supabase.table("article_views")\
                .select("viewed_at, articles(title, topic)")\
                .order("viewed_at", desc=True)\
                .limit(100)\
                .execute()
            data = result.data

        elif "author" in q or "who" in q:
            result = supabase.table("articles")\
                .select("title, topic, author")\
                .execute()
            data = result.data

        else:
            result = supabase.table("articles")\
                .select("*, article_engagement(*)")\
                .execute()
            data = result.data

        response_text = format_response(req.question, data)
        chart_type = detect_chart_type(req.question)

        return {
            "response": response_text,
            "data": data,
            "chart_type": chart_type
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))