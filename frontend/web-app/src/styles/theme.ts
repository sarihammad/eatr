import { extendTheme } from '@chakra-ui/react';

const colors = {
  primary: {
    50: '#f7fee7',
    100: '#ecfccb',
    200: '#d9f99d',
    300: '#bef264',
    400: '#a3e635',
    500: '#84cc16',
    600: '#65a30d',
    700: '#4d7c0f',
    800: '#3f6212',
    900: '#365314',
    950: '#1a2e05',
  },
};

const fonts = {
  heading: 'var(--font-inter)',
  body: 'var(--font-inter)',
};

const components = {
  Button: {
    baseStyle: {
      fontWeight: 'semibold',
      borderRadius: 'lg',
    },
    variants: {
      solid: (props: { colorScheme: string }) => ({
        bg: `${props.colorScheme}.400`,
        color: 'white',
        _hover: {
          bg: `${props.colorScheme}.500`,
        },
      }),
    },
  },
  Link: {
    baseStyle: {
      _hover: {
        textDecoration: 'none',
      },
    },
  },
};

export const theme = extendTheme({
  colors,
  fonts,
  components,
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
}); 