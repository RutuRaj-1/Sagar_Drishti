import React, { useState } from "react";
import StudentSummaryCard from "./StudentSummaryCard.jsx";
import StudentAIInsights from "./StudentAIInsights.jsx";
import StudentVisuals from "./StudentVisuals.jsx";
import GuidedTourCarousel from "./GuidedTourCarousel.jsx";
import DidYouKnowBanner from "./DidYouKnowBanner.jsx";
import StudentChatbot from "./StudentChatbot.jsx";
import { GUIDED_TOUR_STOPS } from "../../data/studentData.js";

export default function StudentRightPanel({
  variable,
  date,
  depthIndex,
  depthLevels,
  surfaceStats,
  palette,
  onSelectTourStop,
}) {
  const [activeTab, setActiveTab] = useState("guide"); // "guide" | "chat" | "quiz"
  const [inTourMode, setInTourMode] = useState(false);
  const [activeStopId, setActiveStopId] = useState(null);
  const [isAudioNarrating, setIsAudioNarrating] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("all");
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(null);

  const handleStartTour = () => {
    setInTourMode(true);
    if (GUIDED_TOUR_STOPS.length > 0 && onSelectTourStop) {
      onSelectTourStop(GUIDED_TOUR_STOPS[0]);
      setActiveStopId(GUIDED_TOUR_STOPS[0].id);
    }
  };

  const handleJumpToStop = (stopId) => {
    setInTourMode(true);
    const stop = GUIDED_TOUR_STOPS.find((s) => s.id === stopId) || GUIDED_TOUR_STOPS[0];
    if (onSelectTourStop) {
      onSelectTourStop(stop);
      setActiveStopId(stop.id);
    }
  };

  const handleExitTour = () => {
    setInTourMode(false);
    setActiveStopId(null);
  };

  const topicChips = [
    { id: "all", label: "🌊 All Topics" },
    { id: "monsoon", label: "🌧️ Monsoons" },
    { id: "cyclone", label: "🌀 Cyclones" },
    { id: "corals", label: "🪸 Coral Health" },
    { id: "climate", label: "🌡️ Climate Change" },
  ];

  return (
    <aside className="student-right-panel">
      {/* Top Section Header & Tab Switcher */}
      <div className="student-panel-top">
        <div className="student-panel-banner">
          <div className="banner-badge-group">
            <span className="banner-badge">🎓 Student / Explorer Mode</span>
            <button
              className={`narrator-toggle-btn ${isAudioNarrating ? "active" : ""}`}
              onClick={() => setIsAudioNarrating(!isAudioNarrating)}
              title="Toggle AI Audio Narrator"
            >
              {isAudioNarrating ? "🔊 Narrator: PLAYING" : "🔇 Voice Narrator"}
            </button>
          </div>
          <h2>Understanding India's Oceans</h2>
          <p>Interactive story-driven ocean literacy workspace</p>
        </div>

        {/* Topic Quick Chips */}
        <div className="student-topic-chips">
          {topicChips.map((chip) => (
            <button
              key={chip.id}
              className={`topic-chip ${selectedTopic === chip.id ? "active" : ""}`}
              onClick={() => setSelectedTopic(chip.id)}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div className="student-tab-switcher">
          <button
            className={`student-tab-btn ${activeTab === "guide" ? "active" : ""}`}
            onClick={() => setActiveTab("guide")}
          >
            📖 Explorer Guide
          </button>
          <button
            className={`student-tab-btn ${activeTab === "quiz" ? "active" : ""}`}
            onClick={() => setActiveTab("quiz")}
          >
            🧩 Ocean Quiz
          </button>
          <button
            className={`student-tab-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            🤖 Ask AI
          </button>
        </div>
      </div>

      <div className="student-panel-content">
        {activeTab === "guide" && (
          <>
            {/* Audio Wave Visualizer Banner when narrator active */}
            {isAudioNarrating && (
              <div className="audio-narrator-banner">
                <div className="sound-wave">
                  <span className="bar b1"></span>
                  <span className="bar b2"></span>
                  <span className="bar b3"></span>
                  <span className="bar b4"></span>
                  <span className="bar b5"></span>
                </div>
                <div className="narrator-text">
                  <strong>🎙️ AI Audio Narrator</strong>
                  <small>Speaking: "Sea Surface Temperature governs monsoon moisture transfer..."</small>
                </div>
              </div>
            )}

            {/* Guided Tour Trigger or Active Guided Tour Carousel */}
            {!inTourMode ? (
              <div className="student-card start-tour-prompt-card">
                <div className="tour-prompt-header">
                  <span className="tour-prompt-icon">🗺️</span>
                  <div>
                    <h3>Take the Guided Ocean Tour</h3>
                    <p>6 curated story stops with 3D views & voice narration</p>
                  </div>
                </div>
                <button className="start-tour-btn" onClick={handleStartTour}>
                  ▶ Start Guided Tour (6 Stops)
                </button>
              </div>
            ) : (
              <GuidedTourCarousel
                onSelectStop={(stop) => {
                  setActiveStopId(stop.id);
                  if (onSelectTourStop) onSelectTourStop(stop);
                }}
                onExitTour={handleExitTour}
                activeStopId={activeStopId}
              />
            )}

            {/* Rotating Fact Banner */}
            <DidYouKnowBanner onJumpToStop={handleJumpToStop} />

            {/* 5.1 Simple Summary Card */}
            <StudentSummaryCard
              variable={variable}
              date={date}
              depthIndex={depthIndex}
              depthLevels={depthLevels}
              surfaceStats={surfaceStats}
            />

            {/* 5.2 AI-Generated Insights */}
            <StudentAIInsights
              variable={variable}
              date={date}
              depthIndex={depthIndex}
              depthLevels={depthLevels}
              surfaceStats={surfaceStats}
            />

            {/* 5.3 Student Visuals (Depth gradient, Compare places, Health badge) */}
            <StudentVisuals
              variable={variable}
              palette={palette}
              surfaceStats={surfaceStats}
              depthIndex={depthIndex}
              depthLevels={depthLevels}
            />
          </>
        )}

        {activeTab === "quiz" && (
          <div className="student-card ocean-quiz-card">
            <div className="student-card-header">
              <div className="student-card-icon">🧩</div>
              <div className="student-card-title-group">
                <span className="student-badge">Knowledge Check</span>
                <h3 className="student-card-title">Ocean Literacy Challenge</h3>
              </div>
            </div>

            <div className="quiz-question-box">
              <span className="quiz-q-num">Question 1 of 3</span>
              <h4>Why is the Bay of Bengal fresher (less salty) than the Arabian Sea?</h4>
              
              <div className="quiz-options-list">
                <button
                  className={`quiz-opt-btn ${quizAnswered === 'A' ? 'incorrect' : ''}`}
                  onClick={() => setQuizAnswered('A')}
                >
                  A) The Bay of Bengal gets no sunlight
                </button>
                <button
                  className={`quiz-opt-btn ${quizAnswered === 'B' ? 'correct' : ''}`}
                  onClick={() => { setQuizAnswered('B'); setQuizScore(1); }}
                >
                  B) Massive river runoff from Ganges, Brahmaputra & Mahanadi
                </button>
                <button
                  className={`quiz-opt-btn ${quizAnswered === 'C' ? 'incorrect' : ''}`}
                  onClick={() => setQuizAnswered('C')}
                >
                  C) It is connected to freezing Arctic ocean currents
                </button>
              </div>

              {quizAnswered && (
                <div className={`quiz-feedback-box ${quizAnswered === 'B' ? 'success' : 'alert'}`}>
                  {quizAnswered === 'B' ? (
                    <p>🎉 <strong>Correct!</strong> The Ganges-Brahmaputra basin discharges over 1,000 km³ of freshwater annually, creating a low-salinity surface layer!</p>
                  ) : (
                    <p>❌ <strong>Not quite.</strong> The main reason is river runoff from major river systems into the Bay of Bengal!</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <StudentChatbot variable={variable} date={date} />
        )}
      </div>

      {/* Educational Safety Disclaimer Footer */}
      <footer className="student-panel-footer">
        <p>
          <strong>SAGAR-DRISHTI Explorer</strong> is an educational visualization platform.
          It does not replace official marine, cyclone, or fishing advisories. Consult INCOIS and IMD for operational safety decisions.
        </p>
      </footer>
    </aside>
  );
}
