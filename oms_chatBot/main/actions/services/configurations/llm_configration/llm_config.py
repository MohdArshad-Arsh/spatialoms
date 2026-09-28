import os

from langchain_ollama import ChatOllama


OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/")   #http://localhost:11434/    #http://192.168.1.65:11434

sql_llm = ChatOllama(
    model="deepseek-coder:6.7b",  # qwen2.5-coder:3b     
    base_url=OLLAMA_BASE_URL,
    temperature=0,
    num_predict=120,
    num_ctx=2048,
    keep_alive="30m"
)

exp_llm = ChatOllama(
    model="llama3:8b",  #qwen2.5:3b 
    base_url=OLLAMA_BASE_URL,
    temperature=0,
    num_predict=120,
    num_ctx=2048,
    keep_alive="30m"
)

rag_llm = ChatOllama(
    model="qwen2.5:7b-instruct-q4_K_M",
    base_url=OLLAMA_BASE_URL,
    temperature=0.3
)
