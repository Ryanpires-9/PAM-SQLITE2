import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';

export default function Toast() {
  const insets = useSafeAreaInsets();
  const { toast, hideToast } = useToast();

  const slideAnim = useRef(new Animated.Value(-120)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 70,
          friction: 9
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 220,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [toast.visible]);

  if (!toast.visible && slideAnim._value === -120) {
    return null;
  }

  const getConfig = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          iconColor: '#10b981',
          bgBorder: '#10b981',
          badgeBg: 'rgba(16, 185, 129, 0.18)'
        };
      case 'error':
        return {
          icon: 'alert-circle',
          iconColor: '#ef4444',
          bgBorder: '#ef4444',
          badgeBg: 'rgba(239, 68, 68, 0.18)'
        };
      case 'warning':
        return {
          icon: 'warning',
          iconColor: '#f59e0b',
          bgBorder: '#f59e0b',
          badgeBg: 'rgba(245, 158, 11, 0.18)'
        };
      default:
        return {
          icon: 'information-circle',
          iconColor: '#38bdf8',
          bgBorder: '#0284c7',
          badgeBg: 'rgba(56, 189, 248, 0.18)'
        };
    }
  };

  const config = getConfig();

  return (
    <Animated.View
      pointerEvents={toast.visible ? 'auto' : 'none'}
      style={[
        styles.wrapper,
        {
          top: insets.top + (Platform.OS === 'ios' ? 8 : 14),
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      <TouchableOpacity
        style={[
          styles.container,
          {
            borderColor: config.bgBorder
          }
        ]}
        activeOpacity={0.9}
        onPress={hideToast}
      >
        <View style={[styles.iconBox, { backgroundColor: config.badgeBg }]}>
          <Ionicons name={config.icon} size={24} color={config.iconColor} />
        </View>

        <View style={styles.textWrap}>
          {toast.title ? <Text style={styles.titleText}>{toast.title}</Text> : null}
          <Text style={styles.messageText} numberOfLines={2}>
            {toast.message}
          </Text>
        </View>

        <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color="#94a3b8" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    elevation: 99999
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  textWrap: {
    flex: 1
  },
  titleText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2
  },
  messageText: {
    color: '#cbd5e1',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16
  },
  closeBtn: {
    padding: 6,
    marginLeft: 8
  }
});

