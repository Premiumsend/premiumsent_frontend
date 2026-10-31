import { useCallback } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";

let current = 0;

/**
 * Ekran almashishini View Transitions bilan silliq qiladi.
 * kind: push, back, tab-next, tab-prev, fade. Eski klientda oddiy almashadi (pn.css'dagi fallback).
 */
export function runTransition(kind, update) {
  const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) {
    update();
    return;
  }
  const root = document.documentElement;
  const id = ++current;
  root.dataset.nav = kind;
  const transition = document.startViewTransition(() => flushSync(update));
  transition.finished.catch(() => {}).finally(() => {
    if (id === current) delete root.dataset.nav;
  });
}

export function useGo() {
  const navigate = useNavigate();
  return useCallback((path, kind = "push") => runTransition(kind, () => navigate(path)), [navigate]);
}
