import { useEffect, useRef } from "react";

export function isMobile() {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}

export function useWASD() {
  const keysRef = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const down = (e: KeyboardEvent) => (keysRef.current[e.code] = true);
    const up = (e: KeyboardEvent) => (keysRef.current[e.code] = false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);
  const is = (code: string) => !!keysRef.current[code];
  return {
    forward: () => is("KeyW") || is("ArrowUp"),
    backward: () => is("KeyS") || is("ArrowDown"),
    left: () => is("KeyA") || is("ArrowLeft"),
    right: () => is("KeyD") || is("ArrowRight"),
    sprint: () => is("ShiftLeft") || is("ShiftRight"),
    up: () => is("KeyE") || is("Space"),
    down: () => is("KeyQ") || is("ControlLeft"),
  };
}