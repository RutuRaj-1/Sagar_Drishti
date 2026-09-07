import React, { useState, useEffect } from "react";
import { DID_YOU_KNOW_FACTS } from "../../data/studentData.js";

export default function DidYouKnowBanner({ onJumpToStop }) {
  const [factIndex, setFactIndex] = useState(0);

  // Auto rotate fact every 12 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % DID_YOU_KNOW_FACTS.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const currentFact = DID_YOU_KNOW_FACTS[factIndex] || DID_YOU_KNOW_FACTS[0];

  const handleNext = () => {
    setFactIndex((prev) => (prev + 1) % DID_YOU_KNOW_FACTS.length);
  };

  const handlePrev = () => {
    setFactIndex((prev) =>
      prev === 0 ? DID_YOU_KNOW_FACTS.length - 1 : prev - 1
    );
  };

  return (
    <div className="did-you-know-banner student-card">
      <div className="fact-header">
        <div className="fact-title">
          <strong>Did You Know?</strong>
          <span className="fact-category-tag">{currentFact.category}</span>
        </div>
        <div className="fact-nav-btns">
          <button onClick={handlePrev} className="fact-nav" title="Previous fact">‹</button>
          <button onClick={handleNext} className="fact-nav" title="Next fact">›</button>
        </div>
      </div>

      <p className="fact-text">{currentFact.text}</p>

      {currentFact.relatedStop && onJumpToStop && (
        <button
          className="fact-jump-btn"
          onClick={() => onJumpToStop(currentFact.relatedStop)}
        >
          <span>Explore this in Guided Tour</span>
          <span>→</span>
        </button>
      )}
    </div>
  );
}
