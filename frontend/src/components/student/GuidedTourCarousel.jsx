import React, { useState, useEffect, useRef } from "react";
import { GUIDED_TOUR_STOPS } from "../../data/studentData.js";

export default function GuidedTourCarousel({
  onSelectStop,
  onExitTour,
  activeStopId,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const playTimer = useRef(null);

  const currentStop = GUIDED_TOUR_STOPS[currentIndex] || GUIDED_TOUR_STOPS[0];

  // Synchronize viewport parameters whenever current tour stop changes
  useEffect(() => {
    if (onSelectStop && currentStop) {
      onSelectStop(currentStop);
    }
  }, [currentIndex, onSelectStop]);

  // Handle Text-to-Speech narration
  useEffect(() => {
    if (!speechEnabled || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    if (currentStop?.audioText) {
      const utterance = new SpeechSynthesisUtterance(currentStop.audioText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentIndex, speechEnabled]);

  // Handle automatic slideshow playback
  useEffect(() => {
    if (!isPlaying) {
      if (playTimer.current) clearInterval(playTimer.current);
      return;
    }

    playTimer.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % GUIDED_TOUR_STOPS.length);
    }, 9000);

    return () => clearInterval(playTimer.current);
  }, [isPlaying]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % GUIDED_TOUR_STOPS.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? GUIDED_TOUR_STOPS.length - 1 : prev - 1
    );
  };

  return (
    <div className="guided-tour-card student-card">
      <div className="tour-header">
        <div className="tour-title-group">
          <span className="student-badge tour-badge">🧭 Interactive Guided Tour</span>
          <h3 className="tour-title">{currentStop.title}</h3>
        </div>
        <div className="tour-counter">
          {currentIndex + 1} of {GUIDED_TOUR_STOPS.length}
        </div>
      </div>

      <div className="tour-subtitle">{currentStop.subtitle}</div>

      <p className="tour-caption">{currentStop.caption}</p>

      {/* Progress Bar */}
      <div className="tour-progress-bar">
        <div
          className="tour-progress-fill"
          style={{
            width: `${((currentIndex + 1) / GUIDED_TOUR_STOPS.length) * 100}%`,
          }}
        />
      </div>

      {/* Control Buttons */}
      <div className="tour-controls">
        <button className="tour-btn secondary" onClick={handlePrev} title="Previous stop">
          ◀ Prev
        </button>

        <button
          className={`tour-btn play ${isPlaying ? "active" : ""}`}
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? "⏸ Pause Tour" : "▶ Auto Play"}
        </button>

        <button className="tour-btn secondary" onClick={handleNext} title="Next stop">
          Next ▶
        </button>

        { "speechSynthesis" in window && (
          <button
            className={`tour-btn audio-btn ${speechEnabled ? "active" : ""}`}
            onClick={() => setSpeechEnabled(!speechEnabled)}
            title="Toggle voice narration"
          >
            {speechEnabled ? "🔊 Voice On" : "🔈 Voice Off"}
          </button>
        )}

        {onExitTour && (
          <button className="tour-btn exit" onClick={onExitTour} title="Exit tour mode">
            ✕ Exit
          </button>
        )}
      </div>
    </div>
  );
}
