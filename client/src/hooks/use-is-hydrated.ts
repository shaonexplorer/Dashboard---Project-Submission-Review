"use client";

import { useEffect, useState } from "react";

/**
 * Reports whether the component has mounted in the browser.
 *
 * The session lives in an httpOnly cookie: the server cannot read it, and the
 * browser cannot know whether it is present before hydration. Any UI that
 * depends on the session therefore has to render the same markup on both
 * sides of the hydration boundary — this hook is the point where it becomes
 * safe to branch on session state.
 */
export function useIsHydrated(): boolean {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}
