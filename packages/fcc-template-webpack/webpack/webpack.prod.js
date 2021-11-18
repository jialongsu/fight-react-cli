// const SpeedMeasureWebpackPlugin = require('speed-measure-webpack-plugin');
const webpackCommonConfig = require('./webpack.common.js')('production');

// const smp = new SpeedMeasureWebpackPlugin();

// module.exports = smp.wrap(webpackCommonConfig);
module.exports = webpackCommonConfig;
