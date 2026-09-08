import React, { useState, useRef, useEffect } from "react";
import { AITechnicalChatbotService } from "../../services/forecasterAdapter.js";

const TECH_SUGGESTED_PROMPTS = [
  "What is the overall model skill and RMSE?",
  "Why is there a discrepancy near the east coast?",
  "How is the Marine Heatwave anomaly computed?",
  "How is surface drift velocity derived?",
  "How are Argo float observations assimilated?",
];

export default function ForecasterChatbot({ variable, date }) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `SAGAR-DRISHTI Technical Decision Support AI initialized. Ask any oceanographic query regarding CMEMS model skill, Argo co-location bias, thermocline dynamics, or geostrophic equilibrium.`,
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
      const responseText = AITechnicalChatbotService.respond(query, {
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
    }, 500);
  };

  const handleClear = () => {
    setMessages([
      {
        sender: "ai",
        text: `Technical chat history cleared. Ready for forecast analysis queries.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="forecaster-card forecaster-chatbot-card">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-avatar">🤖</span>
          <div>
            <h3>Ask About This Forecast / Data</h3>
            <small>Technical Decision-Support AI Assistant</small>
          </div>
        </div>
        <button className="clear-chat-btn" onClick={handleClear} title="Clear conversation">
          🗑️ Clear
        </button>
      </div>

      {/* Suggested Prompt Pills */}
      <div className="suggested-pills-row">
        {TECH_SUGGESTED_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            className="suggested-pill tech-pill"
            onClick={() => handleSend(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="chat-messages-container tech-chat-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.sender}`}>
            <div className="bubble-content tech-content">{msg.text}</div>
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
          placeholder="Ask a technical question (e.g. Why is RMSE high?)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={!input.trim()}>
          Analyze -&gt;
        </button>
      </form>

      <div className="chatbot-disclaimer">
        <small>
          Note: AI assistant provides technical decision support. For official advisories, rely on INCOIS watch duty procedures.
        </small>
      </div>
    </div>
  );
}
