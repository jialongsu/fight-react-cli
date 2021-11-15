const webpackCommonConfig = require('./webpack.common.js')('development');

module.exports = {
  devServer: {
    host: 'localhost', // 指定host，，改为0.0.0.0可以被外部访问
    port: 8081, // 指定端口号
    open: true, // 服务启动后自动打开默认浏览器
    historyApiFallback: true, // 当找不到页面时，会返回index.html
    hot: true, // 启用模块热替换HMR，在修改模块时不会重新加载整个页面，只会更新改变的内容
    compress: true, // 启动GZip压缩
    https: false, // 是否启用https协议
    proxy: { // 启用请求代理，可以解决前端跨域请求的问题
      '/api': 'www.baidu.com',
    },
  },
  ...webpackCommonConfig,
};