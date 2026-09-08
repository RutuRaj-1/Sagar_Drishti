/**
 * groqChatService.js — High-speed Groq AI Service for SAGAR-DRISHTI Explorer
 * Powers the Educational AI Ocean Assistant with complete Student Mode context,
 * multi-turn conversation memory, and a 3-tier resilient architecture:
 * 1. Backend FastAPI endpoint (/api/student/chat)
 * 2. Direct browser-to-Groq API fallback (using VITE_GROQ_API_KEY)
 * 3. Offline curriculum fallback (CHATBOT_QA_KNOWLEDGE)
 */

import { CHATBOT_QA_KNOWLEDGE } from "../data/studentData.js";

const DEFAULT_GROQ_KEY = "";
const PRIMARY_MODEL = import.meta.env.VITE_GROQ_MODEL || "openai/gpt-oss-120b";
const FALLBACK_MODEL = "qwen/qwen3.8-27b";

const FORECASTER_SYSTEM_PROMPT = `You are the SAGAR-DRISHTI Technical Decision-Support AI — an advanced oceanographic Copilot designed for duty forecasters, marine scientists, and researchers at INCOIS.

### ABOUT SAGAR-DRISHTI (सागर-दृष्टि "Ocean Vision")
- Developed for Smart India Hackathon (SIH 26067) in partnership with INCOIS (Indian National Centre for Ocean Information Services, Ministry of Earth Sciences, Govt. of India).
- A 3D/4D digital twin visualizing real oceanographic observations and models across the Northern Indian Ocean (Bay of Bengal, Arabian Sea, Andaman Sea, Lakshadweep Sea, 5°N–22°N / 68°E–95°E).
- Integrates REAL data: Copernicus Marine (CMEMS) physics models, Coriolis Argo robotic floats, Slocum gliders, INCOIS HF Radar networks, and NOAA/INCOIS RAMA moored buoys.

### COMPLETE FORECASTER / CO-PILOT MODE ECOSYSTEM
You have comprehensive knowledge of all technical tools and features available in the Forecaster Workspace:
1. **Technical Diagnostics & Metadata**:
   - Technical headers showing model run timestamp, bbox, spatial resolution, and variable statistics (min, max, mean, std deviation).
   - Validation metrics: RMSE (Root Mean Square Error), Model Skill parameters, and Bias.
   - Cross-correlation analysis (e.g., Pearson's r between Sea Surface Height and Sea Surface Temperature).
2. **Advanced Tools**:
   - **4D Volumetric Viewer**: 3D spatial slicing of temperature and salinity through 30 depth layers down to 454m.
   - **Data Assimilation Inspector**: Analyzing how Argo float profiles, Glider CTD casts, and RAMA buoy data assimilate into CMEMS models to reduce RMSE.
   - **Dynamic Anomaly Calculation**: Real-time subtraction of climatology from active fields to identify marine heatwaves (zos, tob anomalies).
3. **Forecaster AI Co-Pilot (You!)**:
   - Technical conversational assistant that answers advanced oceanographic queries.

### CONVERSATIONAL STYLE & RULES
- Be precise, technical, analytical, and professional.
- Use accurate oceanographic terminology (e.g., "baroclinic instability", "Ekman transport", "geostrophic velocity", "mixed layer depth").
- Format responses cleanly with markdown: use bolding for key terms, bullet points for readability, and mathematical notation where appropriate.
- When explaining anomalies or model skill, reference the statistical data provided in the active context (min, max, mean, std dev).
- Ensure the language is easy to understand but retains its scientific rigor.
- **Operational Disclaimer**: Always remind forecasters that while you provide technical decision support, official advisories and operational watch duty procedures must rely on established INCOIS protocols.`;

const STUDENT_SYSTEM_PROMPT = `You are the SAGAR-DRISHTI Educational AI Ocean Assistant — an enthusiastic, friendly, and scientifically grounded ocean literacy tutor designed for students, educators, and curious explorers of India's oceans.

### ABOUT SAGAR-DRISHTI (सागर-दृष्टि "Ocean Vision")
- Developed for Smart India Hackathon (SIH 26067) in collaboration with INCOIS (Indian National Centre for Ocean Information Services, Ministry of Earth Sciences, Govt. of India).
- Provides interactive 3D Globe, 2D Map, and 4D Depth/Volumetric slices of real ocean data across the Northern Indian Ocean (Bay of Bengal, Arabian Sea, Andaman Sea, Lakshadweep Sea, 5°N–22°N / 68°E–95°E).
- Integrates REAL scientific datasets: Copernicus Marine Service (CMEMS), Coriolis Argo profiling floats, Rutgers RU29 Slocum Gliders, INCOIS coastal HF Radar currents, and NOAA/INCOIS RAMA moored buoys.

### STUDENT / EXPLORER MODE FEATURES YOU KNOW:
1. **Explorer Guide**:
   - **Simple Summary Card**: Explains what is being viewed (variable, date, depth, units) in plain layman English.
   - **AI Ocean Insights**: Real-time diagnostic bullet points explaining observed thermal and salinity patterns.
   - **Ocean Health Status Badge**: Live diagnostics (e.g., "Normal Tropical Conditions", "Mild Marine Heatwave", "Freshwater Barrier Layer").
   - **Water Column Zones Bar**:
     * Epipelagic (Sunlit Zone, 0–200m): Photosynthesis, marine life, and summer warming.
     * Mesopelagic (Twilight Zone, 200–1000m): Fading light, steep thermocline, cold water.
     * Bathypelagic (Midnight Zone, 1000–4000m): Pitch black, near-freezing (2°C–4°C), intense pressure.
   - **Coastal Location Comparison Tool**:
     * Mumbai (Arabian Sea): High salinity (36.2 PSU), intense evaporation, dry desert winds.
     * Chennai (Bay of Bengal): Lower salinity (33.5 PSU), freshwater river inflows.
     * Kochi (Malabar Coast): Strong monsoon coastal upwelling bringing cold, nutrient-rich deep water.
     * Visakhapatnam (Northern Bay): Dynamic coastal eddies and cyclone passage zone.
     * Port Blair (Andaman Sea): Deep tropical trench and rich coral reefs.
     * Lakshadweep (Kavaratti): Coral atolls directly in the path of the South-West Monsoon Current.
   - **6-Stop Guided Ocean Tour**:
     * Stop 1: "The Warm Surface Pool" (Bay of Bengal >28°C heat reservoir driving monsoon clouds).
     * Stop 2: "The Hidden Thermocline" (sharp 10°C–15°C temperature drop within 50m–150m depth).
     * Stop 3: "Monsoon Current Drift" (seasonally reversing Somali & SW Monsoon currents >1.2 m/s).
     * Stop 4: "Robo-Scientists: Argo Floats" (90+ autonomous robotic floats diving to 2,000m every 10 days).
     * Stop 5: "Marine Heatwaves" (warm sea surface height anomalies, thermal expansion, coral bleaching).
     * Stop 6: "Rivers & Freshwater Plumes" (Ganges, Brahmaputra & Godavari freshwater lens floating over dense salt water).
   - **Rotating Did-You-Know Facts** and **Built-in Voice Narrator**.
2. **Ocean Literacy Quiz Challenge**: Knowledge challenge testing students on Indian Ocean concepts.
3. **Ask AI Chatbot (You!)**: Ready to answer any oceanographic question.

### OCEAN SCIENCE HIGHLIGHTS:
- **Bay of Bengal vs. Arabian Sea Salinity**: The Bay of Bengal receives over 1,000 km³/year of freshwater discharge from the Ganges, Brahmaputra, and peninsular rivers, creating a low-salinity surface "barrier layer". The Arabian Sea experiences high evaporation and dry winds, making it significantly saltier.
- **Reversing Monsoon Currents**: Currents flow East in summer (South-West Monsoon) and West in winter (North-East Monsoon).
- **Argo Floats**: Autonomous yellow robotic probes profiling temperature, salinity, and pressure down to 2,000 meters.
- **Marine Heatwaves**: Prolonged warm anomalies that threaten corals and intensify cyclones.

### CONVERSATIONAL RULES:
- Be warm, encouraging, engaging, and scientifically accurate.
- Use student-friendly analogies (e.g. "barrier layer acts like a thermal blanket", "currents act like giant conveyor belts").
- Use clean formatting (bold key terms, neat bullet points). Keep answers concise and readable.
- Invite the student to check relevant views in SAGAR-DRISHTI (e.g. "Try diving deeper with the depth slider", "Check out Stop 4 in the Guided Tour").
- Remind students that official cyclone warnings or fishing advisories are provided by IMD and INCOIS.`;

export class GroqChatService {
  /**
   * Sends a student question to the AI assistant with conversation history and active ocean context.
   */
  static async sendChatMessage(userQuery, { variable, date, depthIndex, depthLevels, surfaceStats } = {}, history = []) {
    const trimmedQuery = userQuery.trim();
    if (!trimmedQuery) return { text: "Please enter a question!", model: "none" };

    const contextPayload = {
      variableName: variable || "ocean temperature",
      date: date || "2026-08-31",
      depthVal: depthLevels?.[depthIndex] ?? 0,
      stats: surfaceStats || null,
    };

    // 1. First Attempt: Backend API (/api/student/chat)
    try {
      const backendRes = await fetch("/api/student/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmedQuery,
          messages: history.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
          context: contextPayload,
        }),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data.response) {
          return {
            text: data.response,
            model: data.model || PRIMARY_MODEL,
            source: "backend-groq",
          };
        }
      }
    } catch (err) {
      // Backend offline or unreachable; fall through to browser Groq API
      console.warn("Backend chatbot endpoint unreachable, falling back to direct Groq API:", err);
    }

    // 2. Second Attempt: Direct Browser-to-Groq API call
    const apiKey = import.meta.env.VITE_GROQ_API_KEY || DEFAULT_GROQ_KEY;
    if (apiKey) {
      const activeContextStr = `\n\n[CURRENT USER VIEW IN EXPLORER]\n- Variable: ${contextPayload.variableName}\n- Date: ${contextPayload.date}\n- Depth: ${contextPayload.depthVal}m\n`;

      const groqMessages = [
        { role: "system", content: STUDENT_SYSTEM_PROMPT + activeContextStr },
        ...history.slice(-6).map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: trimmedQuery },
      ];

      for (const modelCandidate of [PRIMARY_MODEL, FALLBACK_MODEL, "openai/gpt-oss-20b"]) {
        try {
          const directRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: modelCandidate,
              messages: groqMessages,
              temperature: 0.6,
              max_tokens: 800,
            }),
          });

          if (directRes.ok) {
            const resultData = await directRes.json();
            const reply = resultData?.choices?.[0]?.message?.content;
            if (reply) {
              return {
                text: reply,
                model: modelCandidate,
                source: "browser-groq",
              };
            }
          }
        } catch (directErr) {
          console.warn(`Groq candidate ${modelCandidate} failed:`, directErr);
        }
      }
    }

    // 3. Third Attempt: Offline Curriculum Knowledge Base Fallback
    return {
      text: this.getOfflineFallback(trimmedQuery, contextPayload),
      model: "offline-curriculum",
      source: "offline-fallback",
    };
  }

  /**
   * Generates a relevant answer when completely offline.
   */
  static getOfflineFallback(query, context) {
    const qLower = query.toLowerCase();

    for (const item of CHATBOT_QA_KNOWLEDGE) {
      if (item.keywords.some((kw) => qLower.includes(kw))) {
        return item.answer;
      }
    }

    if (qLower.includes("what") && (qLower.includes("see") || qLower.includes("view"))) {
      return `You are currently viewing ${context.variableName} across India's waters on ${context.date}. Warm tropical colors (red/orange) represent higher values, while blues represent cooler or fresher waters!`;
    }

    if (qLower.includes("depth") || qLower.includes("deep") || qLower.includes("bottom")) {
      return `As you descend beneath 100 meters, sunlight rapidly fades. The thermocline causes temperatures to plummet from ~29°C at the surface to near 4°C at the ocean floor!`;
    }

    return `Great question regarding ${context.variableName}! India's oceans play an essential role in driving monsoons and sustaining marine ecosystems. You can explore this using the 6-Stop Guided Tour or the depth profile tool on the left panel!`;
  }

  /**
   * Sends a forecaster question to the AI assistant with conversation history and technical active ocean context.
   */
  static async sendTechnicalChatMessage(userQuery, { variable, date, depthIndex, depthLevels, surfaceStats } = {}, history = []) {
    const trimmedQuery = userQuery.trim();
    if (!trimmedQuery) return { text: "Please enter a technical question!", model: "none" };

    const contextPayload = {
      variableName: variable || "technical ocean parameter",
      date: date || "2026-08-31",
      depthVal: depthLevels?.[depthIndex] ?? 0,
      stats: surfaceStats || null,
    };

    // 1. First Attempt: Backend API (/api/forecaster/chat)
    try {
      const backendRes = await fetch("/api/forecaster/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: trimmedQuery,
          messages: history.map((m) => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
          context: contextPayload,
        }),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data.response) {
          return {
            text: data.response,
            model: data.model || PRIMARY_MODEL,
            source: "backend-groq",
          };
        }
      }
    } catch (err) {
      console.warn("Backend forecaster endpoint unreachable, falling back to direct Groq API:", err);
    }

    // 2. Second Attempt: Direct Browser-to-Groq API call
    const apiKey = import.meta.env.VITE_GROQ_API_KEY || DEFAULT_GROQ_KEY;
    if (apiKey) {
      let activeContextStr = `\n\n[CURRENT USER VIEW IN FORECASTER]\n- Variable: ${contextPayload.variableName}\n- Date: ${contextPayload.date}\n- Depth: ${contextPayload.depthVal}m\n`;
      if (contextPayload.stats) {
        activeContextStr += `- Stats: Min ${contextPayload.stats.min_value}, Max ${contextPayload.stats.max_value}, Mean ${contextPayload.stats.mean_value}\n`;
      }

      const groqMessages = [
        { role: "system", content: FORECASTER_SYSTEM_PROMPT + activeContextStr },
        ...history.slice(-6).map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        })),
        { role: "user", content: trimmedQuery },
      ];

      for (const modelCandidate of [PRIMARY_MODEL, FALLBACK_MODEL, "openai/gpt-oss-20b"]) {
        try {
          const directRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: modelCandidate,
              messages: groqMessages,
              temperature: 0.4,
              max_tokens: 800,
            }),
          });

          if (directRes.ok) {
            const resultData = await directRes.json();
            const reply = resultData?.choices?.[0]?.message?.content;
            if (reply) {
              return {
                text: reply,
                model: modelCandidate,
                source: "browser-groq",
              };
            }
          }
        } catch (directErr) {
          console.warn(`Groq candidate ${modelCandidate} failed:`, directErr);
        }
      }
    }

    // 3. Third Attempt: Offline Technical Knowledge Base Fallback
    return {
      text: this.getOfflineForecasterFallback(trimmedQuery, contextPayload),
      model: "offline-technical",
      source: "offline-fallback",
    };
  }

  static getOfflineForecasterFallback(query, context) {
    const qLower = query.toLowerCase();
    
    if (qLower.includes("skill") || qLower.includes("rmse")) {
      return "The **overall model skill** evaluates CMEMS forecast performance against in-situ data (like Argo and RAMA buoys). A low **RMSE** indicates high model confidence. The current spatial RMSE averages around 0.45°C for SST.";
    }
    if (qLower.includes("discrepancy") || qLower.includes("east coast")) {
      return "Model discrepancies near the east coast are typically caused by **unresolved coastal dynamics**, such as the highly variable freshwater river plumes from the Godavari and Ganges, or sub-mesoscale coastal eddies that coarse grids struggle to capture.";
    }
    if (qLower.includes("marine heatwave") || qLower.includes("anomaly")) {
      return "**Marine Heatwave anomalies** are computed by subtracting the 30-year daily climatological baseline from the current operational SST. Anomalies exceeding the 90th percentile for 5+ days signify a heatwave event.";
    }
    if (qLower.includes("drift") || qLower.includes("velocity")) {
      return "**Surface drift velocity (sivelo)** is derived from the geostrophic equations applied to Sea Surface Height gradients, combined with Ekman wind-driven transport.";
    }
    if (qLower.includes("argo") || qLower.includes("assimilated")) {
      return "**Argo float observations** provide vital subsurface temperature and salinity profiles. These are assimilated into the CMEMS physical models using 3D-VAR or 4D-VAR techniques to correct initial conditions, significantly reducing deep-water forecast bias.";
    }

    return `Regarding ${context.variableName}, the technical data suggests active mesoscale variability. Please review the real-time diagnostics panel and volumetric cross-sections for deeper validation against in-situ observations.`;
  }
}
