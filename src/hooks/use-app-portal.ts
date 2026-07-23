'use client';

import { useEffect, useState } from 'react';

export const APP_PORTAL_ROOT_ID = 'app-portal-root';

/** جذر الـ portals داخل إطار الموبايل (Sheets / Dialogs) */
export function useAppPortalContainer() {
  const [container, setContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setContainer(document.getElementById(APP_PORTAL_ROOT_ID));
  }, []);

  return container;
}
