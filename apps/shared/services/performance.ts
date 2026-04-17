/**
 * Simple utility to detect if the device should use "Lite Mode"
 * (e.g., low-end mobile devices, Android WebViews)
 */
export const PerformanceSettings = {
    shouldUseLiteMode: () => {
        if (typeof window === 'undefined') return false;
        
        const ua = navigator.userAgent.toLowerCase();
        const isAndroid = ua.includes('android');
        const isIOS = /ipad|iphone|ipod/.test(ua);


        // If on Android, we default to Lite Mode for better stability in WebView
        return isAndroid;
    },

    getGlassClass: () => {
        return PerformanceSettings.shouldUseLiteMode() ? 'glass-lite' : 'glass';
    }
};
