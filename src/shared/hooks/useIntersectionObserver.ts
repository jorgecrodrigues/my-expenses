import React from "react";

export interface useIntersectionReturnValue<T> {
  ref: React.RefCallback<T | null>;
  entry: IntersectionObserverEntry | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function useIntersectionObserver<T extends HTMLElement = any>(
  options?: IntersectionObserverInit
): useIntersectionReturnValue<T> {
  const { root, rootMargin, threshold } = options || {};
  const [entry, setEntry] = React.useState<IntersectionObserverEntry | null>(
    null
  );

  const observer = React.useRef<IntersectionObserver | null>(null);

  const ref: React.RefCallback<T | null> = React.useCallback(
    (node) => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }

      if (node === null) {
        setEntry(null);
        return;
      }

      observer.current = new IntersectionObserver(
        ([newEntry]) => {
          setEntry(newEntry);
        },
        { root, rootMargin, threshold }
      );

      observer.current.observe(node);
    },
    [root, rootMargin, threshold]
  );

  React.useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
        observer.current = null;
      }
    };
  }, []);
  return { ref, entry };
}
