/**
 * Device Detection Utilities
 * Detects user device and provides optimal UI configuration
 */

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type DeviceOS = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';

export interface DeviceInfo {
  type: DeviceType;
  os: DeviceOS;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  userAgent: string;
  isLandscape: boolean;
  devicePixelRatio: number;
}

/**
 * Detect device type based on screen width and user agent
 */
export function getDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const width = window.innerWidth;
  const userAgent = navigator.userAgent.toLowerCase();

  // Mobile: < 768px or mobile user agent
  if (width < 768 || /mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
    return 'mobile';
  }

  // Tablet: 768px - 1024px or tablet user agent
  if (width < 1024 || /ipad|tablet|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * Detect operating system
 */
export function getDeviceOS(): DeviceOS {
  if (typeof window === 'undefined') return 'unknown';

  const userAgent = navigator.userAgent.toLowerCase();

  if (/iphone|ipad|ipod/i.test(userAgent)) return 'ios';
  if (/android/i.test(userAgent)) return 'android';
  if (/windows/i.test(userAgent)) return 'windows';
  if (/macintosh|mac os x/i.test(userAgent)) return 'macos';
  if (/linux/i.test(userAgent)) return 'linux';

  return 'unknown';
}

/**
 * Check if device supports touch
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

/**
 * Get comprehensive device information
 */
export function getDeviceInfo(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop',
      os: 'unknown',
      isTouchDevice: false,
      screenWidth: 1920,
      screenHeight: 1080,
      userAgent: '',
      isLandscape: true,
      devicePixelRatio: 1,
    };
  }

  return {
    type: getDeviceType(),
    os: getDeviceOS(),
    isTouchDevice: isTouchDevice(),
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    userAgent: navigator.userAgent,
    isLandscape: window.innerWidth > window.innerHeight,
    devicePixelRatio: window.devicePixelRatio || 1,
  };
}

/**
 * Get optimal viewport configuration for device
 */
export function getOptimalViewport(device: DeviceInfo): {
  maxWidth: number;
  fontSize: number;
  spacing: number;
  bottomNavHeight: number;
} {
  switch (device.type) {
    case 'mobile':
      return {
        maxWidth: 640, // Spec: mobile-first 640px max
        fontSize: device.screenWidth < 375 ? 14 : 16, // Smaller font on tiny screens
        spacing: 16,
        bottomNavHeight: 76, // Spec: 76px bottom nav
      };

    case 'tablet':
      return {
        maxWidth: 768,
        fontSize: 16,
        spacing: 20,
        bottomNavHeight: 80,
      };

    case 'desktop':
      // Even on desktop, maintain mobile-first approach (spec requirement)
      return {
        maxWidth: 640, // Spec: ALWAYS 640px max width
        fontSize: 16,
        spacing: 24,
        bottomNavHeight: 76,
      };
  }
}

/**
 * Get device-specific CSS classes
 */
export function getDeviceClasses(device: DeviceInfo): string {
  const classes: string[] = [];

  // Device type
  classes.push(`device-${device.type}`);

  // OS
  classes.push(`os-${device.os}`);

  // Touch support
  if (device.isTouchDevice) {
    classes.push('touch-device');
  } else {
    classes.push('no-touch');
  }

  // Orientation
  if (device.isLandscape) {
    classes.push('landscape');
  } else {
    classes.push('portrait');
  }

  // Pixel ratio (for retina displays)
  if (device.devicePixelRatio >= 2) {
    classes.push('retina');
  }

  // Screen size categories
  if (device.screenWidth < 375) {
    classes.push('screen-tiny'); // Very small phones
  } else if (device.screenWidth < 414) {
    classes.push('screen-small'); // Standard phones
  } else if (device.screenWidth < 768) {
    classes.push('screen-medium'); // Large phones / small tablets
  } else if (device.screenWidth < 1024) {
    classes.push('screen-large'); // Tablets
  } else {
    classes.push('screen-xlarge'); // Desktop
  }

  return classes.join(' ');
}

/**
 * Get device-specific recommendations
 */
export function getDeviceRecommendations(device: DeviceInfo): {
  useBottomNav: boolean;
  useSwipeGestures: boolean;
  enableAnimations: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  enableVibration: boolean;
} {
  const isMobile = device.type === 'mobile';
  const isTablet = device.type === 'tablet';
  const isTouch = device.isTouchDevice;
  const isLowEnd = device.devicePixelRatio < 2 || device.screenWidth < 375;

  return {
    useBottomNav: isMobile || isTablet, // Spec: Always use bottom nav (mobile-first)
    useSwipeGestures: isTouch,
    enableAnimations: !isLowEnd, // Disable on low-end devices
    imageQuality: isLowEnd ? 'low' : device.devicePixelRatio >= 2 ? 'high' : 'medium',
    enableVibration: isMobile && 'vibrate' in navigator,
  };
}

/**
 * Specific device optimizations
 */
export function getDeviceOptimizations(device: DeviceInfo): {
  useNativeScrolling: boolean;
  preventZoom: boolean;
  useSafeAreaInsets: boolean;
  enablePullToRefresh: boolean;
} {
  const isIOS = device.os === 'ios';
  const isAndroid = device.os === 'android';
  const isMobile = device.type === 'mobile';
  const isTouch = device.isTouchDevice;

  return {
    useNativeScrolling: isIOS || isAndroid, // Better performance on native
    preventZoom: isMobile, // Prevent double-tap zoom on mobile
    useSafeAreaInsets: isIOS, // Notch/home indicator support
    enablePullToRefresh: isMobile && isTouch,
  };
}
