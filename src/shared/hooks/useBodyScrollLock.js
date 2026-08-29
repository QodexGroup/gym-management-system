import { useEffect } from 'react';

/**
 * Freezes background scrolling while an overlay is open.
 *
 * `overflow: hidden` on <body> is ignored by iOS Safari, which keeps scrolling
 * and rubber-banding the page behind the overlay. Pinning the body with
 * `position: fixed` at its current offset is the reliable cross-platform lock;
 * the offset is restored on release so the page does not jump to the top.
 *
 * @param {boolean} isLocked - Lock while true, release when false or unmounted.
 * @returns {void}
 */
export const useBodyScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return;

    const { body } = document;
    const scrollY = window.scrollY;
    const previous = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflowY: body.style.overflowY,
      paddingRight: body.style.paddingRight,
    };

    // Keep the page behind from shifting when its desktop scrollbar disappears.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflowY = 'hidden';
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    return () => {
      body.style.position = previous.position;
      body.style.top = previous.top;
      body.style.left = previous.left;
      body.style.right = previous.right;
      body.style.width = previous.width;
      body.style.overflowY = previous.overflowY;
      body.style.paddingRight = previous.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
};

export default useBodyScrollLock;
