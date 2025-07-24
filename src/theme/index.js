import { extendTheme } from '@chakra-ui/react';

// Traveloka inspired colors and theme
const colors = {
  brand: {
    50: '#e6f2ff',
    100: '#cce5ff',
    200: '#99cbff',
    300: '#66b0ff',
    400: '#3396ff',
    500: '#007cff', // Primary Traveloka-like blue
    600: '#0063cc',
    700: '#004a99',
    800: '#003266',
    900: '#001933',
  },
  secondary: {
    50: '#f0f9ff',
    100: '#e1f3ff',
    200: '#b8e4ff',
    300: '#8fd5ff',
    400: '#66c6ff',
    500: '#3db7ff', // Secondary bright blue
    600: '#3192cc',
    700: '#246e99',
    800: '#184966',
    900: '#0c2533',
  },
  accent: {
    50: '#fff5e6',
    100: '#ffebcc',
    200: '#ffd699',
    300: '#ffc266',
    400: '#ffad33',
    500: '#ff9900', // Traveloka orange
    600: '#cc7a00',
    700: '#995c00',
    800: '#663d00',
    900: '#331f00',
  },
  success: {
    500: '#00aa46', // Traveloka green
  },
  warning: {
    500: '#ffb400', // Traveloka yellow
  },
  error: {
    500: '#e02020', // Traveloka red
  },
  neutral: {
    50: '#f7f7f7',
    100: '#e6e6e6',
    200: '#cccccc',
    300: '#b3b3b3',
    400: '#999999',
    500: '#808080',
    600: '#666666',
    700: '#4d4d4d',
    800: '#333333',
    900: '#1a1a1a',
  }
};

// Component style overrides to match Traveloka-like UI
const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'md',
    },
    variants: {
      primary: {
        bg: 'brand.500',
        color: 'white',
        _hover: { bg: 'brand.600' },
        _active: { bg: 'brand.700' },
      },
      secondary: {
        bg: 'accent.500',
        color: 'white',
        _hover: { bg: 'accent.600' },
        _active: { bg: 'accent.700' },
      },
      outline: {
        borderColor: 'brand.500',
        color: 'brand.500',
        _hover: { bg: 'brand.50' },
      },
      ghost: {
        color: 'brand.500',
        _hover: { bg: 'brand.50' },
      },
    },
    defaultProps: {
      variant: 'primary',
    },
  },
  Card: {
    baseStyle: {
      container: {
        borderRadius: 'lg',
        boxShadow: 'md',
        overflow: 'hidden',
      },
    },
  },
  Heading: {
    baseStyle: {
      fontWeight: 'bold',
      color: 'neutral.800',
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: 'md',
      },
    },
    variants: {
      outline: {
        field: {
          borderColor: 'neutral.200',
          _hover: {
            borderColor: 'brand.500',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      },
    },
  },
  Select: {
    baseStyle: {
      field: {
        borderRadius: 'md',
      },
    },
    variants: {
      outline: {
        field: {
          borderColor: 'neutral.200',
          _hover: {
            borderColor: 'brand.500',
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      },
    },
  },
  Badge: {
    variants: {
      subtle: {
        bg: 'brand.100',
        color: 'brand.700',
      },
      solid: {
        bg: 'brand.500',
        color: 'white',
      },
      outline: {
        borderColor: 'brand.500',
        color: 'brand.500',
      },
      success: {
        bg: 'success.500',
        color: 'white',
      },
      warning: {
        bg: 'warning.500',
        color: 'white',
      },
      error: {
        bg: 'error.500',
        color: 'white',
      },
    },
  },
};

// Fonts (Traveloka uses a sans-serif font similar to Inter or SF Pro)
const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, sans-serif',
};

// Theme config
const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

// Style props
const styles = {
  global: (props) => ({
    body: {
      bg: props.colorMode === 'light' ? 'gray.50' : 'gray.900',
      color: props.colorMode === 'light' ? 'neutral.800' : 'white',
    },
  }),
};

// Create the extended theme
const theme = extendTheme({
  colors,
  fonts,
  components,
  config,
  styles,
  shadows: {
    outline: '0 0 0 3px rgba(0, 124, 255, 0.6)',
  },
  radii: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },
});

export default theme;
