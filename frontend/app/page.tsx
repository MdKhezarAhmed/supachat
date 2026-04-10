"use client";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

interface Message {
  role: "user" | "assistant";
  content: string;
  data?: any[];
  chart_type?: string;
}

const COLORS = ["#6366f1","#22d3ee","#f59e0b","#10b981","#f43f5e","#a78bfa"];

function DataChart({ data, chartType }: { data: any[]; chartType: string }) {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]).filter(k => k !== "id");
  const numericKey = keys.find(k => typeof data[0][k] === "number") || keys[1];
  const labelKey = keys[0];

  if (chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey={labelKey} tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151" }} />
          <Line type="monotone" dataKey={numericKey} stroke="#6366f1" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === "pie") {
    return (
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={data} dataKey={numericKey} nameKey={labelKey} cx="50%" cy="50%" outerRadius={80} label>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ background: "#1f2937" }} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey={labelKey} tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151" }} />
        <Bar dataKey={numericKey} fill="#6366f1" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function DataTable({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;
  const keys = Object.keys(data[0]);
  return (
    <div className="overflow-x-auto mt-3 rounded-lg border border-gray-700">
      <table className="w-full text-sm">
        <thead className="bg-gray-800">
          <tr>{keys.map(k => <th key={k} className="px-3 py-2 text-left text-gray-300 font-medium">{k}</th>)}</tr>
        </thead>
        <tbody>
          {data.slice(0, 20).map((row, i) => (
            <tr key={i} className="border-t border-gray-700 hover:bg-gray-800/50">
              {keys.map(k => <td key={k} className="px-3 py-2 text-gray-400">{String(row[k] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 20 && <p className="text-xs text-gray-500 p-2">Showing 20 of {data.length} rows</p>}
    </div>
  );
}

export default function SupaChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hey! I'm SupaChat 👋 Ask me anything about the blog analytics. Try: 'Show top trending topics' or 'Compare article engagement'" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const EXAMPLES = [
    "Show top trending topics",
    "Compare article engagement by topic",
    "Who are the authors?",
    "Which articles have most likes?",
  ];

  async function sendMessage(text?: string) {
    const question = text || input.trim();
    if (!question || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: question };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/query`,
        { question, history: [] }
      );
      setMessages(prev => [...prev, {
        role: "assistant",
        content: res.data.response,
        data: res.data.data,
        chart_type: res.data.chart_type,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again."
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-gray-950 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex-col p-4 hidden md:flex">
        <div className="text-xl font-bold text-indigo-400 mb-2">⚡ SupaChat</div>
        <div className="text-xs text-gray-500 mb-6">Blog Analytics Assistant</div>
        <div className="text-xs text-gray-500 uppercase mb-3 font-semibold">Try these</div>
        {EXAMPLES.map((q, i) => (
          <button key={i} onClick={() => sendMessage(q)}
            className="text-left text-sm text-gray-400 hover:text-white hover:bg-gray-800 p-2 rounded-lg mb-1 transition-colors">
            {q}
          </button>
        ))}
       {messages.filter(m => m.role === "user").length > 0 && (
          <>
            <div className="mt-6 text-xs text-gray-500 uppercase mb-3 font-semibold">History</div>
            <div className="overflow-y-auto flex-1">
              {messages
                .filter(m => m.role === "user")
                .map((m, i) => (
                  <button key={i} onClick={() => sendMessage(m.content)}
                    className="text-left text-xs text-gray-500 hover:text-white hover:bg-gray-800 p-2 rounded-lg mb-1 transition-colors w-full truncate">
                    {m.content}
                  </button>
                ))}
            </div>
          </>
        )}

        <div className="mt-auto text-xs text-gray-600">Powered by Supabase + Groq</div>
      </div>

      {/* Chat */}
      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-800 p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold">S</div>
          <div>
            <div className="font-semibold">SupaChat</div>
            <div className="text-xs text-green-400">● Online</div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-2xl rounded-2xl px-4 py-3 ${
                msg.role === "user" ? "bg-indigo-600" : "bg-gray-800"
              }`}>
                <p className="text-sm leading-relaxed">{msg.content}</p>
                {msg.data && msg.data.length > 0 && (
                  <div className="mt-3">
                    <DataChart data={msg.data} chartType={msg.chart_type || "bar"} />
                    <button
                      onClick={() => setShowTable(showTable === i ? null : i)}
                      className="text-xs text-indigo-400 mt-2 hover:underline">
                      {showTable === i ? "Hide table" : `Show table (${msg.data.length} rows)`}
                    </button>
                    {showTable === i && <DataTable data={msg.data} />}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl px-4 py-3 flex gap-1">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:"0ms"}}/>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:"150ms"}}/>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay:"300ms"}}/>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-gray-800 p-4">
          <div className="flex gap-3 max-w-3xl mx-auto">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder="Ask about your blog analytics..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 py-3 rounded-xl text-sm font-medium transition-colors">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}