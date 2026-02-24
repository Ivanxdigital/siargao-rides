"use client";

import { useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

type FlipTextMode = "card" | "inline";

interface FlipTextProps {
  word?: string;
  className?: string;
  mode?: FlipTextMode;
  showReplayButton?: boolean;
  charClassName?: string;
}

export default function FlipTextReveal({
  word = "DIGITAL REALITY",
  className = "",
  mode = "card",
  showReplayButton = true,
  charClassName,
}: FlipTextProps) {
  const [replayKey, setReplayKey] = useState(0);

  const replay = () => {
    setReplayKey((prev) => prev + 1);
  };

  if (mode === "inline") {
    return (
      <span className={cn("flip-inline", className)}>
        <span key={replayKey} className="inline-title" aria-label={word}>
          {word.split("").map((char, index) => (
            <span
              key={`${replayKey}-${index}`}
              className={cn("flip-inline-char flip-inline-char-inline", charClassName)}
              style={{ "--index": index } as CSSProperties}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </span>

        <style jsx>{`
          .flip-inline {
            display: inline-block;
            perspective: 800px;
          }

          .inline-title {
            display: inline-flex;
            flex-wrap: wrap;
            justify-content: center;
            line-height: inherit;
            font-size: inherit;
            font-weight: inherit;
            letter-spacing: inherit;
            text-transform: inherit;
            transform-style: preserve-3d;
            color: inherit;
          }

          .flip-inline :global(.flip-inline-char) {
            display: inline-block;
            transform-origin: bottom center;
            opacity: 0;
            transform: rotateX(-90deg) translateY(20px);
            animation: flip-up 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)
              forwards;
            animation-delay: calc(0.04s * var(--index));
            will-change: transform, opacity;
          }

          .flip-inline :global(.flip-inline-char-inline) {
            color: inherit;
          }

          @keyframes flip-up {
            0% {
              opacity: 0;
              transform: rotateX(-90deg) translateY(24px);
            }
            100% {
              opacity: 1;
              transform: rotateX(0deg) translateY(0);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .flip-inline :global(.flip-inline-char) {
              opacity: 1 !important;
              transform: none !important;
              animation: none !important;
            }
          }
        `}</style>
      </span>
    );
  }

  return (
    <div className={cn("flip-container", className)}>
      <div key={replayKey} className="text-wrapper">
        <h1 className="title" aria-label={word}>
          {word.split("").map((char, index) => (
            <span
              key={`${replayKey}-${index}`}
              className={cn("char", charClassName)}
              style={{ "--index": index } as CSSProperties}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h1>
      </div>

      {showReplayButton ? (
        <button className="replay-button" onClick={replay}>
          <span className="btn-text">Replay Action</span>
        </button>
      ) : null}

      <style jsx>{`
        .flip-container {
          --bg-color: #09090b;
          --text-color: #ffffff;
          --btn-bg: #27272a;
          --btn-text: #ffffff;
          --btn-border: #3f3f46;
          --btn-hover: #52525b;
        }

        @media (prefers-color-scheme: dark) {
          .flip-container {
            --bg-color: #ffffff;
            --text-color: #09090b;
            --btn-bg: #f4f4f5;
            --btn-text: #18181b;
            --btn-border: #e4e4e7;
            --btn-hover: #d4d4d8;
          }
        }

        :global(.dark) .flip-container {
          --bg-color: #ffffff;
          --text-color: #09090b;
          --btn-bg: #f4f4f5;
          --btn-text: #18181b;
          --btn-border: #e4e4e7;
          --btn-hover: #d4d4d8;
        }

        .flip-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4rem 2rem;
          background-color: var(--bg-color);
          color: var(--text-color);
          border-radius: 16px;
          overflow: hidden;
          min-height: 350px;
          width: 100%;
          transition:
            background-color 0.4s ease,
            color 0.4s ease;
          perspective: 800px;
          box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
        }

        .title {
          font-size: 4.5rem;
          font-weight: 900;
          margin: 0;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          line-height: 1;
          text-transform: uppercase;
          letter-spacing: -0.04em;
          transform-style: preserve-3d;
        }

        .char {
          display: inline-block;
          color: var(--text-color);
          transform-origin: bottom center;
          opacity: 0;
          transform: rotateX(-90deg) translateY(20px);
          animation: flip-up 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
          animation-delay: calc(0.06s * var(--index));
          will-change: transform, opacity;
        }

        .replay-button {
          margin-top: 3.5rem;
          padding: 0.8rem 2rem;
          background-color: var(--btn-bg);
          color: var(--btn-text);
          border: 1px solid var(--btn-border);
          border-radius: 99px;
          font-weight: 600;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s ease;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .replay-button:hover {
          background-color: var(--btn-hover);
          transform: scale(1.05);
        }

        .replay-button:active {
          transform: scale(0.95);
        }

        @keyframes flip-up {
          0% {
            opacity: 0;
            transform: rotateX(-90deg) translateY(40px);
          }
          100% {
            opacity: 1;
            transform: rotateX(0deg) translateY(0);
          }
        }

        @media (max-width: 768px) {
          .title {
            font-size: 2.5rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .char {
            opacity: 1 !important;
            transform: none !important;
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
