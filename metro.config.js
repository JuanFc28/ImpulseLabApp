const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Aquí le decimos a Metro que use NativeWind y dónde está tu CSS
module.exports = withNativeWind(config, { input: "./src/styles/global.css" });