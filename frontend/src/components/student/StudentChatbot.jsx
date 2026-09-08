import React, { useState, useRef, useEffect } from "react";
import { AIChatbotService } from "../../services/studentAdapter.js";

const DEFAULT_SUGGESTED_PROMPTS = [
  "What is a marine heatwave?",
  "Why is the Bay of Bengal less salty?",
  "What do Argo floats do?",
  "What is the thermocline?",
  "How does ocean temperature affect monsoons?",
];

// Contextual prompt suggestions based on active variable
const VARIABLE_PROMPTS = {
  tob: [
    "Why are temperatures in the Bay of Bengal so high?",
    "What is the thermocline layer?",
    "How does warm sea temperature fuel monsoons?",
    "What triggers a marine heatwave?",
  ],
  sob: [
    "Why is the Bay of Bengal less salty than the Arabian Sea?",
    "How do river plumes create a barrier layer?",
    "Does salty water sink or float?",
    "What salinity do Argo floats measure?",
  ],
  sivelo: [
    "Why do currents reverse direction with the monsoons?",
    "What drives surface drift velocity in the Indian Ocean?",
    "How fast do monsoon currents move?",
    "How do currents transport marine nutrients?",
  ],
  zos: [
    "What causes sea surface height to rise and fall?",
    "How do ocean eddies appear in sea surface height?",
    "How does thermal expansion affect sea level?",
    "Can sea surface height anomalies predict cyclones?",
  ],
  temperature: [
    "How cold does the ocean get below 200 meters?",
    "What is the mixed layer depth?",
    "Why does sunlight only penetrate the top layer?",
    "How do underwater gliders measure 3D temperature?",
  ],
};

/**
 * Lightweight helper to format markdown-like text (bold, bullet points, headers) safely.
 */
function FormattedMessage({ text }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      elements.push(<div key={idx} className="msg-spacer" />);
      return;
    }

    // Bullet points (* or -)
    if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
      const bulletContent = trimmed.substring(2);
      elements.push(
        <div key={idx} className="msg-bullet-line">
          <span className="bullet-dot">•</span>
          <span>{renderInlineMarkdown(bulletContent)}</span>
        </div>
      );
      return;
    }

    // Headers (### or ##)
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={idx} className="msg-header-3">
          {renderInlineMarkdown(trimmed.substring(4))}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={idx} className="msg-header-2">
          {renderInlineMarkdown(trimmed.substring(3))}
        </h3>
      );
      return;
    }

    // Normal paragraph line
    elements.push(
      <p key={idx} className="msg-paragraph">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });

  return <div className="formatted-msg-container">{elements}</div>;
}

/**
 * Handles inline bold (**text**) and code (`code`) formatting.
 */
function renderInlineMarkdown(text) {
  // Regex to split on **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={i} className="msg-inline-code">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

export default function StudentChatbot({
  variable = "tob",
  date = "2026-08-31",
  depthIndex = 0,
  depthLevels = [0],
  surfaceStats = null,
}) {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: `Hello! I'm your **SAGAR-DRISHTI Educational AI Ocean Assistant**, powered by Groq high-speed AI. Ask me anything about India's oceans, temperatures, salinity, Argo robots, or the guided tour!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      model: "Groq AI",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeModelName, setActiveModelName] = useState("Groq Llama / OSS AI");
  const chatEndRef = useRef(null);

  // Dynamic prompts based on current variable
  const activePrompts = VARIABLE_PROMPTS[variable] || DEFAULT_SUGGESTED_PROMPTS;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || isTyping) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Add user message to state
    const userMsg = { sender: "user", text: query, time: timeStr };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!textToSend) setInput("");
    setIsTyping(true);

    try {
      // Asynchronously call Groq-backed AIChatbotService
      const result = await AIChatbotService.ask(
        query,
        {
          variableName: variable,
          date: date,
          depthIndex: depthIndex,
          depthLevels: depthLevels,
          surfaceStats: surfaceStats,
        },
        newHistory
      );

      if (result.model) {
        setActiveModelName(result.model.includes("gpt-oss") ? "Groq GPT-OSS-120B" : result.model);
      }

      const aiMsg = {
        sender: "ai",
        text: result.text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: result.model || "Groq AI",
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Chatbot query error:", err);
      const errorMsg = {
        sender: "ai",
        text: "I encountered a momentary issue contacting the Groq AI service. Please try asking again!",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        sender: "ai",
        text: `Chat cleared! Ready for your ocean science questions!`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        model: "Groq AI",
      },
    ]);
  };

  return (
    <div className="student-card student-chatbot-card">
      {/* Chatbot Header with Groq AI Badge */}
      <div className="chatbot-header">
        <div className="chatbot-title">
          <span className="chatbot-avatar">🤖</span>
          <div>
            <div className="chatbot-badge-row">
              <h3>Ask About This Ocean View</h3>
              <span className="groq-ai-badge" title={`Active model: ${activeModelName}`}>
                ⚡ Powered by Groq AI
              </span>
            </div>
            <small>Educational AI Ocean Assistant • SAGAR-DRISHTI</small>
          </div>
        </div>
        <button className="clear-chat-btn" onClick={handleClear} title="Clear conversation">
          🗑️ Clear
        </button>
      </div>

      {/* Dynamic Suggested Quick Question Pills */}
      <div className="suggested-pills-row">
        {activePrompts.slice(0, 4).map((prompt, idx) => (
          <button
            key={idx}
            className="suggested-pill"
            onClick={() => handleSend(prompt)}
            disabled={isTyping}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Message History */}
      <div className="chat-messages-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble ${msg.sender}`}>
            <div className="bubble-content">
              {msg.sender === "ai" ? (
                <FormattedMessage text={msg.text} />
              ) : (
                msg.text
              )}
            </div>
            <div className="bubble-footer">
              {msg.sender === "ai" && msg.model && (
                <span className="bubble-model-tag">
                  ⚡ {msg.model.replace("openai/", "")}
                </span>
              )}
              <span className="bubble-time">{msg.time}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble ai typing">
            <div className="typing-header">
              <span className="typing-bot-name">⚡ Groq AI is thinking...</span>
            </div>
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
          placeholder="Ask anything (e.g. Why is Bay of Bengal less salty?)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isTyping}
        />
        <button type="submit" disabled={!input.trim() || isTyping}>
          {isTyping ? "Thinking..." : "Send ->"}
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
