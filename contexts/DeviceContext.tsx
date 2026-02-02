"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  DeviceInfo,
  getDeviceInfo,
  getDeviceClasses,
  getDeviceRecommendations,
  getDeviceOptimizations,
  getOptimalViewport,
} from '@/lib/deviceDetection';

interface DeviceContextValue {
  device: DeviceInfo;
  classes: string;
  recommendations: ReturnType<typeof getDeviceRecommendations>;
  optimizations: ReturnType<typeof getDeviceOptimizations>;
  viewport: ReturnType<typeof getOptimalViewport>;
  isReady: boolean;
}

const DeviceContext = createContext<DeviceContextValue | null>(null);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initial device detection
    const device = getDeviceInfo();
    setDeviceInfo(device);
    setIsReady(true);

    // Apply device classes to document
    if (typeof document !== 'undefined') {
      const classes = getDeviceClasses(device);
      document.documentElement.className = classes;
    }

    // Listen for orientation/resize changes
    const handleResize = () => {
      const updatedDevice = getDeviceInfo();
      setDeviceInfo(updatedDevice);

      if (typeof document !== 'undefined') {
        const classes = getDeviceClasses(updatedDevice);
        document.documentElement.className = classes;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  if (!isReady || !deviceInfo) {
    // Return a default/loading state
    return <>{children}</>;
  }

  const value: DeviceContextValue = {
    device: deviceInfo,
    classes: getDeviceClasses(deviceInfo),
    recommendations: getDeviceRecommendations(deviceInfo),
    optimizations: getDeviceOptimizations(deviceInfo),
    viewport: getOptimalViewport(deviceInfo),
    isReady: true,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

/**
 * Hook to access device information
 *
 * @example
 * const { device, recommendations } = useDevice();
 * if (recommendations.useSwipeGestures) {
 *   // Enable swipe gestures
 * }
 */
export function useDevice(): DeviceContextValue {
  const context = useContext(DeviceContext);

  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }

  return context;
}

/**
 * Hook to check if specific device type
 */
export function useIsMobile(): boolean {
  const { device } = useDevice();
  return device.type === 'mobile';
}

export function useIsTablet(): boolean {
  const { device } = useDevice();
  return device.type === 'tablet';
}

export function useIsDesktop(): boolean {
  const { device } = useDevice();
  return device.type === 'desktop';
}

export function useIsTouchDevice(): boolean {
  const { device } = useDevice();
  return device.isTouchDevice;
}

/**
 * Hook to get device-specific styling
 */
export function useDeviceStyles() {
  const { viewport, device } = useDevice();

  return {
    maxWidth: `${viewport.maxWidth}px`,
    fontSize: `${viewport.fontSize}px`,
    spacing: `${viewport.spacing}px`,
    bottomNavHeight: `${viewport.bottomNavHeight}px`,
    isMobile: device.type === 'mobile',
    isTablet: device.type === 'tablet',
    isDesktop: device.type === 'desktop',
  };
}
