"""
chatbot.py
----------
Groq-powered conversational AI endpoint for SAGAR-DRISHTI.
Provides high-speed, domain-grounded intelligence for the Educational AI Ocean Assistant
(Student / Explorer Mode) and technical queries.
"""

import logging
from typing import List, Dict, Any, Optional
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app import config

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["AI Chatbots"],
)

STUDENT_MODE_SYSTEM_PROMPT = """You are the SAGAR-DRISHTI Educational AI Ocean Assistant — an enthusiastic, friendly, and scientifically rigorous ocean literacy guide built for students, teachers, and young oceanographers exploring India's marine realm.

### ABOUT SAGAR-DRISHTI (सागर-दृष्टि "Ocean Vision")
- Developed for Smart India Hackathon (SIH 26067) in partnership with INCOIS (Indian National Centre for Ocean Information Services, Ministry of Earth Sciences, Govt. of India).
- It is a 3D/4D digital twin visualizing real oceanographic observations and models across the Northern Indian Ocean (Bay of Bengal, Arabian Sea, Andaman Sea, Lakshadweep Sea, 5°N–22°N / 68°E–95°E).
- Uses REAL data: Copernicus Marine (CMEMS) physics models, Coriolis Argo robotic floats, Slocum gliders, INCOIS HF Radar networks, and NOAA/INCOIS RAMA moored buoys.

### COMPLETE STUDENT / EXPLORER MODE ECOSYSTEM
You have comprehensive knowledge of all tools and features available in the Student Workspace:
1. **Explorer Guide**:
   - **Simple Summary Card**: Breaks down the active dataset into plain layman language with units, values, and why it matters.
   - **AI Ocean Insights**: Real-time diagnostic bullet points explaining observed thermal, salinity, and current features.
   - **Ocean Health Status Badge**: Live diagnostics of ecological conditions (e.g. "Normal Tropical Conditions", "Mild Marine Heatwave", "Low-Salinity Freshwater Barrier Layer").
   - **Water Column Zones & Depth Gradient**: Visualizes ocean depth layers:
     * Epipelagic (Sunlit Zone, 0–200m): Photosynthesis, marine life, mixed layer, and seasonal warming.
     * Mesopelagic (Twilight Zone, 200–1000m): Rapidly fading light, thermocline zone, bioluminescent organisms.
     * Bathypelagic (Midnight Zone, 1000–4000m): Pitch black, near-freezing temperatures (2°C–4°C), intense hydrostatic pressure.
   - **Coastal Location Comparison Tool**: Allows students to compare two Indian coastal locations:
     * Mumbai (Arabian Sea): High salinity (36.2 PSU), intense evaporation, dry desert winds.
     * Chennai (Bay of Bengal): Lower salinity (33.5 PSU), freshwater river inputs.
     * Kochi (Malabar Coast): Major monsoon coastal upwelling brings cold, nutrient-rich deep water to the surface.
     * Visakhapatnam (Northern Bay): Dynamic coastal eddies and cyclone passage corridor.
     * Port Blair (Andaman Sea): Deep tropical trench, coral reefs, and complex bathymetry.
     * Lakshadweep (Kavaratti): Coral atolls directly in the path of the South-West Monsoon Current.
   - **6-Stop Guided Ocean Tour (with AI Voice Narration)**:
     * Stop 1: "The Warm Surface Pool" (Bay of Bengal >28°C heat reservoir driving monsoon rainstorms).
     * Stop 2: "The Hidden Thermocline" (sharp 10°C–15°C temperature drop within 50m–150m depth).
     * Stop 3: "Monsoon Current Drift" (seasonally reversing Somali & SW Monsoon currents >1.2 m/s).
     * Stop 4: "Robo-Scientists: Argo Floats" (90+ autonomous robotic floats diving to 2,000m every 10 days).
     * Stop 5: "Marine Heatwaves" (warm sea surface height anomalies, thermal expansion, coral bleaching).
     * Stop 6: "Rivers & Freshwater Plumes" (Ganges, Brahmaputra & Godavari freshwater lens floating over dense salt water).
   - **Rotating Did-You-Know Facts**: Surprising ocean trivia linked directly to guided tour stops.
   - **Voice Narrator**: Built-in speech synthesis reading out tour stops and oceanographic insights.
2. **Ocean Literacy Quiz Challenge**:
   - Interactive multi-question challenge testing students on Indian Ocean science concepts.
3. **Ask AI Chatbot (You!)**:
   - Conversational assistant answering curious questions, explaining visual patterns on the map, explaining ocean physics, and guiding students to explorer features.

### PHYSICAL OCEANOGRAPHY OF INDIAN WATERS (CORE CONCEPTS)
- **Why Bay of Bengal is fresher than Arabian Sea**: The Bay receives >1,000 km³/year of freshwater discharge from the Ganges, Brahmaputra, Mahanadi, Godavari, and Krishna, creating a low-salinity "barrier layer". The Arabian Sea has minimal river input and experiences fierce dry desert winds causing high evaporation, making it much saltier.
- **Monsoon Currents Reversal**: The only ocean in the world where upper ocean currents completely reverse direction twice a year! Eastward in summer (SW Monsoon) and westward in winter (NE Monsoon).
- **Coastal Upwelling**: During the SW Monsoon, winds push surface waters offshore, pulling cold, nutrient-rich deep water upward along the Kerala/Karnataka/Goa coast, triggering massive phytoplankton blooms and sustaining India's richest fisheries.
- **Marine Heatwaves & Cyclones**: Ocean waters exceeding 26.5°C provide thermal fuel for tropical cyclones. Prolonged marine heatwaves cause coral bleaching in Lakshadweep and Gulf of Mannar.
- **Robotic Argo Floats**: Autonomous yellow floats that drift at 1,000m, dive to 2,000m, and measure Temperature, Salinity, and Pressure as they ascend, beaming live data to satellites.

### CONVERSATIONAL STYLE & RULES
- Be welcoming, enthusiastic, clear, and encouraging.
- Use student-friendly analogies (e.g., "The freshwater acts like an insulating blanket", "Argo floats are like underwater robotic weather balloons").
- Format responses cleanly with markdown: use bolding for key terms and bullet points for readability.
- When relevant, direct the student to look at specific features in the SAGAR-DRISHTI app (e.g., "Check out Stop 2 in the Guided Tour" or "Use the Depth Slider to explore the thermocline").
- Keep explanations engaging and concise (2-4 paragraphs or a clear bulleted breakdown).
- **Safety Disclaimer**: If asked about active cyclone emergencies or fishing safety, remind students that SAGAR-DRISHTI is an educational platform and official warnings must be followed via IMD and INCOIS.
"""


class ChatMessage(BaseModel):
    role: str  # "user", "assistant", or "system"
    content: str


class StudentChatRequest(BaseModel):
    query: str
    messages: Optional[List[ChatMessage]] = Field(default_factory=list)
    context: Optional[Dict[str, Any]] = None


class StudentChatResponse(BaseModel):
    response: str
    model: str
    status: str
    variable: Optional[str] = None


@router.get("/student/chat/health")
def check_chatbot_health():
    """Verifies that the Groq API configuration is active and reachable."""
    configured = bool(config.GROQ_API_KEY and config.GROQ_API_KEY.startswith("gsk_"))
    return {
        "status": "ready" if configured else "missing_key",
        "model": config.GROQ_MODEL,
        "fallback_model": config.GROQ_FALLBACK_MODEL,
        "provider": "Groq Llama / OSS AI Engine",
    }


@router.post("/student/chat", response_model=StudentChatResponse)
def handle_student_chat(request: StudentChatRequest):
    """
    Processes a student chat query through Groq AI API with full SAGAR-DRISHTI context.
    """
    user_query = request.query.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # Context enrichment from the active view in frontend
    context_str = ""
    if request.context:
        ctx = request.context
        var_name = ctx.get("variableName") or ctx.get("variable") or "Current Ocean View"
        date_str = ctx.get("date") or "2026-08-31"
        depth_str = f"{ctx.get('depthVal', 0)} meters depth"
        context_str = (
            f"\n\n[ACTIVE USER EXPLORER CONTEXT]\n"
            f"- Currently Viewed Variable: {var_name}\n"
            f"- Forecast/Observation Date: {date_str}\n"
            f"- Selected Depth Layer: {depth_str}\n"
        )
        if "stats" in ctx and ctx["stats"]:
            st = ctx["stats"]
            context_str += f"- Min/Max Range in View: {st.get('min_value', 'N/A')} to {st.get('max_value', 'N/A')}\n"

    # Assemble messages payload
    groq_messages = [
        {"role": "system", "content": STUDENT_MODE_SYSTEM_PROMPT + context_str}
    ]

    # Append multi-turn history (up to last 6 messages to keep context focused)
    if request.messages:
        for msg in request.messages[-6:]:
            if msg.role in ("user", "assistant"):
                groq_messages.append({"role": msg.role, "content": msg.content})

    # Add the newest user query
    groq_messages.append({"role": "user", "content": user_query})

    headers = {
        "Authorization": f"Bearer {config.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    # Attempt primary model first, with automatic fallback
    models_to_try = [config.GROQ_MODEL, config.GROQ_FALLBACK_MODEL, "openai/gpt-oss-20b"]
    last_error = None
    ai_text = None
    model_used = config.GROQ_MODEL

    for model_name in models_to_try:
        try:
            payload = {
                "model": model_name,
                "messages": groq_messages,
                "temperature": 0.6,
                "max_tokens": 800,
            }
            res = requests.post(
                config.GROQ_API_URL,
                headers=headers,
                json=payload,
                timeout=15,
            )
            if res.status_code == 200:
                data = res.json()
                ai_text = data["choices"][0]["message"]["content"]
                model_used = model_name
                break
            else:
                last_error = f"Groq HTTP {res.status_code}: {res.text}"
                logger.warning(f"Groq model {model_name} failed: {last_error}")
        except Exception as exc:
            last_error = str(exc)
            logger.warning(f"Exception trying Groq model {model_name}: {exc}")

    if not ai_text:
        # Graceful curriculum fallback if all API attempts fail
        logger.error(f"All Groq models failed. Last error: {last_error}")
        ai_text = _curriculum_fallback_response(user_query, request.context)
        model_used = "offline-curriculum-fallback"

    return StudentChatResponse(
        response=ai_text,
        model=model_used,
        status="success",
        variable=request.context.get("variable") if request.context else None,
    )


def _curriculum_fallback_response(query: str, context: Optional[Dict[str, Any]]) -> str:
    """Safe offline curriculum fallback if Groq API network is temporarily unreachable."""
    q_low = query.lower()
    if "thermocline" in q_low:
        return (
            "The **thermocline** is the transition layer in the ocean where temperature drops rapidly with depth! "
            "In India's seas, it usually starts around 50 to 100 meters down, separating the warm sunlit surface from cold deep ocean water (often below 15°C)."
        )
    elif "salinity" in q_low or "salt" in q_low or "bay of bengal" in q_low:
        return (
            "The **Bay of Bengal is significantly less salty** than the Arabian Sea because enormous river systems like the Ganges, "
            "Brahmaputra, Godavari, and Krishna discharge over 1,000 cubic kilometers of fresh water into it each year, creating a buoyant surface barrier layer!"
        )
    elif "argo" in q_low or "robot" in q_low:
        return (
            "**Argo floats** are autonomous robotic ocean explorers! Over 90 floats drift across the Indian Ocean. "
            "Every 10 days, they sink down to 2,000 meters, measure temperature and salinity as they rise back up, and beam data to satellites."
        )
    elif "heatwave" in q_low:
        return (
            "A **Marine Heatwave** occurs when ocean temperatures stay unusually hot (above the 90th percentile) for 5 or more consecutive days. "
            "This can cause severe coral bleaching in reefs around Lakshadweep and Andaman and fuel intense cyclones."
        )
    elif "monsoon" in q_low or "current" in q_low:
        return (
            "India's ocean currents are unique because **they completely reverse direction with the monsoons**! "
            "During the summer South-West Monsoon, strong winds drive surface currents eastward; during the winter North-East Monsoon, currents flow westward."
        )

    var_name = context.get("variableName") if context else "India's oceans"
    return (
        f"Great question regarding {var_name}! The Indian Ocean controls the monsoons and climate across South Asia. "
        "You can explore real observations in SAGAR-DRISHTI by clicking on different regions of the map, diving down with the depth slider, or taking the 6-Stop Guided Tour!"
    )


# -------------------------------------------------------------------------
# FORECASTER MODE
# -------------------------------------------------------------------------

FORECASTER_MODE_SYSTEM_PROMPT = """You are the SAGAR-DRISHTI Technical Decision-Support AI — an advanced oceanographic Copilot designed for duty forecasters, marine scientists, and researchers at INCOIS.

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

### PHYSICAL OCEANOGRAPHY & TECHNICAL CONCEPTS
- **Model Skill & RMSE**: Used to quantify how well the CMEMS operational model (cmems_mod_glo_phy) matches in-situ observations. A low RMSE and high skill score indicate high confidence.
- **Geostrophic Equilibrium & Sea Surface Height (zos)**: Sea surface height anomalies are proxy indicators for ocean heat content and mesoscale eddies. Positive anomalies (warm core eddies) expand the water column; negative anomalies (cold core eddies) depress it.
- **Thermohaline Dynamics**: Temperature (thetao) and salinity (so) gradients drive density-driven circulation. The freshwater barrier layer in the Bay of Bengal (from Ganges/Brahmaputra discharge) traps heat in the mixed layer, fueling cyclogenesis.
- **Coastal Upwelling**: Wind-driven Ekman transport along the Malabar Coast (SW Monsoon) pushes surface water offshore, allowing cold, nutrient-rich deep water to upwell, lowering SST and increasing biological productivity.
- **Argo Co-location Bias**: The spatial or temporal discrepancy between an Argo float's discrete profile and the model's gridded forecast cell.

### CONVERSATIONAL STYLE & RULES
- Be precise, technical, analytical, and professional.
- Use accurate oceanographic terminology (e.g., "baroclinic instability", "Ekman transport", "geostrophic velocity", "mixed layer depth").
- Format responses cleanly with markdown: use bolding for key terms, bullet points for readability, and mathematical notation where appropriate.
- When explaining anomalies or model skill, reference the statistical data provided in the active context (min, max, mean, std dev).
- Ensure the language is easy to understand but retains its scientific rigor.
- **Operational Disclaimer**: Always remind forecasters that while you provide technical decision support, official advisories and operational watch duty procedures must rely on established INCOIS protocols.
"""

@router.post("/forecaster/chat", response_model=StudentChatResponse)
def handle_forecaster_chat(request: StudentChatRequest):
    """
    Processes a forecaster chat query through Groq AI API with full SAGAR-DRISHTI technical context.
    """
    user_query = request.query.strip()
    if not user_query:
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    # Context enrichment from the active view in frontend
    context_str = ""
    if request.context:
        ctx = request.context
        var_name = ctx.get("variableName") or ctx.get("variable") or "Current Technical View"
        date_str = ctx.get("date") or "2026-08-31"
        depth_str = f"{ctx.get('depthVal', 0)} meters depth"
        context_str = (
            f"\n\n[ACTIVE FORECASTER CONTEXT]\n"
            f"- Currently Analyzed Variable: {var_name}\n"
            f"- Model/Observation Date: {date_str}\n"
            f"- Selected Depth Layer: {depth_str}\n"
        )
        if "stats" in ctx and ctx["stats"]:
            st = ctx["stats"]
            context_str += (
                f"- Statistical Range in View:\n"
                f"  * Min: {st.get('min_value', 'N/A')}\n"
                f"  * Max: {st.get('max_value', 'N/A')}\n"
                f"  * Mean (μ): {st.get('mean_value', 'N/A')}\n"
                f"  * Std Dev (σ): {st.get('std_dev', 'N/A')}\n"
            )

    # Assemble messages payload
    groq_messages = [
        {"role": "system", "content": FORECASTER_MODE_SYSTEM_PROMPT + context_str}
    ]

    # Append multi-turn history
    if request.messages:
        for msg in request.messages[-6:]:
            if msg.role in ("user", "assistant"):
                groq_messages.append({"role": msg.role, "content": msg.content})

    groq_messages.append({"role": "user", "content": user_query})

    headers = {
        "Authorization": f"Bearer {config.GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    models_to_try = [config.GROQ_MODEL, config.GROQ_FALLBACK_MODEL, "openai/gpt-oss-20b"]
    last_error = None
    ai_text = None
    model_used = config.GROQ_MODEL

    for model_name in models_to_try:
        try:
            payload = {
                "model": model_name,
                "messages": groq_messages,
                "temperature": 0.4, # Lower temperature for more analytical/factual responses
                "max_tokens": 800,
            }
            res = requests.post(
                config.GROQ_API_URL,
                headers=headers,
                json=payload,
                timeout=15,
            )
            if res.status_code == 200:
                data = res.json()
                ai_text = data["choices"][0]["message"]["content"]
                model_used = model_name
                break
            else:
                last_error = f"Groq HTTP {res.status_code}: {res.text}"
                logger.warning(f"Groq model {model_name} failed: {last_error}")
        except Exception as exc:
            last_error = str(exc)
            logger.warning(f"Exception trying Groq model {model_name}: {exc}")

    if not ai_text:
        logger.error(f"All Groq models failed. Last error: {last_error}")
        ai_text = _forecaster_fallback_response(user_query, request.context)
        model_used = "offline-curriculum-fallback"

    return StudentChatResponse(
        response=ai_text,
        model=model_used,
        status="success",
        variable=request.context.get("variable") if request.context else None,
    )

def _forecaster_fallback_response(query: str, context: Optional[Dict[str, Any]]) -> str:
    """Safe offline curriculum fallback for Forecaster mode."""
    q_low = query.lower()
    if "skill" in q_low or "rmse" in q_low:
        return (
            "The **overall model skill** evaluates CMEMS forecast performance against in-situ data (like Argo and RAMA buoys). "
            "A low **RMSE** indicates high model confidence. The current spatial RMSE averages around 0.45°C for SST."
        )
    elif "discrepancy" in q_low or "east coast" in q_low:
        return (
            "Model discrepancies near the east coast are typically caused by **unresolved coastal dynamics**, such as the highly variable freshwater river plumes "
            "from the Godavari and Ganges, or sub-mesoscale coastal eddies that coarse grids struggle to capture."
        )
    elif "marine heatwave" in q_low or "anomaly" in q_low:
        return (
            "**Marine Heatwave anomalies** are computed by subtracting the 30-year daily climatological baseline from the current operational SST. "
            "Anomalies exceeding the 90th percentile for 5+ days signify a heatwave event, often corresponding with positive Sea Surface Height (zos) anomalies."
        )
    elif "drift" in q_low or "velocity" in q_low:
        return (
            "**Surface drift velocity (sivelo)** is derived from the geostrophic equations applied to Sea Surface Height gradients, combined with Ekman wind-driven transport. "
            "It is crucial for modeling pollutant trajectory and search-and-rescue operations."
        )
    elif "argo" in q_low or "assimilated" in q_low:
        return (
            "**Argo float observations** provide vital subsurface temperature and salinity profiles. "
            "These are assimilated into the CMEMS physical models using 3D-VAR or 4D-VAR techniques to correct initial conditions, significantly reducing deep-water forecast bias."
        )
    
    var_name = context.get("variableName") if context else "the current ocean parameter"
    return (
        f"Regarding {var_name}, the technical data suggests active mesoscale variability. "
        "Please review the real-time diagnostics panel and volumetric cross-sections for deeper validation against in-situ observations."
    )
