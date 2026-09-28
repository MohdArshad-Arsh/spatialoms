import React from "react";
import "./ChatWidget.css";

const MessageBubble = ({ message, sender, timestamp }) => {
  const isUser = sender === "user";
  const formatTime = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className={`message-container ${isUser ? "user-message" : "bot-message"}`}>
      <div className="message-bubble">
        <p className="message-text">{message}</p>
        <span className="message-timestamp">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
};

export default MessageBubble;
