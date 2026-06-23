import { Platform } from 'react-native';

const fontFamily = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const typography = {
  h1: { fontFamily, fontSize: 32, fontWeight: '700', letterSpacing: -0.5 },
  h2: { fontFamily, fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  h3: { fontFamily, fontSize: 20, fontWeight: '600' },
  h4: { fontFamily, fontSize: 16, fontWeight: '600' },
  body: { fontFamily, fontSize: 15, fontWeight: '400' },
  bodySmall: { fontFamily, fontSize: 13, fontWeight: '400' },
  caption: { fontFamily, fontSize: 12, fontWeight: '400' },
  label: { fontFamily, fontSize: 14, fontWeight: '500' },
  button: { fontFamily, fontSize: 15, fontWeight: '600', letterSpacing: 0.3 },
};
