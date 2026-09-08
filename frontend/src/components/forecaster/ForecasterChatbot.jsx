import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { AITechnicalChatbotService } from "../../services/forecasterAdapter.js";

const TECH_SUGGESTED_PROMPTS = [
  "What is the overall model skill and RMSE?",
  "Why is there a discrepancy near the east coast?",
  "How is the Marine Heatwave anomaly computed?",
  "How is surface drift velocity derived?",
  "How are Argo float observations assimilated?",
];

export default function ForecasterChatbot({ variable, date, depthIndex, depthLevels, surfaceStats }) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `SAGAR-DRISHTI Technical Decision Support AI initialized. Ask any oceanographic query regarding CMEMS model skill, Argo co-location bias, thermocline dynamics, or geostrophic equilibrium.`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      model: "system",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeModel, setActiveModel] = useState(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Add user message
    const userMsg = { sender: "user", text: query, time: timeStr };
    const currentHistory = [...messages];
    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput("");
    setIsTyping(true);

    try {
      const response = await AITechnicalChatbotService.respond(
        query,
        {
          variableName: variable,
          date: date,
          depthIndex,
          depthLevels,
          surfaceStats,
        },
        currentHistory
      );

      setActiveModel(response.model);

      const aiMsg = {
        sender: "ai",
        text: response.text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: response.model,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "I encountered a communication error with the technical API. Please try again or check the backend.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          model: "error",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        sender: "ai",
        text: `Technical chat history cleared. Ready for forecast analysis queries.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: "system",
      },
    ]);
    setActiveModel(null);
  };

  return (
    <div className="forecaster-card forecaster-chatbot-card">
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-avatar">🤖</span>
          <div>
            <h3>Ask About This Forecast / Data</h3>
            <small>
              {activeModel && activeModel !== "system" && activeModel !== "error" 
                ? `⚡ Powered by Groq AI (${activeModel})` 
                : "Technical Decision-Support AI Assistant"}
            </small>
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
            disabled={isTyping}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="chat-messages-container tech-chat-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.sender}`}>
            <div className="bubble-content tech-content">
              {msg.sender === "ai" ? (
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              ) : (
                msg.text
              )}
            </div>
            <span className="bubble-time">{msg.time}</span>
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble ai typing">
            <div className="bubble-content tech-content" style={{ fontSize: '0.85em', fontStyle: 'italic', color: '#8b9bb4' }}>
              ⚡ Groq AI is analyzing...
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
          disabled={isTyping}
        />
        <button type="submit" disabled={!input.trim() || isTyping}>
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
