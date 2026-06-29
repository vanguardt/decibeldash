import React, { useState, useEffect } from "react";
import { Drawer } from "vaul";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, ChevronDown } from "lucide-react";

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}

const triggerClass =
  "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1";

export default function MobileSelect({
  value,
  onValueChange,
  options,
  placeholder,
  className,
}) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${triggerClass} ${className || ""}`}
      >
        <span className={selected ? "" : "text-muted-foreground"}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>
      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content className="max-h-[70vh]">
          <div className="mx-auto w-full max-w-lg">
            <div className="px-4 py-3 border-b border-border text-sm font-medium text-center">
              {placeholder}
            </div>
            <div className="py-1 overflow-y-auto max-h-[55vh]">
              {options.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onValueChange(o.value);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between w-full px-4 py-3 text-sm text-left hover:bg-accent transition-colors"
                >
                  {o.label}
                  {o.value === value && (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Drawer.Content>
      </Drawer>
    </>
  );
}