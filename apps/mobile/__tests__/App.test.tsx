import { act } from '@testing-library/react-native';
import renderer from 'react-test-renderer';
import App from '../App';

// --- Native module mocks required by the new App wiring ---

jest.mock('react-native-mmkv', () => ({
  createMMKV: jest.fn(() => ({
    getString: jest.fn().mockReturnValue(null),
    set: jest.fn(),
    remove: jest.fn(),
  })),
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn().mockResolvedValue(undefined),
  hideAsync: jest.fn().mockResolvedValue(undefined),
}));

// Prevent NetInfo native calls
jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: jest.fn(() => jest.fn()),
  },
  addEventListener: jest.fn(() => jest.fn()),
}));

jest.mock('../src/presentation/navigation/AppNavigator', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');

  return {
    AppNavigator: () => React.createElement(Text, null, 'Mock App Navigator'),
  };
});

describe('App', () => {
  it('mounts without crashing (splash → navigator)', async () => {
    // Smoke test: verifies bootstrap completes and the root shell renders.
    // Native integrations are mocked, AppNavigator is replaced with a light stub.
    let tree: ReturnType<typeof renderer.create> | undefined;
    await act(async () => {
      tree = renderer.create(<App />);
    });
    expect(tree).toBeDefined();
    expect(tree!.toJSON()).toBeTruthy();
  });
});
