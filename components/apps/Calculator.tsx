"use client";

import React, { useState, useEffect } from "react";
import { useWindows } from "@/context/WindowContext";
import { Delete, RotateCcw } from "lucide-react";

export const Calculator: React.FC = () => {
  const { windows, activeWindowId } = useWindows();
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [resetOnNextInput, setResetOnNextInput] = useState(false);

  // Find if this instance of calculator is the active window
  const calcWindow = windows.find((w) => w.type === "calculator");
  const isActive = calcWindow && activeWindowId === calcWindow.id;

  const handleInput = (char: string) => {
    if (resetOnNextInput) {
      setDisplay(char);
      setResetOnNextInput(false);
      return;
    }

    if (display === "0" && char !== ".") {
      setDisplay(char);
    } else {
      // Prevent multiple decimals in a single number
      if (char === "." && display.includes(".")) return;
      setDisplay((prev) => prev + char);
    }
  };

  const handleOperator = (op: string) => {
    setEquation(`${display} ${op} `);
    setResetOnNextInput(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setResetOnNextInput(false);
  };

  const handleBackspace = () => {
    if (resetOnNextInput) {
      setEquation("");
      setResetOnNextInput(false);
      return;
    }
    setDisplay((prev) => (prev.length > 1 ? prev.slice(0, -1) : "0"));
  };

  const handleCalculate = () => {
    if (!equation) return;

    const fullEquation = equation + display;
    try {
      // Safe evaluation using Function constructor (avoid eval)
      // Clean up equation characters
      const sanitized = fullEquation.replace(/×/g, "*").replace(/÷/g, "/");
      
      // Basic expression validator (only digits, operators, space, and dots allowed)
      if (!/^[\d.+\-*/\s]+$/.test(sanitized)) {
        throw new Error("Invalid Equation");
      }

      const calcResult = new Function(`return (${sanitized})`)();
      
      // Format output nicely
      if (calcResult === Infinity || isNaN(calcResult)) {
        setDisplay("Error");
      } else {
        const formatted = Number(calcResult.toFixed(8)).toString(); // Limit decimal precision
        setDisplay(formatted);
      }
      setEquation("");
      setResetOnNextInput(true);
    } catch {
      setDisplay("Error");
      setEquation("");
      setResetOnNextInput(true);
    }
  };

  const handlePercentage = () => {
    try {
      const val = parseFloat(display) / 100;
      setDisplay(val.toString());
    } catch {
      setDisplay("Error");
    }
  };

  // Keyboard support: listen only if this is the active window
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const { key } = e;

      if (key >= "0" && key <= "9") {
        handleInput(key);
      } else if (key === ".") {
        handleInput(".");
      } else if (key === "+" || key === "-") {
        handleOperator(key);
      } else if (key === "*") {
        handleOperator("×");
      } else if (key === "/") {
        handleOperator("÷");
      } else if (key === "Enter" || key === "=") {
        e.preventDefault();
        handleCalculate();
      } else if (key === "Backspace") {
        handleBackspace();
      } else if (key === "Escape" || key.toLowerCase() === "c") {
        handleClear();
      } else if (key === "%") {
        handlePercentage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, display, equation, resetOnNextInput]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-[#f3f4f6] to-[#e2e5e9] dark:from-[#1d1e2c] dark:to-[#131420] text-black dark:text-white p-4 font-sans justify-between select-none">
      {/* Screen */}
      <div className="flex flex-col justify-end items-end h-20 bg-white/60 dark:bg-black/35 border border-black/5 dark:border-white/10 rounded-2xl px-4 py-2.5 mb-4 shadow-[inset_0_2px_5px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_2.5px_8px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <span className="text-xs opacity-50 h-5 font-mono truncate w-full text-right leading-none">
          {equation}
        </span>
        <span className="text-2xl font-bold tracking-tight font-mono truncate w-full text-right leading-tight">
          {display}
        </span>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-4 gap-2.5 flex-1">
        {/* Row 1 */}
        <CalcButton label="C" onClick={handleClear} variant="danger" />
        <CalcButton label={<Delete className="w-4 h-4" />} onClick={handleBackspace} variant="action" />
        <CalcButton label="%" onClick={handlePercentage} variant="action" />
        <CalcButton label="÷" onClick={() => handleOperator("÷")} variant="operator" />

        {/* Row 2 */}
        <CalcButton label="7" onClick={() => handleInput("7")} />
        <CalcButton label="8" onClick={() => handleInput("8")} />
        <CalcButton label="9" onClick={() => handleInput("9")} />
        <CalcButton label="×" onClick={() => handleOperator("×")} variant="operator" />

        {/* Row 3 */}
        <CalcButton label="4" onClick={() => handleInput("4")} />
        <CalcButton label="5" onClick={() => handleInput("5")} />
        <CalcButton label="6" onClick={() => handleInput("6")} />
        <CalcButton label="-" onClick={() => handleOperator("-")} variant="operator" />

        {/* Row 4 */}
        <CalcButton label="1" onClick={() => handleInput("1")} />
        <CalcButton label="2" onClick={() => handleInput("2")} />
        <CalcButton label="3" onClick={() => handleInput("3")} />
        <CalcButton label="+" onClick={() => handleOperator("+")} variant="operator" />

        {/* Row 5 */}
        <CalcButton label="0" onClick={() => handleInput("0")} span={2} />
        <CalcButton label="." onClick={() => handleInput(".")} />
        <CalcButton label="=" onClick={handleCalculate} variant="equal" />
      </div>
    </div>
  );
};

interface CalcButtonProps {
  label: React.ReactNode;
  onClick: () => void;
  variant?: "number" | "operator" | "action" | "equal" | "danger";
  span?: number;
}

const CalcButton: React.FC<CalcButtonProps> = ({ label, onClick, variant = "number", span = 1 }) => {
  const getStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-red-50/80 hover:bg-red-100 text-red-600 border border-red-200/70 dark:bg-[#3f191f] dark:hover:bg-[#4c1e25] dark:text-red-400 dark:border-[#5a1f26]/40 shadow-[0_1.5px_2px_rgba(0,0,0,0.04)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] dark:active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]";
      case "operator":
        return "bg-blue-50/80 hover:bg-blue-100 text-blue-600 border border-blue-200/70 dark:bg-[#1a2b4c] dark:hover:bg-[#20345c] dark:text-blue-300 dark:border-[#2b4475]/40 shadow-[0_1.5px_2px_rgba(0,0,0,0.04)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] dark:active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]";
      case "action":
        return "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200/80 dark:bg-[#2b2e3e] dark:hover:bg-[#34384c] dark:text-zinc-300 dark:border-[#3d425b]/50 shadow-[0_1.5px_2px_rgba(0,0,0,0.04)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)] dark:active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]";
      case "equal":
        return "bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white border border-blue-600/80 dark:border-blue-700 shadow-[0_2px_4px_rgba(59,130,246,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] active:shadow-[inset_0_2px_5px_rgba(0,0,0,0.35)] font-bold";
      default:
        // Number button
        return "bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200/80 dark:bg-[#252836] dark:hover:bg-[#2c3042] dark:text-zinc-100 dark:border-[#31364a]/85 shadow-[0_1.5px_2px_rgba(0,0,0,0.03),inset_0_1px_0_rgba(255,255,255,0.85)] dark:shadow-[0_1.5px_2px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.05)] active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)] dark:active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.35)]";
    }
  };

  return (
    <button
      onClick={onClick}
      className={`h-full flex items-center justify-center rounded-xl text-sm transition-all focus:outline-none cursor-default font-semibold active:translate-y-[1px] active:filter active:brightness-[0.98] ${getStyles()} ${
        span === 2 ? "col-span-2" : ""
      }`}
    >
      {label}
    </button>
  );
};
