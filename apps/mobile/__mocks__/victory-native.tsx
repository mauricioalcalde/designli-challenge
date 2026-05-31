import React from 'react';
import { View } from 'react-native';

// Victory-native v41 mock for Jest (avoids native Skia JSI binding errors)

const NoopComponent = () => React.createElement(View, { testID: 'victory-chart' });

export const CartesianChart = NoopComponent;
export const Line = NoopComponent;
