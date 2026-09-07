import React, { useState, useRef, useEffect } from "react";
import { AIChatbotService } from "../../services/studentAdapter.js";

const SUGGESTED_PROMPTS = [
  "What is a marine heatwave?",
  "Why is the Bay of Bengal less salty?",
  "What do Argo floats do?",
  "What is the thermocline?",
  "How does ocean temperature affect monsoons?",
];

export default function StudentChatbot({ variable, date }) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `Hello! I'm your SAGAR-DRISHTI AI Ocean Assistant. Ask me anything about India's oceans, temperatures, currents, or Argo floats!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Add user message
    const userMsg = { sender: "user", text: query, time: timeStr };
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    // Simulate AI response delay
    setTimeout(() => {
      const responseText = AIChatbotService.respond(query, {
        variableName: variable,
        date: date,
      });

      const aiMsg = {
        sender: "ai",
        text: responseText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  const handleClear = () => {
    setMessages([
      {
        sender: "ai",
        text: `Chat cleared! Ask me anything about India's oceans!`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="student-card student-chatbot-card">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-avatar">[AI]</span>
          <div>
            <h3>Ask About This Ocean View</h3>
            <small>Educational AI Ocean Assistant</small>
          </div>
        </div>
        <button className="clear-chat-btn" onClick={handleClear} title="Clear conversation">
          Clear
        </button>
      </div>

      {/* Suggested Quick Question Pills */}
      <div className="suggested-pills-row">
        {SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            className="suggested-pill"
            onClick={() => handleSend(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="chat-messages-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.sender}`}>
            <div className="bubble-content">{msg.text}</div>
            <span className="bubble-time">{msg.time}</span>
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble ai typing">
            <div className="typing-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <form
        className="chat-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <input
          type="text"
          placeholder="Ask a question (e.g., What is thermocline?)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={!input.trim()}>
          Send -&gt;
        </button>
      </form>

      <div className="chatbot-disclaimer">
        <small>
          Note: AI assistant provides educational explanations. For official cyclone or marine advisories, consult INCOIS and IMD.
        </small>
      </div>
    </div>
  );
}
