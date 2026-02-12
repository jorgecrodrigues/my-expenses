import React from "react";

const SIDEBAR_STATE_KEY = "__sidebar_state__";

export type SidebarState = "expanded" | "collapsed";

export function useSidebarState() {
  // Function to update the sidebar state in localStorage and notify other tabs
  const setSidebarState = (newState: SidebarState) => {
    window.localStorage.setItem(SIDEBAR_STATE_KEY, newState);
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: SIDEBAR_STATE_KEY,
        newValue: newState,
      }),
    );
  };

  // Initialize the sidebar state from localStorage on the first render
  const getSnapshot = (): SidebarState =>
    (localStorage.getItem(SIDEBAR_STATE_KEY) as SidebarState) || null;

  // Subscribe to storage events to update the sidebar state across tabs
  const subscriber = (callback: () => void) => {
    window.addEventListener("storage", callback);
    return () => window.removeEventListener("storage", callback);
  };

  // Use useSyncExternalStore to manage the sidebar state across tabs
  const sidebarState = React.useSyncExternalStore(subscriber, getSnapshot);

  return [sidebarState, setSidebarState] as const;
}
