import React, { useState } from "react";
import { Sparkles, Layers, Grid3x3, Wrench, AlignHorizontalDistributeCenter, Wind, Box } from "lucide-react";
import MobileSelect from "@/components/ui/mobile-select";
import { Button } from "@/components/ui/button";
import { generateBuildRecommendations } from "@/lib/buildRecommendations";

const ICONS = {
  Layers,
  Grid3x3,
  Wrench,
  AlignHorizontalDistributeCenter,
  Wind,
  Box,
};

const SOUND_OPTIONS = [
  { value: "Thocky", label: "Thocky — deep, bassy" },
  { value: "Clacky", label: "Clacky — sharp, bright" },
  { value: "Marbly", label: "Marbly — glassy, resonant" },
  { value: "Creamy", label: "Creamy — smooth, dampened" },
  { value: "Neutral", label: "Neutral — balanced" },
];

const VOLUME_OPTIONS = [
  { value: "Silent", label: "Silent" },
  { value: "Quiet", label: "Quiet" },
  { value: "Moderate", label: "Moderate" },
  { value: "Loud", label: "Loud" },
];

const FEEL_OPTIONS = [
  { value: "Light", label: "Light (35–45g)" },
  { value: "Medium", label: "Medium (50–55g)" },
  { value: "Heavy", label: "Heavy (62–67g)" },
];

const SWITCH_TYPE_OPTIONS = [
  { value: "Linear", label: "Linear" },
  { value: "Tactile", label: "Tactile" },
  { value: "Clicky", label: "Clicky" },
];

export default function Recommend() {
  const [soundProfile, setSoundProfile] = useState("Thocky");
  const [volume, setVolume] = useState("Moderate");
  const [feel, setFeel] = useState("Medium");
  const [switchType, setSwitchType] = useState("Linear");
  const [results, setResults] = useState(null);

  const handleGenerate = () => {
    setResults(generateBuildRecommendations({ soundProfile, volume, feel, switchType }));
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <Sparkles className="w-6 h-6 mx-auto text-primary mb-2" />
        <h1 className="text-xl font-bold tracking-tight">Build Recommender</h1>
        <p className="text-xs text-muted-foreground mt-1">Pick your sound & feel — get a full part list</p>
      </div>

      {/* Preferences */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3 mb-5">
        <MobileSelect
          value={soundProfile}
          onValueChange={setSoundProfile}
          placeholder="Sound profile"
          options={SOUND_OPTIONS}
        />
        <MobileSelect
          value={switchType}
          onValueChange={setSwitchType}
          placeholder="Switch type"
          options={SWITCH_TYPE_OPTIONS}
        />
        <MobileSelect
          value={feel}
          onValueChange={setFeel}
          placeholder="Feel / actuation force"
          options={FEEL_OPTIONS}
        />
        <MobileSelect
          value={volume}
          onValueChange={setVolume}
          placeholder="Volume preference"
          options={VOLUME_OPTIONS}
        />
        <Button className="w-full" onClick={handleGenerate}>
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Recommendations
        </Button>
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-3">
          {results.map((section) => {
            const Icon = ICONS[section.icon] || Layers;
            return (
              <div key={section.category} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold">{section.category}</h2>
                </div>
                <div className="space-y-1.5">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground mt-2 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-[10px] text-muted-foreground">{item.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {section.note && (
                  <p className="text-[10px] text-primary/70 mt-2 pt-2 border-t border-border">
                    {section.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}