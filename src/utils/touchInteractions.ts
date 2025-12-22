/**
 * Touch Interaction Utilities
 * Provides touch gestures, swipe detection, and mobile-specific interactions
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export interface TouchPoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface SwipeGesture {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  duration: number;
}

export interface PinchGesture {
  scale: number;
  center: TouchPoint;
}

// Swipe detection hook
export const useSwipeGesture = (
  onSwipe?: (gesture: SwipeGesture) => void,
  options: {
    minDistance?: number;
    maxTime?: number;
    threshold?: number;
  } = {}
) => {
  const {
    minDistance = 50,
    maxTime = 500,
    threshold = 10
  } = options;

  const touchStart = useRef<TouchPoint | null>(null);
  const touchEnd = useRef<TouchPoint | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    touchEnd.current = null;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    touchEnd.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const deltaX = touchEnd.current.x - touchStart.current.x;
    const deltaY = touchEnd.current.y - touchStart.current.y;
    const duration = touchEnd.current.timestamp - touchStart.current.timestamp;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    if (distance < minDistance || duration > maxTime) return;

    const velocity = distance / duration;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    let direction: SwipeGesture['direction'];
    
    if (absX > absY) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    const gesture: SwipeGesture = {
      direction,
      distance,
      velocity,
      duration
    };

    onSwipe?.(gesture);
  }, [onSwipe, minDistance, maxTime]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};

// Long press detection hook
export const useLongPress = (
  onLongPress: () => void,
  delay: number = 500
) => {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const start = useCallback(() => {
    setIsPressed(true);
    timeoutRef.current = setTimeout(() => {
      onLongPress();
    }, delay);
  }, [onLongPress, delay]);

  const stop = useCallback(() => {
    setIsPressed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    isPressed
  };
};

// Pull to refresh hook
export const usePullToRefresh = (
  onRefresh: () => Promise<void>,
  options: {
    threshold?: number;
    resistance?: number;
  } = {}
) => {
  const {
    threshold = 80,
    resistance = 2.5
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (window.scrollY > 0 || isRefreshing) return;

    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      e.preventDefault();
      const distance = Math.min(diff / resistance, threshold * 1.5);
      setPullDistance(distance);
    }
  }, [isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    isRefreshing,
    pullDistance,
    shouldRefresh: pullDistance >= threshold
  };
};

// Pinch zoom detection hook
export const usePinchZoom = (
  onPinch?: (gesture: PinchGesture) => void
) => {
  const initialDistance = useRef(0);
  const initialScale = useRef(1);

  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getCenter = (touch1: Touch, touch2: Touch): TouchPoint => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
      timestamp: Date.now()
    };
  };

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches[0], e.touches[1]);
      initialScale.current = 1;
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current > 0) {
      e.preventDefault();
      
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialDistance.current;
      const center = getCenter(e.touches[0], e.touches[1]);

      const gesture: PinchGesture = {
        scale,
        center
      };

      onPinch?.(gesture);
    }
  }, [onPinch]);

  const handleTouchEnd = useCallback(() => {
    initialDistance.current = 0;
    initialScale.current = 1;
  }, []);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};

// Tap detection hook (distinguishes from scroll)
export const useTap = (
  onTap: () => void,
  options: {
    maxMoveDistance?: number;
    maxDuration?: number;
  } = {}
) => {
  const {
    maxMoveDistance = 10,
    maxDuration = 200
  } = options;

  const startPoint = useRef<TouchPoint | null>(null);
  const moved = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    startPoint.current = {
      x: touch.clientX,
      y: touch.clientY,
      timestamp: Date.now()
    };
    moved.current = false;
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!startPoint.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPoint.current.x;
    const deltaY = touch.clientY - startPoint.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > maxMoveDistance) {
      moved.current = true;
    }
  }, [maxMoveDistance]);

  const handleTouchEnd = useCallback(() => {
    if (!startPoint.current || moved.current) return;

    const duration = Date.now() - startPoint.current.timestamp;
    
    if (duration <= maxDuration) {
      onTap();
    }
  }, [onTap, maxDuration]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd
  };
};

// Haptic feedback utility
export const useHapticFeedback = () => {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  const lightTap = useCallback(() => vibrate(10), [vibrate]);
  const mediumTap = useCallback(() => vibrate(20), [vibrate]);
  const heavyTap = useCallback(() => vibrate(50), [vibrate]);
  const doubleTap = useCallback(() => vibrate([10, 50, 10]), [vibrate]);
  const success = useCallback(() => vibrate([10, 100, 10]), [vibrate]);
  const error = useCallback(() => vibrate([50, 100, 50, 100, 50]), [vibrate]);

  return {
    vibrate,
    lightTap,
    mediumTap,
    heavyTap,
    doubleTap,
    success,
    error
  };
};

// Touch-friendly button enhancement
export const useTouchButton = (
  onClick: () => void,
  options: {
    hapticFeedback?: boolean;
    preventDoubleClick?: boolean;
    debounceMs?: number;
  } = {}
) => {
  const {
    hapticFeedback = true,
    preventDoubleClick = true,
    debounceMs = 300
  } = options;

  const [isPressed, setIsPressed] = useState(false);
  const lastClickTime = useRef(0);
  const { lightTap } = useHapticFeedback();

  const handlePress = useCallback(() => {
    setIsPressed(true);
    if (hapticFeedback) {
      lightTap();
    }
  }, [hapticFeedback, lightTap]);

  const handleRelease = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    const now = Date.now();
    
    if (preventDoubleClick && now - lastClickTime.current < debounceMs) {
      return;
    }
    
    lastClickTime.current = now;
    onClick();
  }, [onClick, preventDoubleClick, debounceMs]);

  return {
    onTouchStart: handlePress,
    onTouchEnd: handleRelease,
    onTouchCancel: handleRelease,
    onMouseDown: handlePress,
    onMouseUp: handleRelease,
    onMouseLeave: handleRelease,
    onClick: handleClick,
    isPressed,
    className: isPressed ? 'pressed' : ''
  };
};
