import React, { useState } from "react";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AudioDownloadButton({ url, name, className }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const handle = async (e) => {
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      const safe = (name || "recording").replace(/[^a-z0-9-_ ]/gi, "").trim() || "recording";
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `${safe}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objUrl), 2000);
    } catch {
      toast({ title: "Couldn't download audio", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handle}
      disabled={busy}
      className={`flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-accent transition-colors shrink-0 ${className || ""}`}
      aria-label="Download audio"
    >
      <Download className="w-3.5 h-3.5" />
    </button>
  );
}