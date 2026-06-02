import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { SplashScreen } from '../src/presentation/screens/SplashScreen';
import { ThemeProvider } from '../src/presentation/theme/ThemeProvider';

jest.useFakeTimers();

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => undefined,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('SplashScreen', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the full-screen splash image on the dark launch shell', () => {
    renderWithTheme(<SplashScreen onFinish={jest.fn()} />);

    expect(screen.getByTestId('splash-screen')).toBeTruthy();
    expect(screen.getByTestId('splash-image')).toBeTruthy();
  });

  it('invokes the completion callback after the launch delay', () => {
    const onFinish = jest.fn();

    renderWithTheme(<SplashScreen onFinish={onFinish} />);

    expect(onFinish).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1600);
    });

    expect(onFinish).toHaveBeenCalledTimes(1);
  });
});
