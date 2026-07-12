import React from "react";
import { soundProfile, profileStyles } from "@/lib/soundProfile";

export default function SoundProfileBadge({ recording }) {
  const profile = soundProfile(recording);
  const style = profileStyles[profile] || profileStyles.thocky;

  return (
    <span className={`shrink-0 inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full border ${style.className}`}>
      {style.label}
    </span>
  );
}