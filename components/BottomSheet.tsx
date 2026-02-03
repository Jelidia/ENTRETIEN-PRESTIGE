"use client";

import { useEffect, useId, useRef } from "react";
import clsx from "clsx";

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: "60%" | "75%" | "90%"; // Configurable height
};

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = "75%",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const titleId = useId();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      if (diff > 0 && sheetRef.current) {
        sheetRef.current.style.transform = `translateY(${diff}px)`;
      }
    };

    const handleTouchEnd = () => {
      const diff = currentY.current - startY.current;

      if (diff > 150) {
        // Swipe down threshold
        onClose();
      } else if (sheetRef.current) {
        sheetRef.current.style.transform = "translateY(0)";
      }
    };

    const sheet = sheetRef.current;
    if (sheet) {
      sheet.addEventListener("touchstart", handleTouchStart);
      sheet.addEventListener("touchmove", handleTouchMove);
      sheet.addEventListener("touchend", handleTouchEnd);

      return () => {
        sheet.removeEventListener("touchstart", handleTouchStart);
        sheet.removeEventListener("touchmove", handleTouchMove);
        sheet.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      sheetRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="bottom-sheet-backdrop"
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.4)",
          backdropFilter: "blur(6px)",
          zIndex: 100,
        }}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={clsx("bottom-sheet", isOpen && "bottom-sheet-open")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : "Fenetre de dialogue"}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height,
          maxWidth: "640px",
          margin: "0 auto",
          background: "var(--surface)",
          borderRadius: "var(--radius-lg) var(--radius-lg) 0 0",
          boxShadow: "0 -16px 40px rgba(15, 23, 42, 0.12)",
          zIndex: 101,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: "40px",
            height: "4px",
            background: "var(--line)",
            borderRadius: "999px",
            margin: "12px auto 8px",
          }}
        />

        {/* Header */}
        {title && (
          <div
            style={{
              padding: "16px 24px",
              borderBottom: "1px solid var(--line)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 id={titleId} className="card-title" style={{ margin: 0 }}>
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="button-ghost"
                style={{ padding: "8px", minWidth: "auto" }}
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
