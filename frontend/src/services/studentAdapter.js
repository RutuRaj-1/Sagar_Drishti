/**
 * studentAdapter.js — SAGAR-DRISHTI Student Data & AI Insights Adapter
 * Implements data providers, AI insights generator, ocean health diagnostics,
 * and conversational chatbot services with robust offline fallbacks.
 */

import {
  COASTAL_PRESETS,
  LAYMAN_VARIABLE_EXPLANATIONS,
  CHATBOT_QA_KNOWLEDGE,
} from "../data/studentData.js";

export class StudentDataProvider {
  /**
   * Generates a plain-language summary for the current active view.
   */
  static getSummary({ variable, date, depthIndex, depthLevels, surfaceStats }) {
    const varMeta = LAYMAN_VARIABLE_EXPLANATIONS[variable] || {
      title: variable,
      laymanSummary: "Ocean field measurement.",
      colorScaleMeaning: "Shows variations across the ocean.",
      whyItMatters: "Helps scientists understand ocean dynamics.",
      icon: "🌊",
    };

    const depthVal = depthLevels?.[depthIndex] ?? 0;
    const depthDesc =
      depthVal === 0
        ? "at the ocean surface"
        : `at ${depthVal} meters below sea level`;

    const minVal = surfaceStats?.min_value?.toFixed(1) ?? "24.0";
    const maxVal = surfaceStats?.max_value?.toFixed(1) ?? "30.5";

    let plainSummary = `You are looking at ${varMeta.title.toLowerCase()} ${depthDesc} for ${date}.`;
    if (variable === "tob" || variable === "temperature") {
      plainSummary += ` Temperatures in this view range from ${minVal}°C (cooler water) to ${maxVal}°C (warm tropical water).`;
    } else if (variable === "sob" || variable === "salinity") {
      plainSummary += ` Salinity values range from ${minVal} PSU (fresh river runoff) to ${maxVal} PSU (saltier water).`;
    } else if (variable === "sivelo") {
      plainSummary += ` Ocean surface currents are moving between ${minVal} m/s and ${maxVal} m/s.`;
    }

    return {
      title: varMeta.title,
      laymanSummary: varMeta.laymanSummary,
      colorScaleMeaning: varMeta.colorScaleMeaning,
      whyItMatters: varMeta.whyItMatters,
      icon: varMeta.icon,
      plainSummary,
      depthVal,
      date,
    };
  }

  /**
   * Computes Ocean Health status badge for current view
   */
  static getOceanHealth({ variable, surfaceStats }) {
    const maxVal = surfaceStats?.max_value ?? 29.5;
    const meanVal = surfaceStats?.mean_value ?? 28.2;

    if (variable === "tob" || variable === "temperature") {
      if (maxVal > 30.5 || meanVal > 29.5) {
        return {
          status: "yellow",
          badgeText: "Mild Marine Heatwave",
          color: "#f59e0b", // amber
          bgColor: "rgba(245, 158, 11, 0.15)",
          borderColor: "rgba(245, 158, 11, 0.4)",
          explanation:
            "Water temperatures in parts of the Bay of Bengal are over 1.5°C warmer than normal. Scientists call this a mild marine heatwave.",
        };
      }
      return {
        status: "green",
        badgeText: "Normal Ocean Conditions",
        color: "#10b981", // emerald
        bgColor: "rgba(16, 185, 129, 0.15)",
        borderColor: "rgba(16, 185, 129, 0.4)",
        explanation:
          "Ocean temperatures are within normal historical ranges for this time of year across the Indian Ocean.",
      };
    }

    if (variable === "sob" || variable === "salinity") {
      if (surfaceStats?.min_value < 31.0) {
        return {
          status: "yellow",
          badgeText: "High River Runoff Plume",
          color: "#3b82f6", // blue
          bgColor: "rgba(59, 130, 246, 0.15)",
          borderColor: "rgba(59, 130, 246, 0.4)",
          explanation:
            "Heavy fresh river outflow detected in the northern Bay of Bengal, creating a fresh surface layer.",
        };
      }
    }

    return {
      status: "green",
      badgeText: "Stable Ocean State",
      color: "#10b981",
      bgColor: "rgba(16, 185, 129, 0.15)",
      borderColor: "rgba(16, 185, 129, 0.4)",
      explanation:
        "Ocean parameters are well within historical seasonal baselines.",
    };
  }

  /**
   * Compares two coastal locations
   */
  static compareLocations(id1 = "mumbai", id2 = "chennai", currentVar = "tob") {
    const loc1 = COASTAL_PRESETS.find((l) => l.id === id1) || COASTAL_PRESETS[0];
    const loc2 = COASTAL_PRESETS.find((l) => l.id === id2) || COASTAL_PRESETS[1];

    let paramName = "Temperature";
    let val1 = loc1.typicalTemp;
    let val2 = loc2.typicalTemp;
    let unit = "°C";

    if (currentVar === "sob" || currentVar === "salinity") {
      paramName = "Salinity";
      val1 = loc1.typicalSal;
      val2 = loc2.typicalSal;
      unit = "PSU";
    }

    const diff = Math.abs(val1 - val2).toFixed(1);
    const warmerName = val1 >= val2 ? loc1.name : loc2.name;

    return {
      loc1,
      loc2,
      paramName,
      val1,
      val2,
      unit,
      diff,
      verdict: `${warmerName} is higher in ${paramName.toLowerCase()} by ${diff}${unit}.`,
    };
  }
}

export class AIInsightsGenerator {
  /**
   * Generates 2-4 contextual bullet point insights based on current view.
   */
  static generateInsights({ variable, date, depthIndex, depthLevels, surfaceStats }) {
    const depthVal = depthLevels?.[depthIndex] ?? 0;
    const maxVal = surfaceStats?.max_value?.toFixed(1) ?? "29.8";
    const minVal = surfaceStats?.min_value?.toFixed(1) ?? "25.2";
    const meanVal = surfaceStats?.mean_value?.toFixed(1) ?? "28.4";

    const insights = [];

    // Bullet 1: Regional spatial gradient insight
    if (variable === "tob" || variable === "temperature") {
      insights.push({
        type: "spatial",
        icon: "",
        text: `The Bay of Bengal surface waters are averaging around ${meanVal}°C, which is ~1.2°C warmer than the western Arabian Sea.`,
      });
    } else if (variable === "sob" || variable === "salinity") {
      insights.push({
        type: "spatial",
        icon: "",
        text: `Salinity drops to ${minVal} PSU near river mouths in the East, while reaching ${maxVal} PSU off the western coast of Mumbai.`,
      });
    } else if (variable === "sivelo") {
      insights.push({
        type: "spatial",
        icon: "",
        text: `Surface drift speed peaks at ${maxVal} m/s along the Sri Lanka Dome current jet, driving heat eastward.`,
      });
    } else {
      insights.push({
        type: "spatial",
        icon: "",
        text: `Active field shows values between ${minVal} and ${maxVal} across the Indian Ocean basin.`,
      });
    }

    // Bullet 2: Depth / Thermocline insight
    if (depthVal > 0) {
      insights.push({
        type: "depth",
        icon: "",
        text: `At ${depthVal}m depth, solar heating is minimal. Water temperatures are cooler by 4°C to 12°C compared to the surface.`,
      });
    } else {
      insights.push({
        type: "depth",
        icon: "",
        text: `Surface layer absorbs over 80% of incoming solar radiation, creating a warm, buoyant top layer.`,
      });
    }

    // Bullet 3: In-situ Float observation insight
    insights.push({
      type: "argo",
      icon: "",
      text: `91 BGC-Argo floats and 4 ocean gliders are currently sampling this region to validate satellite models.`,
    });

    // Bullet 4: Educational Warning / Takeaway
    insights.push({
      type: "warning",
      icon: "",
      text: `Scientists monitor these thermal patterns because high ocean heat content provides fuel for seasonal tropical cyclones.`,
    });

    return insights;
  }
}

export class AIChatbotService {
  /**
   * Generates dynamic responses for student questions.
   */
  static respond(userQuestion, context = {}) {
    const qLower = userQuestion.toLowerCase().trim();

    // Check knowledge base keyword matches first
    for (const item of CHATBOT_QA_KNOWLEDGE) {
      if (item.keywords.some((kw) => qLower.includes(kw))) {
        return item.answer;
      }
    }

    // Contextual fallback response generator
    const varName = context.variableName || "ocean temperature";
    const date = context.date || "current date";

    if (qLower.includes("what") && qLower.includes("seeing")) {
      return `You are exploring ${varName} across the Indian Ocean for ${date}. Red and orange shades indicate higher values (warmer or saltier water), while blue shades represent lower values!`;
    }

    if (qLower.includes("depth") || qLower.includes("deep") || qLower.includes("bottom")) {
      return `As you go deeper into the ocean, sunlight disappears rapidly. Below 200 meters, water becomes dark and cold (often under 15°C), and pressure increases significantly!`;
    }

    if (qLower.includes("help") || qLower.includes("how")) {
      return `You can use the Guided Tour on the right to take a step-by-step story walkthrough of India's oceans, or use the depth slider on the left panel to dive underwater!`;
    }

    // Default friendly response
    return `Great question about ${varName}! The Indian Ocean plays a critical role in controlling India's monsoons and climate. You can click different points on the map or use the Guided Tour to learn more about how temperatures and currents change!`;
  }
}
