// Public Shiprocket tracking page for a courier AWB. Safe to use in the browser.
export const trackingUrl = (awb: string) => `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
