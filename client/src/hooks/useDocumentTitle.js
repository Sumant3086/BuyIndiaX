import { useEffect } from 'react';

const DEFAULT_TITLE = 'BuyIndiaX — Your Trusted Indian Marketplace';

/**
 * Sets the document title and restores it on unmount.
 * Use on every page component for SEO + browser tab UX.
 */
export const useDocumentTitle = (title) => {
  useEffect(() => {
    const prev = document.title;
    document.title = title ? `${title} | BuyIndiaX` : DEFAULT_TITLE;
    return () => { document.title = prev; };
  }, [title]);
};

export default useDocumentTitle;
