import React from "react";
import { soundProfile, profileStyles } from "@/lib/soundProfile";

export default function SoundProfileBadge({ recording }) {
  const profile = soundProfile(recording);
  const style = profileStyles[profile] || profileStyles.thocky;

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${style.className}`}>
      {style.label}
    </span>
  );
}