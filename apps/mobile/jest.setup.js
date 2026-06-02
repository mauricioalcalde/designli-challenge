jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, testID, ...props }: Record<string, unknown>) => {
    const React = require('react');
    return React.createElement('Ionicons', { name, testID, ...props });
  },
}));
