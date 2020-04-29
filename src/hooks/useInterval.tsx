// vendor imports
import React from "react";

/**
 * Convenience hook for subscribing a function to an interval. This hook manages subscribing/unsubscribing the
 * function on creation and cleanup for you.
 *
 * The handler argument MUST MUST MUST be identity-stable, because if there is a change in identity/value
 * of the handler _or_ the timeout arguments, the current interval will be cleared and restarted. So, if your handler
 * function changes every render, then your interval will restart every render (which is probably not ideal).
 *
 * @param handler Handler function. Unlike `window.setInterval`, this does not accept arguments.
 * @param timeout Timeout value in milliseconds.
 */
export default function useInterval(
  handler: () => void,
  timeout: number,
): void {
  // Ref to contain the identity of the current running interval
  const interval = React.useRef<number | null>(null);

  // Effect to subscribe to intervals
  React.useEffect(() => {
    // If a handler is given, start the interval
    if (handler) {
      interval.current = setInterval(handler, timeout);
    }

    // Return a cleanup function for cancelling the running interval
    return () => {
      if (interval.current !== null) {
        clearInterval(interval.current);
        interval.current = null;
      }
    };
  }, [handler, timeout]);
}
