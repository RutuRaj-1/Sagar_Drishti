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
  const [activeTab, setActiveTab] = useState("guide"); // "guide" | "chat"
  const [inTourMode, setInTourMode] = useState(false);
  const [activeStopId, setActiveStopId] = useState(null);

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

  return (
    <aside className="student-right-panel">
      {/* Top Section Header & Tab Switcher */}
      <div className="student-panel-top">
        <div className="student-panel-banner">
          <div className="banner-badge">🎓 Student / Explorer Mode</div>
          <h2>Understanding India's Oceans</h2>
          <p>Interactive story-driven ocean literacy workspace</p>
        </div>

        <div className="student-tab-switcher">
          <button
            className={`student-tab-btn ${activeTab === "guide" ? "active" : ""}`}
            onClick={() => setActiveTab("guide")}
          >
            📖 Explorer Guide
          </button>
          <button
            className={`student-tab-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            🤖 Ask AI Assistant
          </button>
        </div>
      </div>

      <div className="student-panel-content">
        {activeTab === "guide" && (
          <>
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
