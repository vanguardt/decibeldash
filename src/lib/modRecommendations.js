export function generateRecommendations(profile) {
  const recs = [];
  const avgDb = profile.avg_decibels || 0;
  const peakDb = profile.peak_decibels || 0;

  let mods = [];
  try { mods = JSON.parse(profile.modifications || "[]"); } catch {}
  const hasMod = (m) => mods.includes(m);

  let heatmap = {};
  try { heatmap = JSON.parse(profile.key_heatmap || "{}"); } catch {}

  // 1. O-Rings
  if (avgDb > 55 && !hasMod("o_rings_single") && !hasMod("o_rings_double")) {
    recs.push({
      mod: "O-Rings",
      priority: avgDb > 60 ? "high" : "medium",
      reason: `Your board averages ${avgDb.toFixed(1)} dB — above the 55 dB threshold. O-rings cushion bottom-out impact and typically reduce peak noise by 2–4 dB.`,
    });
  }

  // 2. Switch Lube
  if (peakDb > 62 && !hasMod("lubed")) {
    recs.push({
      mod: "Switch Lube (Krytox 205g0)",
      priority: peakDb > 68 ? "high" : "medium",
      reason: `Peak hits ${peakDb.toFixed(1)} dB. Lubing switches smoothens travel, reduces spring ping, and softens harsh bottom-out noise.`,
    });
  }

  // 3. Switch Films
  if ((profile.switch_type === "Tactile" || profile.switch_type === "Clicky") && !hasMod("filmed")) {
    recs.push({
      mod: "Switch Films",
      priority: "medium",
      reason: `${profile.switch_type} switches are prone to housing wobble. Films tighten the top/bottom housing for a cleaner, more consistent sound.`,
    });
  }

  // 4. Stabilizer Tuning
  if (heatmap[" "] && heatmap[" "].avg_db > avgDb + 3) {
    const spaceDb = heatmap[" "].avg_db;
    recs.push({
      mod: "Stabilizer Tuning",
      priority: "high",
      reason: `Your space bar averages ${spaceDb.toFixed(1)} dB — ${Math.round(spaceDb - avgDb)} dB above your board average. Band-aid mod + dielectric grease on stabilizers will reduce rattle.`,
    });
  }

  // 5. Case Foam
  if (avgDb > 58) {
    recs.push({
      mod: "Case Foam",
      priority: "medium",
      reason: `Overall volume of ${avgDb.toFixed(1)} dB suggests case resonance. Foam fill absorbs hollow echo and deepens the sound profile.`,
    });
  }

  // 6. Switch alternatives based on build type
  const alt = getSwitchAlternative(profile, avgDb);
  if (alt) recs.push(alt);

  if (recs.length === 0) {
    recs.push({
      mod: "Build is Well-Tuned",
      priority: "low",
      reason: "Sound levels are within optimal range and no critical mods are missing. Nice build!",
    });
  }

  return recs;
}

function getSwitchAlternative(profile, avgDb) {
  const bt = profile.build_type;

  if (bt === "Silent" && avgDb > 50) {
    return {
      mod: "Switch Alternative: ZealPC Tangerine V2",
      priority: "high",
      reason: "For a Silent build above 50 dB, Tangerine V2s average ~49 dB with factory lube. Cherry MX Silent Red is another dampened option.",
    };
  }
  if (bt === "Thock" && avgDb > 55) {
    return {
      mod: "Switch Alternative: NovelKeys Cream",
      priority: "medium",
      reason: "For a deeper thock, POM-housing switches like NovelKeys Cream or Bob U4T produce a lower-pitched, fuller sound signature.",
    };
  }
  if (bt === "Clack" && avgDb < 55) {
    return {
      mod: "Switch Alternative: Holy Panda",
      priority: "medium",
      reason: "For a sharper clack, Holy Panda or Kailh Box Jade produce a crisp, defined clack with more attack.",
    };
  }
  if (bt === "Gaming" && profile.switch_type && profile.switch_type !== "Linear") {
    return {
      mod: "Switch Alternative: Cherry MX Red",
      priority: "low",
      reason: "For gaming, linear switches offer faster, unobstructed travel. Cherry MX Red (45g) or Gateron Yellow (50g) are top picks.",
    };
  }
  return null;
}