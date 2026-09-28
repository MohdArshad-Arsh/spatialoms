import React from "react";
import "./ChatWidget.css";

const TypingIndicator = () => {
  return (
    <div className="typing-indicator">
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
      <span className="typing-dot"></span>
    </div>
  );
};

export default TypingIndicator;
