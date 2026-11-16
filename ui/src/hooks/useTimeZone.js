import { useSyncExternalStore } from "react";

// The browser has no timezone-change event to subscribe to.
function subscribe() {
  return () => {};
}

function getBrowserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getServerTimeZone() {
  return "UTC";
}

export default function useTimeZone() {
  // React uses UTC for SSR and initial hydration, then reads the browser zone.
  return useSyncExternalStore(subscribe, getBrowserTimeZone, getServerTimeZone);
}
