module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!.*(react-native|@react-native|expo|@expo|react-navigation|victory-native|react-native-svg))',
  ],
  moduleNameMapper: {
    '^victory-native$': '<rootDir>/__mocks__/victory-native.tsx',
    '^@shopify/react-native-skia$': '<rootDir>/__mocks__/react-native-skia.ts',
  },
};
