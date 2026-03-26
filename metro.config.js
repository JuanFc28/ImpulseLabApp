const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Usar NativeWind en el CSS
module.exports = withNativeWind(config, { input: "./src/styles/global.css" });