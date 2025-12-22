/**
 * Responsive Design Utilities
 * Mobile-first responsive design helpers and breakpoint management
 */

import { useState, useEffect, useCallback } from 'react';

// Standard breakpoints (mobile-first)
export const breakpoints = {
  xs: 0,      // Extra small devices (phones)
  sm: 640,    // Small devices (large phones)
  md: 768,    // Medium devices (tablets)
  lg: 1024,   // Large devices (laptops)
  xl: 1280,   // Extra large devices (desktops)
  '2xl': 1536 // 2X large devices (large desktops)
} as const;

export type Breakpoint = keyof typeof breakpoints;

// Device detection
export const useDeviceType = () => {
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });

      if (width < breakpoints.md) {
        setDeviceType('mobile');
      } else if (width < breakpoints.lg) {
        setDeviceType('tablet');
      } else {
        setDeviceType('desktop');
      }
    };

    updateDeviceType();
    window.addEventListener('resize', updateDeviceType);
    
    return () => window.removeEventListener('resize', updateDeviceType);
  }, []);

  return { deviceType, screenSize };
};

// Breakpoint hooks
export const useBreakpoint = (breakpoint: Breakpoint): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const query = `(min-width: ${breakpoints[breakpoint]}px)`;
    const mediaQuery = window.matchMedia(query);
    
    setMatches(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, [breakpoint]);

  return matches;
};

// Multiple breakpoint hook
export const useBreakpoints = () => {
  const [currentBreakpoints, setCurrentBreakpoints] = useState<Record<Breakpoint, boolean>>({
    xs: true,
    sm: false,
    md: false,
    lg: false,
    xl: false,
    '2xl': false
  });

  useEffect(() => {
    const updateBreakpoints = () => {
      const width = window.innerWidth;
      
      setCurrentBreakpoints({
        xs: width >= breakpoints.xs,
        sm: width >= breakpoints.sm,
        md: width >= breakpoints.md,
        lg: width >= breakpoints.lg,
        xl: width >= breakpoints.xl,
        '2xl': width >= breakpoints['2xl']
      });
    };

    updateBreakpoints();
    window.addEventListener('resize', updateBreakpoints);
    
    return () => window.removeEventListener('resize', updateBreakpoints);
  }, []);

  return currentBreakpoints;
};

// Responsive value hook
export const useResponsiveValue = <T>(values: Partial<Record<Breakpoint, T>>): T | undefined => {
  const breakpoints = useBreakpoints();
  
  // Find the largest matching breakpoint
  const matchingBreakpoint = (['2xl', 'xl', 'lg', 'md', 'sm', 'xs'] as Breakpoint[])
    .find(bp => breakpoints[bp] && values[bp] !== undefined);
  
  return matchingBreakpoint ? values[matchingBreakpoint] : undefined;
};

// Touch device detection
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouchDevice;
};

// Orientation hook
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return orientation;
};

// Safe area insets (for notched devices)
export const useSafeAreaInsets = () => {
  const [insets, setInsets] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });

  useEffect(() => {
    const updateInsets = () => {
      const computedStyle = getComputedStyle(document.documentElement);
      
      setInsets({
        top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
        right: parseInt(computedStyle.getPropertyValue('--sar') || '0'),
        bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
        left: parseInt(computedStyle.getPropertyValue('--sal') || '0')
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    
    return () => window.removeEventListener('resize', updateInsets);
  }, []);

  return insets;
};

// Viewport height hook (handles mobile browser address bar)
export const useViewportHeight = () => {
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const updateHeight = () => {
      setViewportHeight(window.innerHeight);
      // Set CSS custom property for mobile viewport
      document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    
    return () => {
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
    };
  }, []);

  return viewportHeight;
};

// Responsive grid columns
export const useResponsiveColumns = () => {
  const { deviceType } = useDeviceType();
  
  return useCallback((mobileColumns: number = 1, tabletColumns: number = 2, desktopColumns: number = 3) => {
    switch (deviceType) {
      case 'mobile':
        return mobileColumns;
      case 'tablet':
        return tabletColumns;
      case 'desktop':
        return desktopColumns;
      default:
        return mobileColumns;
    }
  }, [deviceType]);
};

// CSS class helpers
export const getResponsiveClasses = (
  classes: Partial<Record<Breakpoint, string>>,
  currentBreakpoints: Record<Breakpoint, boolean>
): string => {
  const activeClasses: string[] = [];
  
  (['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as Breakpoint[]).forEach(bp => {
    if (currentBreakpoints[bp] && classes[bp]) {
      activeClasses.push(classes[bp]!);
    }
  });
  
  return activeClasses.join(' ');
};

// Mobile-specific utilities
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

// Responsive font size calculator
export const getResponsiveFontSize = (baseSize: number, screenWidth: number): number => {
  const minSize = baseSize * 0.8;
  const maxSize = baseSize * 1.2;
  const minWidth = breakpoints.xs;
  const maxWidth = breakpoints.xl;
  
  if (screenWidth <= minWidth) return minSize;
  if (screenWidth >= maxWidth) return maxSize;
  
  const ratio = (screenWidth - minWidth) / (maxWidth - minWidth);
  return minSize + (maxSize - minSize) * ratio;
};

// Container max-width helper
export const getContainerMaxWidth = (breakpoint: Breakpoint): string => {
  const maxWidths = {
    xs: '100%',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px'
  };
  
  return maxWidths[breakpoint];
};

// Responsive spacing
export const getResponsiveSpacing = (
  mobile: number,
  tablet?: number,
  desktop?: number
) => {
  const { deviceType } = useDeviceType();
  
  switch (deviceType) {
    case 'mobile':
      return mobile;
    case 'tablet':
      return tablet || mobile * 1.5;
    case 'desktop':
      return desktop || mobile * 2;
    default:
      return mobile;
  }
};
