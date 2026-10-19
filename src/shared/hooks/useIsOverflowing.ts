import React from "react";

/**
 * Whether an element's content is taller than the element itself. Attach the
 * returned callback ref to the clipping element. Stays `false` where
 * `ResizeObserver` is unavailable.
 */
export default function useIsOverflowing<T extends HTMLElement>() {
  const [node, setNode] = React.useState<T | null>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => {
    if (!node || typeof ResizeObserver === "undefined") {
      setIsOverflowing(false);
      return;
    }
    const update = () => setIsOverflowing(node.scrollHeight > node.clientHeight + 1);
    const observer = new ResizeObserver(update);
    observer.observe(node);
    for (const child of Array.from(node.children)) observer.observe(child);
    update();
    return () => observer.disconnect();
  }, [node]);

  return [setNode, isOverflowing] as const;
}
