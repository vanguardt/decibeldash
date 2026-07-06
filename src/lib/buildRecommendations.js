/**
 * Build recommendation engine — maps sound + feel preferences to
 * specific product suggestions across 6 categories.
 *
 * Preferences:
 *   soundProfile: Thocky | Clacky | Marbly | Creamy | Neutral
 *   volume:       Silent | Quiet | Moderate | Loud
 *   feel:         Light | Medium | Heavy
 *   switchType:   Linear | Tactile | Clicky
 */

const SWITCHES = {
  Thocky: {
    Linear: ["Gateron Oil Kings", "NovelKeys Cream", "C³ Tangerine V2"],
    Tactile: ["Bob U4T", "Holy Panda", "Durock T1"],
    Clicky: ["Kailh Box Thick Jade", "Kailh Box Navy"],
  },
  Clacky: {
    Linear: ["Gateron Ink Black", "C³ Equalz Tangerine", "Cherry MX Black"],
    Tactile: ["Holy Panda", "Durock T1", "Kailh Box Brown"],
    Clicky: ["Kailh Box Jade", "Kailh Box White"],
  },
  Marbly: {
    Linear: ["Gateron Ink Black", "C³ Equalz Tangerine"],
    Tactile: ["Holy Panda X", "Durock T1"],
    Clicky: ["Kailh Box Jade", "Kailh Box Pink"],
  },
  Creamy: {
    Linear: ["Gateron Oil Kings", "C³ Tangerine V2", "Gateron Cap Yellow"],
    Tactile: ["Bob U4T", "Gateron Brown"],
    Clicky: ["Kailh Box White"],
  },
  Neutral: {
    Linear: ["Cherry MX Red", "Gateron Yellow", "Gateron Milky Yellow"],
    Tactile: ["Cherry MX Brown", "Durock T1", "Bob U4T"],
    Clicky: ["Cherry MX Blue", "Kailh Box Jade"],
  },
};

const KEYCAPS = {
  Thocky: "PBT double-shot (Cherry or OEM profile) — thicker walls deepen the sound",
  Clacky: "ABS cherry profile (GMK-style) — produces a sharper, higher-pitched clack",
  Marbly: "ABS cherry profile — accentuates the glassy, marbled tone",
  Creamy: "PBT cherry profile with foam dampening — smooths out harshness",
  Neutral: "PBT OEM or Cherry profile — balanced, versatile sound",
};

const MODS = {
  Thocky: ["Switch lube (Krytox 205g0)", "Switch films (TX or Kelowna)", "Tape mod (2–3 layers painter's tape)"],
  Clacky: ["Switch films (TX)", "Tape mod (1–2 layers)", "Light lube (Krytox 205g0, thin film)"],
  Marbly: ["Switch films (TX)", "Tape mod (2 layers)", "Krytox 105 on springs (bag lube)"],
  Creamy: ["Switch lube (Krytox 205g0, generous)", "Switch films", "Tape mod (3 layers)"],
  Neutral: ["Switch lube (Krytox 205g0)", "Switch films (if tactile/clicky)"],
};

const STABILIZERS = {
  Thocky: "Durock V2 or C³ Tangerine stabs — band-aid mod + Krytox 205g0 for deep, rattle-free thock",
  Clacky: "Durock V2 stabs — dielectric grease + band-aid mod to keep the clack crisp without rattle",
  Marbly: "C³ Tangerine or Owlstork stabs — tuned with Krytox 205g0 for clean, glassy bottom-out",
  Creamy: "Durock V2 stabs — generously lubed with Krytox 205g0 + dielectric grease for smooth travel",
  Neutral: "Durock V2 or ZealPC stabs — standard tune with dielectric grease + band-aid mod",
};

const FOAM = {
  Thocky: "Case foam (polyurethane or EVA) + PE sheet mod on PCB — deepens and rounds out the thock",
  Clacky: "Minimal foam — a thin PE sheet or keyboard pad under the PCB preserves the clack's attack",
  Marbly: "PE sheet mod only — avoids over-dampening the marbled resonance",
  Creamy: "Case foam + plate foam (poron) + PE sheet — fully dampened, smooth sound signature",
  Neutral: "Poron plate foam + case foam — balanced dampening without killing character",
};

const CASES = {
  Thocky: "Polycarbonate or POM case — flexible, deep resonance; gasket-mounted plate for softer bottom-out",
  Clacky: "Aluminum case — rigid material produces a sharper, more defined clack; top-mounted plate",
  Marbly: "Acrylic or FR4 plate — adds a glassy, marbled quality; aluminum case for rigidity",
  Creamy: "Aluminum case with gasket mount + poron foam — fully dampened, smooth, premium feel",
  Neutral: "Aluminum case, gasket-mounted — versatile, neutral baseline",
};

const FORCE_BY_FEEL = { Light: "35–45g", Medium: "50–55g", Heavy: "62–67g" };

export function generateBuildRecommendations(prefs) {
  const { soundProfile = "Neutral", switchType = "Linear", feel = "Medium", volume = "Moderate" } = prefs;

  const switches = (SWITCHES[soundProfile]?.[switchType] || SWITCHES.Neutral[switchType] || SWITCHES.Neutral.Linear).map(
    (name) => ({ name, description: `${soundProfile} ${switchType.toLowerCase()} switch` })
  );

  const caseText = CASES[soundProfile] || CASES.Neutral;

  return [
    {
      category: "Switches",
      icon: "Layers",
      items: switches,
      note: `Target actuation: ${FORCE_BY_FEEL[feel] || "50–55g"} for a ${feel.toLowerCase()} feel`,
    },
    {
      category: "Keycaps",
      icon: "Grid3x3",
      items: [{ name: KEYCAPS[soundProfile] }],
    },
    {
      category: "Mods",
      icon: "Wrench",
      items: (MODS[soundProfile] || MODS.Neutral).map((m) => ({ name: m })),
    },
    {
      category: "Stabilizers",
      icon: "AlignHorizontalDistributeCenter",
      items: [{ name: STABILIZERS[soundProfile] || STABILIZERS.Neutral }],
    },
    {
      category: "Foam",
      icon: "Wind",
      items: [{ name: FOAM[soundProfile] || FOAM.Neutral }],
    },
    {
      category: "Case Type",
      icon: "Box",
      items: [{ name: caseText }],
    },
  ];
}