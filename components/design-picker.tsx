"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DESIGN_STORAGE_KEY, designs, isDesignId, type DesignId } from "@/lib/designs";

function applyDesign(id: DesignId) {
  document.documentElement.setAttribute("data-design", id);
  localStorage.setItem(DESIGN_STORAGE_KEY, id);
}

export function DesignPicker() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<DesignId>("shelf");
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const saved = document.documentElement.getAttribute("data-design");
    if (isDesignId(saved)) setCurrent(saved);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointer(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function choose(id: DesignId) {
    applyDesign(id);
    setCurrent(id);
    setOpen(false);
  }

  return (
    <div className="design-picker" ref={rootRef}>
      <button
        type="button"
        className="chip chip-idle design-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
          <rect x="1" y="1" width="6" height="6" rx="1" fill="currentColor" />
          <rect x="9" y="1" width="6" height="6" rx="1" fill="currentColor" opacity="0.55" />
          <rect x="1" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.35" />
          <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" opacity="0.75" />
        </svg>
        Дизайн
      </button>
      {open ? (
        <div className="design-menu panel" id={menuId} role="listbox" aria-label="Оформление сайта">
          <p className="design-menu-label">Оформление</p>
          {designs.map((design) => {
            const selected = design.id === current;
            return (
              <button
                key={design.id}
                type="button"
                role="option"
                aria-selected={selected}
                className="design-option"
                onClick={() => choose(design.id)}
              >
                <span className="design-swatches" aria-hidden="true">
                  {design.swatches.map((color) => (
                    <i key={color} style={{ background: color }} />
                  ))}
                </span>
                <span>
                  <span className="design-option-name">
                    {design.name}
                    {selected ? <span className="design-check">Выбран</span> : null}
                  </span>
                  <span className="design-option-note">{design.note}</span>
                </span>
              </button>
            );
          })}
          <p className="design-menu-foot">Выбор сохранится в этом браузере</p>
        </div>
      ) : null}
    </div>
  );
}
