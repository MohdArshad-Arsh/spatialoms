import streamlit as st
import requests

st.set_page_config(
    page_title="NL to SQL Platform",
    layout="wide"
)

# -----------------------------
# Session State
# -----------------------------
if "chat_open" not in st.session_state:
    st.session_state.chat_open = False

if "messages" not in st.session_state:
    st.session_state.messages = []

# -----------------------------
# Main Page
# -----------------------------
st.title("🚀 NL to SQL Analytics Platform")

st.write("""
Welcome to the NL to SQL Analytics Platform.

This is your main application page.

Features:
- Natural Language Queries
- Intent Detection
- Entity Extraction
- SQL Generation
- Database Analytics
""")

st.divider()

col1, col2, col3 = st.columns(3)

with col1:
    st.metric("Users", "1,250")

with col2:
    st.metric("Orders", "8,943")

with col3:
    st.metric("Revenue", "$48,200")

# -----------------------------
# Floating Button CSS
# -----------------------------
st.markdown("""
<style>

.chat-button {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
}

.chat-window {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 380px;
    height: 600px;
    background-color: white;
    border-radius: 15px;
    border: 1px solid #ddd;
    padding: 15px;
    overflow-y: auto;
    z-index: 9999;
    box-shadow: 0px 0px 20px rgba(0,0,0,0.2);
}

</style>
""", unsafe_allow_html=True)

# -----------------------------
# Floating Chat Button
# -----------------------------
floating_col1, floating_col2 = st.columns([10,1])

with floating_col2:
    if st.button("🤖", key="bot_button"):
        st.session_state.chat_open = not st.session_state.chat_open

# -----------------------------
# Chat Window
# -----------------------------
if st.session_state.chat_open:

    with st.container(border=True):

        c1, c2 = st.columns([8,1])

        with c1:
            st.subheader("🤖 SQL Assistant")

        with c2:
            if st.button("✖"):
                st.session_state.chat_open = False
                st.rerun()

        st.divider()

        for msg in st.session_state.messages:

            role = msg["role"]

            with st.chat_message(role):
                st.write(msg["content"])

        user_input = st.chat_input("Ask a database question...")

        if user_input:

            st.session_state.messages.append({
                "role": "user",
                "content": user_input
            })

            try:

                response = requests.post(
                    "http://localhost:5005/webhooks/rest/webhook",
                    json={
                        "sender": "user",
                        "message": user_input
                    }
                )

                result = response.json()

                bot_reply = "\n".join(
                    [r["text"] for r in result]
                )

            except Exception:

                bot_reply = "Unable to connect to Rasa."

            st.session_state.messages.append({
                "role": "assistant",
                "content": bot_reply
            })

            st.rerun()
