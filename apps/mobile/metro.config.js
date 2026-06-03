const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Watch all files in the workspace
config.watchFolders = [workspaceRoot];

// Enable hierarchical lookup for pnpm workspaces
config.resolver.disableHierarchicalLookup = false;

// Explicitly set node_modules paths for pnpm structure
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules/.pnpm'),
];

module.exports = config;
