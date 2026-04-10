from fastapi import APIRouter
from pydantic import BaseModel
from groq import Groq
import subprocess
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class AgentRequest(BaseModel):
    command: str

def run_shell(cmd: str) -> str:
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=30
        )
        return result.stdout + result.stderr
    except Exception as e:
        return str(e)

def ask_ai(prompt: str) -> str:
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3
    )
    return response.choices[0].message.content

@router.post("/api/agent")
async def devops_agent(req: AgentRequest):
    cmd = req.command.lower()

    if "health" in cmd:
        output = run_shell("docker ps --format 'table {{.Names}}\t{{.Status}}'")
        summary = ask_ai(f"Summarize this container health status briefly:\n{output}")
        return {"action": "health_check", "output": output, "summary": summary}

    elif "restart" in cmd:
        output = run_shell("docker-compose -f /home/ubuntu/supachat/docker-compose.yml restart")
        summary = ask_ai(f"Summarize this restart result:\n{output}")
        return {"action": "restart", "output": output, "summary": summary}

    elif "log" in cmd:
        output = run_shell("docker-compose -f /home/ubuntu/supachat/docker-compose.yml logs --tail=50")
        summary = ask_ai(f"Analyze these logs and highlight any errors or issues:\n{output}")
        return {"action": "logs", "output": output[:2000], "summary": summary}

    elif "cpu" in cmd or "memory" in cmd or "resource" in cmd:
        output = run_shell("docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'")
        summary = ask_ai(f"Analyze these container resource stats:\n{output}")
        return {"action": "resources", "output": output, "summary": summary}

    elif "deploy" in cmd or "status" in cmd:
        output = run_shell("docker-compose -f /home/ubuntu/supachat/docker-compose.yml ps")
        summary = ask_ai(f"Summarize this deployment status:\n{output}")
        return {"action": "status", "output": output, "summary": summary}

    elif "ci" in cmd or "github" in cmd or "pipeline" in cmd or "failure" in cmd:
        output = run_shell("docker-compose -f /home/ubuntu/supachat/docker-compose.yml logs --tail=30 2>&1")
        summary = ask_ai(f"""Analyze these logs and explain if there are any CI/CD or deployment failures. 
Give RCA (Root Cause Analysis) and suggest fixes:\n{output}""")
        return {"action": "cicd_analysis", "output": output[:2000], "summary": summary}
    else:
        summary = ask_ai(f"User asked: '{req.command}'. Suggest what DevOps actions they can take from: health check, restart containers, view logs, check resources, check deployment status.")
        return {"action": "help", "output": "", "summary": summary}