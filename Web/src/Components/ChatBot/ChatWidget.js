/**
 * ChatWidget Component
 * Main chatbot widget component with full functionality
 */

import React, { useState, useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import { sendMessageToRasa, extractTextMessages } from "./rasaService";
import "./ChatWidget.css";

const ChatWidget = () => {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Show welcome message on first open
  useEffect(() => {
    if (isOpen && !hasShownWelcome && messages.length === 0) {
      addBotMessage("Hello! How can I help you today?");
      setHasShownWelcome(true);
    }
  }, [isOpen, hasShownWelcome, messages]);

  /**
   * Add bot message to chat
   */
  const addBotMessage = (text) => {
    const newMessage = {
      id: Date.now(),
      text,
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  /**
   * Add user message to chat
   */
  const addUserMessage = (text) => {
    const newMessage = {
      id: Date.now(),
      text,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  /**
   * Handle sending message to Rasa
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    // Validation
    if (!inputValue.trim()) {
      return;
    }

    if (isLoading || isTyping) {
      return;
    }

    const userMessage = inputValue.trim();

    // Add user message to chat
    addUserMessage(userMessage);
    setInputValue("");
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Send message to Rasa
      const response = await sendMessageToRasa(userMessage);

      // Extract text messages
      const textMessages = extractTextMessages(response);

      // If no messages returned, show error
      if (textMessages.length === 0) {
        addBotMessage("Sorry, I am unable to connect right now.");
      } else {
        // Add each bot message separately
        textMessages.forEach((message) => {
          addBotMessage(message);
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      addBotMessage("Sorry, I am unable to connect right now.");
    } finally {
      setIsTyping(false);
      setIsLoading(false);
      // Focus back to input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  /**
   * Handle Enter key press
   */
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !isTyping) {
        handleSendMessage(e);
      }
    }
  };

  /**
   * Toggle chat window
   */
  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Close chat window
   */
  const closeChat = () => {
    setIsOpen(false);
  };

  return (
    <div className="chatbot-widget">
      {/* Chat Button */}
      <button
        className="chat-button"
        onClick={toggleChat}
        aria-label={isOpen ? "Close chat" : "Open chat"}
        title={isOpen ? "Close chat" : "Open chat"}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="header-content">
              <div className="bot-avatar">AI</div>
              <div className="bot-info">
                <h3 className="bot-title">AI Assistant</h3>
                <span className="online-status">Online</span>
              </div>
            </div>
            <div className="header-actions">
              <button
                className="header-button minimize-button"
                onClick={toggleChat}
                aria-label="Minimize chat"
                title="Minimize chat"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <button
                className="header-button close-button"
                onClick={closeChat}
                aria-label="Close chat"
                title="Close chat"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="chat-messages">
            {messages.length === 0 ? (
              <div className="empty-state">
                <p>Start a conversation</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg.text}
                  sender={msg.sender}
                  timestamp={msg.timestamp}
                />
              ))
            )}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="message-container bot-message">
                <TypingIndicator />
              </div>
            )}

            {/* Scroll target */}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <input
              ref={inputRef}
              type="text"
              className="chat-input"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading || isTyping}
              autoFocus
            />
            <button
              type="submit"
              className="send-button"
              disabled={isLoading || isTyping || !inputValue.trim()}
              aria-label="Send message"
              title="Send message"
            >
              {isLoading ? (
                <span className="spinner"></span>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
