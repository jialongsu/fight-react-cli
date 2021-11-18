const paths = require('./paths');
const webpack = require('webpack');

module.exports = {

  mode: 'production',

  entry: {
    vendor: [
      'react',
      'react-dom'
    ]
  },

  output: {
    path: paths.dllPath,
    filename: paths.dllFilename,
    library: '[name]_dll_library'
  },

  plugins: [
    // 使用DllPlugin插件编译上面配置的NPM包
    // 会生成一个json文件，里面是关于dll.js的一些配置信息
    new webpack.DllPlugin({
      path: paths.dllJsonPath,
      name: '[name]_dll_library'
    })
  ]
  
};