import React, { useRef } from 'react';
import { Animated, TouchableOpacity } from 'react-native';

/**
 * Componente de toque suave com física de mola (Spring Animation)
 * Proporciona feedback tátil suave em botões, cards e abas.
 */
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export default function AnimatedPressable({
  children,
  onPress,
  style,
  activeOpacity = 0.85,
  scaleTo = 0.96,
  disabled = false,
  ...rest
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleTo,
      useNativeDriver: true,
      friction: 7,
      tension: 150
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100
    }).start();
  };

  return (
    <AnimatedTouchable
      activeOpacity={activeOpacity}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[style, { transform: [{ scale: scaleAnim }] }]}
      {...rest}
    >
      {children}
    </AnimatedTouchable>
  );
}

