/**
 * studentData.js — SAGAR-DRISHTI Student / Explorer Data Registry
 * Contains educational metadata, guided tour stops, location comparison presets,
 * rotating ocean literacy facts, and layman science explanations.
 */

export const COASTAL_PRESETS = [
  {
    id: "mumbai",
    name: "Off Mumbai (Arabian Sea)",
    lat: 18.92,
    lon: 72.82,
    region: "Arabian Sea",
    description: "High salinity region influenced by evaporation and dry desert winds from the northwest.",
    typicalTemp: 28.5,
    typicalSal: 36.2,
  },
  {
    id: "chennai",
    name: "Off Chennai (Bay of Bengal)",
    lat: 13.08,
    lon: 80.27,
    region: "Bay of Bengal",
    description: "Lower salinity waters enriched by fresh river runoff from Ganges, Krishna, and Godavari.",
    typicalTemp: 29.2,
    typicalSal: 33.5,
  },
  {
    id: "kochi",
    name: "Off Kochi (Malabar Coast)",
    lat: 9.93,
    lon: 76.26,
    region: "Southwest Coast",
    description: "Strong coastal upwelling zone during South-West Monsoon bringing nutrient-rich deep water.",
    typicalTemp: 27.8,
    typicalSal: 35.1,
  },
  {
    id: "vizag",
    name: "Off Visakhapatnam (Northern Bay)",
    lat: 17.68,
    lon: 83.21,
    region: "Northern Bay of Bengal",
    description: "Dynamic coastal eddy zone frequently affected by tropical cyclones and river plumes.",
    typicalTemp: 28.9,
    typicalSal: 32.8,
  },
  {
    id: "port_blair",
    name: "Andaman Sea (Port Blair)",
    lat: 11.62,
    lon: 92.72,
    region: "Andaman & Nicobar",
    description: "Deep tropical basin with rich coral reefs and complex deep-sea topography.",
    typicalTemp: 29.5,
    typicalSal: 33.8,
  },
  {
    id: "lakshadweep",
    name: "Lakshadweep Sea (Kavaratti)",
    lat: 10.57,
    lon: 72.64,
    region: "Lakshadweep Atolls",
    description: "Clear, warm coral reef waters lying directly in the path of the South-West Monsoon Current.",
    typicalTemp: 29.1,
    typicalSal: 35.6,
  },
];

export const GUIDED_TOUR_STOPS = [
  {
    id: "stop-1",
    title: "1. The Warm Surface Pool",
    subtitle: "How India's seas absorb summer solar energy",
    variable: "tob",
    datasetMode: "cmems",
    depthIndex: 0,
    date: "2026-08-31",
    viewMode: "map",
    lat: 15.0,
    lon: 82.0,
    zoom: 6,
    caption:
      "Notice how the Bay of Bengal stays above 28°C even in late summer! This warm surface layer acts as an ocean engine, feeding energy into monsoon clouds and tropical rainstorms.",
    audioText:
      "Welcome to Sagar Drishti! You are looking at the warm surface pool of the Indian Ocean. Waters here often exceed 28 degrees Celsius, driving monsoon weather across India.",
    badge: "Surface Temperature",
  },
  {
    id: "stop-2",
    title: "2. The Hidden Thermocline",
    subtitle: "Diving beneath the sunlit surface",
    variable: "temperature",
    datasetMode: "volumetric",
    depthIndex: 4, // ~100m depth
    date: "2026-08-31",
    viewMode: "webgl",
    lat: 14.5,
    lon: 75.0,
    zoom: 6,
    caption:
      "Just 100 meters down, the temperature drops dramatically by 10°C to 15°C! Scientists call this sharp vertical boundary the thermocline — it separates warm surface water from cold deep ocean.",
    audioText:
      "Let's dive 100 meters underwater! Here, sunlight fades and the ocean temperature drops quickly. This transition layer is called the thermocline.",
    badge: "100m Depth Layer",
  },
  {
    id: "stop-3",
    title: "3. Monsoon Current Drift",
    subtitle: "Rivers of water flowing across the ocean",
    variable: "sivelo",
    datasetMode: "cmems",
    depthIndex: 0,
    date: "2026-08-31",
    viewMode: "map",
    lat: 10.0,
    lon: 78.0,
    zoom: 6,
    caption:
      "Ocean currents act like invisible superhighways! Driven by seasonal winds, surface drift velocities near Sri Lanka can exceed 1.2 meters per second, carrying heat from West to East.",
    audioText:
      "Look at the surface current arrows! Seasonal monsoon winds push massive amounts of water around Southern India, creating high-speed current jets.",
    badge: "Surface Currents",
  },
  {
    id: "stop-4",
    title: "4. Robo-Scientists: Argo Floats",
    subtitle: "Autonomous robots scanning 2,000 meters deep",
    variable: "tob",
    datasetMode: "cmems",
    depthIndex: 0,
    date: "2026-08-31",
    viewMode: "globe",
    lat: 12.0,
    lon: 85.0,
    zoom: 5,
    caption:
      "Over 90 yellow Argo floats drift continuously across Indian waters. Every 10 days, they sink 2,000 meters down and rise back up, beaming temperature & salinity data to satellites!",
    audioText:
      "Floating in these waters are robotic Argo floats. They dive deep into the ocean abyss and return to the surface to beam live observations to scientists.",
    badge: "Argo Robotics",
  },
  {
    id: "stop-5",
    title: "5. Marine Heatwaves",
    subtitle: "Detecting underwater heat spikes",
    variable: "zos",
    datasetMode: "cmems",
    depthIndex: 0,
    date: "2026-08-31",
    viewMode: "map",
    lat: 16.0,
    lon: 88.0,
    zoom: 6,
    caption:
      "Sea Surface Height (SSH) reveals warm anomalies! When water warms, it expands, raising the sea level slightly. Red areas highlight warm eddies that can cause coral bleaching.",
    audioText:
      "When ocean water absorbs excess heat, it expands! High sea level areas shown in red indicate warm water pools that scientists monitor closely.",
    badge: "Sea Surface Height",
  },
  {
    id: "stop-6",
    title: "6. Rivers & Freshwater Plumes",
    subtitle: "Why the Bay of Bengal is less salty than the Arabian Sea",
    variable: "sob",
    datasetMode: "cmems",
    depthIndex: 0,
    date: "2026-08-31",
    viewMode: "map",
    lat: 19.5,
    lon: 88.5,
    zoom: 6,
    caption:
      "Great rivers like the Ganges and Brahmaputra pour billions of liters of fresh water into the northern Bay of Bengal, creating a fresh surface layer that floats over dense salty water below.",
    audioText:
      "Notice the low salinity off the northern coast! Massive river discharge creates a fresh surface blanket over the northern Bay of Bengal.",
    badge: "Salinity & Rivers",
  },
];

export const DID_YOU_KNOW_FACTS = [
  {
    id: "fact-1",
    category: "Ocean Heat",
    text: "The top 3 meters of the ocean store as much heat energy as the entire atmosphere of Earth!",
    relatedStop: "stop-1",
    icon: "☀️",
  },
  {
    id: "fact-2",
    category: "Salinity",
    text: "The Arabian Sea is much saltier than the Bay of Bengal because strong winds cause high evaporation and few large rivers flow into it.",
    relatedStop: "stop-6",
    icon: "🧂",
  },
  {
    id: "fact-3",
    category: "Robotics",
    text: "India operates BGC-Argo floats that measure ocean oxygen, chlorophyll (plant life), and acidity down to 2,000 meters!",
    relatedStop: "stop-4",
    icon: "🤖",
  },
  {
    id: "fact-4",
    category: "Monsoons",
    text: "The South-West Monsoon Current reverses its direction twice every year, flowing East in summer and West in winter.",
    relatedStop: "stop-3",
    icon: "💨",
  },
  {
    id: "fact-5",
    category: "Deep Ocean",
    text: "Below 1,000 meters in the Indian Ocean, the water stays near a freezing 2°C to 4°C all year round!",
    relatedStop: "stop-2",
    icon: "❄️",
  },
  {
    id: "fact-6",
    category: "Coral Health",
    text: "A temperature increase of just 1°C above normal for 4 weeks can trigger coral bleaching in tropical reefs.",
    relatedStop: "stop-5",
    icon: "🪸",
  },
];

export const LAYMAN_VARIABLE_EXPLANATIONS = {
  tob: {
    title: "Sea Bottom / Surface Temperature",
    laymanSummary: "Measures how hot or cold the ocean water is.",
    colorScaleMeaning: "Red & orange indicate warm tropical water (28°C+). Blue indicates cooler deep water.",
    whyItMatters: "Warm water provides energy to monsoons and cyclones, while cool water nurtures marine life.",
    icon: "🌡️",
  },
  sob: {
    title: "Sea Bottom / Surface Salinity",
    laymanSummary: "Measures how much salt is dissolved in the seawater (in PSU / parts per thousand).",
    colorScaleMeaning: "Yellow & orange show high salt content. Blue & cyan show fresh river runoff areas.",
    whyItMatters: "Salty water is heavier and sinks, while river freshwater floats on top, forming a protective barrier layer.",
    icon: "🧂",
  },
  zos: {
    title: "Sea Surface Height (Sea Level Anomaly)",
    laymanSummary: "Measures tiny hills and valleys on the ocean surface in meters.",
    colorScaleMeaning: "Red areas are slightly higher (warm water expansion). Blue areas are lower.",
    whyItMatters: "Higher sea surface height indicates warm ocean eddies that can fuel cyclones.",
    icon: "🌊",
  },
  mlotst: {
    title: "Mixed Layer Depth",
    laymanSummary: "The depth of the upper ocean layer stirred by wind and waves.",
    colorScaleMeaning: "Purple & dark blue show a shallow mixed layer (10-30m). Lighter colors show deep mixing.",
    whyItMatters: "A shallow mixed layer heats up quickly under sunlight, increasing cyclone risks.",
    icon: "📏",
  },
  sivelo: {
    title: "Surface Drift Velocity",
    laymanSummary: "The speed at which surface water is drifting (in meters per second).",
    colorScaleMeaning: "Red & yellow indicate swift current jets. Dark navy indicates calm water.",
    whyItMatters: "Currents carry heat, nutrients, larval marine life, and floating debris across oceans.",
    icon: "💨",
  },
  temperature: {
    title: "3D Volumetric Temperature",
    laymanSummary: "3D temperature slice showing vertical heat distribution from surface to deep sea.",
    colorScaleMeaning: "Bright red at surface fading through yellow and green to cold deep blue below 200m.",
    whyItMatters: "Helps oceanographers trace how surface solar warmth penetrates into deep water layers.",
    icon: "🌡️",
  },
  salinity: {
    title: "3D Volumetric Salinity",
    laymanSummary: "3D salinity slice showing how salt density changes with depth.",
    colorScaleMeaning: "Light cyan fresh surface layer over dense yellow salty deep water.",
    whyItMatters: "Drives underwater ocean conveyor currents and thermohaline circulation.",
    icon: "🧂",
  },
};

export const CHATBOT_QA_KNOWLEDGE = [
  {
    keywords: ["marine heatwave", "heatwave", "warm water", "hot ocean"],
    question: "What is a marine heatwave?",
    answer:
      "A marine heatwave occurs when seawater temperatures rise significantly above average for 5 or more consecutive days. Just like heatwaves on land, marine heatwaves can stress corals, drive fish to cooler waters, and fuel intense tropical storms.",
  },
  {
    keywords: ["argo", "float", "robot", "sensor"],
    question: "What do Argo floats do?",
    answer:
      "Argo floats are autonomous ocean robots! They sink 2,000 meters into the ocean, record temperature, salinity, and oxygen as they rise, and then transmit data to satellites. There are over 90 active floats in the Indian Ocean right now.",
  },
  {
    keywords: ["thermocline", "layer", "depth", "deep"],
    question: "What is the thermocline?",
    answer:
      "The thermocline is the layer in the ocean where temperature drops rapidly between the warm sunlit surface and the cold deep water. In the Indian Ocean, it usually starts around 50 to 100 meters depth.",
  },
  {
    keywords: ["bay of bengal", "arabian sea", "salt", "river", "salinity"],
    question: "Why is the Bay of Bengal less salty than the Arabian Sea?",
    answer:
      "The Bay of Bengal receives immense amounts of fresh water from major rivers like the Ganges, Brahmaputra, and Godavari, plus heavy monsoon rainfall. In contrast, the Arabian Sea has high evaporation and very few large rivers entering it.",
  },
  {
    keywords: ["cyclone", "storm", "monsoon", "weather"],
    question: "How does ocean temperature affect monsoons & cyclones?",
    answer:
      "Warm ocean water above 26.5°C evaporates rapidly, supplying moisture and energy to the atmosphere. When a storm passes over warm water (high ocean heat content), it can quickly intensify into a severe cyclone.",
  },
  {
    keywords: ["glider", "underwater glider", "slocum"],
    question: "How do ocean gliders work?",
    answer:
      "Ocean gliders are winged underwater vehicles that move without propellers! They change their buoyancy to glide up and down in a sawtooth path through the water column, measuring continuous temperature and salinity profiles.",
  },
];
