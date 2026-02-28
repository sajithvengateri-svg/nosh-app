// Since Expo SDK 52+, Metro is automatically configured for monorepos.
// No manual watchFolders or nodeModulesPaths needed.
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
