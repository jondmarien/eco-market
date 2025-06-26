import { Theme } from 'react-native-elements';

export const colors = {
  primary: '#22c55e', // Green-500 (eco-friendly)
  primaryDark: '#16a34a', // Green-600
  primaryLight: '#86efac', // Green-300
  secondary: '#3b82f6', // Blue-500
  secondaryDark: '#2563eb', // Blue-600
  accent: '#f59e0b', // Amber-500
  
  // Status colors
  success: '#10b981', // Emerald-500
  warning: '#f59e0b', // Amber-500
  error: '#ef4444', // Red-500
  info: '#3b82f6', // Blue-500
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  grey: '#6b7280', // Gray-500
  greyLight: '#f3f4f6', // Gray-100
  greyDark: '#374151', // Gray-700
  
  // Background colors
  background: '#ffffff',
  backgroundSecondary: '#f9fafb', // Gray-50
  backgroundDark: '#111827', // Gray-900
  
  // Text colors
  text: '#111827', // Gray-900
  textSecondary: '#6b7280', // Gray-500
  textLight: '#9ca3af', // Gray-400
  textDark: '#000000',
  
  // Card colors
  card: '#ffffff',
  cardBorder: '#e5e7eb', // Gray-200
  
  // Sustainability colors
  ecoGreen: '#22c55e',
  ecoAmber: '#f59e0b',
  ecoRed: '#ef4444',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const shadows = {
  small: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const theme: Theme = {
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    text: colors.text,
    grey0: colors.white,
    grey1: colors.greyLight,
    grey2: colors.grey,
    grey3: colors.greyDark,
    grey4: colors.black,
    searchBg: colors.backgroundSecondary,
    platform: {
      ios: {
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
      },
      android: {
        primary: colors.primary,
        secondary: colors.secondary,
        success: colors.success,
        warning: colors.warning,
        error: colors.error,
      },
    },
  },
  Button: {
    buttonStyle: {
      borderRadius: borderRadius.md,
      paddingVertical: spacing.md,
    },
    titleStyle: {
      ...typography.button,
    },
  },
  Input: {
    inputStyle: {
      ...typography.body,
    },
    inputContainerStyle: {
      borderRadius: borderRadius.md,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      paddingHorizontal: spacing.md,
    },
  },
  Card: {
    containerStyle: {
      borderRadius: borderRadius.lg,
      marginBottom: spacing.md,
      ...shadows.medium,
    },
  },
  Header: {
    backgroundColor: colors.primary,
    centerComponent: {
      style: {
        color: colors.white,
        ...typography.h3,
      },
    },
  },
};

export default {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  theme,
};
