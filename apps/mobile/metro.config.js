const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix metro-cache FileStore import on Node 22+
// metro-cache 0.84.x doesn't export ./src/stores/FileStore but @expo/cli uses it
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'metro-cache/src/stores/FileStore') {
    return {
      filePath: require.resolve('metro-cache/src/stores/FileStore'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
