const path = require('path');
const glob = require('glob')
const webpack = require('webpack');
const AddAssetHtmlWebpackPlugin = require('add-asset-html-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin'); // 生成html文件并自动引入打包的文件
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 将css从js中分离为单独的css文件
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin'); // 压缩css
const ESLintPlugin = require('eslint-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin'); // react热更新
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin'); // 在终端显示ts错误提示
const ProgressBarPlugin = require('progress-bar-webpack-plugin'); // 显示编译进度条
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin; // 打包文件体积分析

const paths = require('./paths');

const cssRegex = /\.css$/;
const cssModuleRegex = /\.module\.css$/;
const sassRegex = /\.(scss|sass)$/;
const sassModuleRegex = /\.module\.(scss|sass)$/;

module.exports = (webpackEnv) => {
  const isEnvDevelopment = webpackEnv === 'development';
  const isEnvProduction = webpackEnv === 'production';
  const cssLocalIdentName = isEnvDevelopment ? '[path][name]-[local]-[hash:base64:5]' : '[hash:base64:8]';

  const getStyleLoader = (cssOptions, loader) => {
    const loaders = [
      isEnvProduction ? 
      MiniCssExtractPlugin.loader : // 将css从js中分离拆分为单独的css文件
      'style-loader', // 生成style标签，将css样式添加到style标签中并插入到dom中（此时，css是在js个文件中的）
      {
        loader: 'css-loader', // css-loader 会对 @import 和 url() 进行处理，就像 js 解析 import/require() 一样
        options: cssOptions
      },
      {
        // css兼容性处理
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: [
              [
                'postcss-preset-env',
                {
                  autoprefixer: {
                    flexbox: 'no-2009',
                  },
                  stage: 3,
                },
              ],
              isEnvProduction && 
              [
                '@fullhuman/postcss-purgecss', // 删除未使用的css
                {
                  content: [ paths.appHtml, ...glob.sync(path.join(paths.appSrc, '/**/*.{tsx,ts,js,jsx}'), { nodir: true }) ],
                }
              ],
              [
                'postcss-normalize', // 重置浏览器的默认样式，比如：谷歌浏览器默认padding:8px等
                {
                  forceImport : 'sanitize.css'
                }
              ],
              [
                'postcss-px-to-viewport', // 屏幕适配，将px转换为vh|vw
                {
                  viewportWidth: 375, // (Number) The width of the viewport.
                  viewportHeight: 667, // (Number) The height of the viewport.
                  unitPrecision: 3, // (Number) The decimal numbers to allow the REM units to grow to.
                  viewportUnit: "vw", // (String) Expected units.
                  selectorBlackList: [], // (Array) The selectors to ignore and leave as px.
                  minPixelValue: 1, // (Number) Set the minimum pixel value to replace.
                  mediaQuery: false // (Boolean) Allow px to be converted in media queries.
                }
              ],
            ].filter(Boolean),
          },
        }
      },
    ].filter(Boolean);

    if(loader) {
      loaders.push(loader);
    }
  
    return loaders;
  }

  return {
    // 模式配置：
    // 1.production 生产模式 会自动启动js压缩，tree shaking等优化
    // 2.development 开发模式
    mode: webpackEnv,

    // 打包入口配置
    entry: paths.appIndexJs,

    // 打包输出配置
    output: {
      path: paths.appBuildPath, // 打包文件输出路径
      filename: 
        isEnvDevelopment ? 
        '[name].js' : 
        '[name].[contenthash:8].js', // 打包文件输出名称
      chunkFilename: 
        isEnvDevelopment ? 
        '[name].js' : 
        '[name].[contenthash:8].js',
      assetModuleFilename: 
        isEnvDevelopment ? 
        'asset/[name][ext][query]' :
        'asset/[name].[contenthash:8][ext][query]', // 资源输出名称
      clean: true, // 构建前清空输出目录
      pathinfo: false, // 禁止在bundle中生成文件路径信息，减小内存开销
    },

    // 资源映射: 会生成sourcemap文件，将打包后的文件与源码进行映射 方便调式开发
    devtool: isEnvProduction ? false : 'cheap-module-source-map',

    // 优化配置
    optimization: {
      runtimeChunk: 'single', //将runtime的代码拆分为一个单独的chunk
      removeEmptyChunks: true, // 删除空chunk文件
      // 将可重复使用的代码拆分为独立的chunk
      splitChunks: {
        chunks: 'all',
      },
      // mode为production时minimizer中的插件才会生效
      minimizer: [
        new CssMinimizerPlugin(),
        '...' // 使用 '...' 添加默认插件
      ],
    },

    cache: {
      type: "filesystem", // 使用文件缓存
    },

    // 解析配置
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx', '.json'],
      alias: {},
      symlinks: false,
    },

    // 排除不需要打包的模块
    externals: {}, 

    // loader
    module: {
      rules: [
        {
          oneOf: [
            // 处理js文件
            {
              test: /\.(js|jsx|ts|tsx)$/,
              include: paths.appSrc,
              use: [
                {
                  loader: "thread-loader", //  将耗时的 loader 放在一个独立的 worker 池中运行，加快 loader 构建速度
                  // 有同样配置的 loader 会共享一个 worker 池
                  options: {
                    // 产生的 worker 的数量，默认是 (cpu 核心数 - 1)
                    workers: 2,
                  },
                },
                {
                  loader: 'babel-loader',
                  options: {
                    presets: [
                      "@babel/preset-env",
                      [
                        "@babel/preset-react",
                        {
                          runtime: 'automatic',
                        }
                      ],
                      "@babel/preset-typescript",
                    ],
                    plugins: [
                      [
                        '@babel/plugin-transform-runtime',
                        {
                          // 将es6转为es5时会有很多通用的函数被内联到文件中，
                          // 如：使用class 会有一个classCallCheck的函数，如果在多个文件中使用class，那么这个函数都会重复存在于这些文件中
                          // 将helpers设置true，则会将这些通用函数通过模块引用的方式来使用，减少了不必要的代码
                          "helpers": true, 
                          // corejs使用runtime-corejs来开启polyfill
                          "corejs": 3,
                          // 使用generate时，会在全局环境上注入generate的实现函数，这样会造成全局污染
                          // regenerator为true，通过模块引入的方式来调用generate
                          "regenerator": true,
                        }
                      ],
                      isEnvDevelopment && 'react-refresh/babel',
                    ].filter(Boolean),
                    cacheDirectory: true,
                  }
                },
              ]
            },
            // 处理css文件
            {
              test: cssRegex,
              exclude: cssModuleRegex,
              include: paths.appSrc,
              use: getStyleLoader(),
            },
            // 处理sass文件
            {
              test: sassRegex,
              exclude: sassModuleRegex,
              include: paths.appSrc,
              use: getStyleLoader({}, 'sass-loader'),
            },
            // 处理css模块
            {
              test: cssModuleRegex,
              include: paths.appSrc,
              use: getStyleLoader({
                modules: {
                  localIdentName: cssLocalIdentName,
                }
              }),
            },
            // 处理sass模块
            {
              test: sassModuleRegex,
              include: paths.appSrc,
              use: getStyleLoader(
                {
                  modules: {
                    localIdentName: cssLocalIdentName,
                  }
                }, 
                'sass-loader'
              ),
            },
            // 处理图片资源
            {
              test: /\.(png|svg|jpg|jpeg|gif)$/,
              // test: /\.(woff|woff2|eot|ttf|otf)$/i,
              // exclude: /\.(js|mjs|ejs|jsx|ts|tsx|css|scss|sass)$/i,
              type: 'asset', // 在resource和inline中自动选择，默认小于8kb使用inline，否则使用resource
              generator: {
                filename: 'image/[name].[contenthash:8][ext][query]'
              }
            },
            // 处理字体文件等其它资源
            {
              exclude: /\.(js|mjs|ejs|jsx|ts|tsx|css|scss|sass|png|svg|jpg|jpeg|gif)$/i,
              type: 'asset', // 在resource和inline中自动选择，默认小于8kb使用inline，否则使用resource
              // parser: { // 自定义内联资源的条件
              //   dataUrlCondition: {
              //     maxSize: 4 * 1024 // 4kb
              //   }
              // }
              // type: 'asset/resource', // 类似使用 file-loader，将文件发送到输出目录
              // type: 'asset/inline', // 类似使用 url-loader，将文件作为base64内联到bundle中
              // type: 'asset/source', // 类似使用 raw-loader，将文件内容作为字符串导出，不做任何处理
            },
          ]
        }
      ]
    },

    // 插件
    plugins: [
      isEnvProduction && 
        new webpack.DllReferencePlugin({
          manifest: paths.dllJsonPath
        }),

      new HtmlWebPackPlugin({
        template: paths.appHtml,
      }),

      isEnvProduction && 
        new AddAssetHtmlWebpackPlugin({
          filepath: paths.dllFilenPath,
          publicPath: ''
        }),

      isEnvProduction && 
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash:8].css',
          chunkFilename: 'css/[name].[contenthash:8].chunk.css',
        }),

      // isEnvProduction && new ProgressBarPlugin(),

      // isEnvProduction && new BundleAnalyzerPlugin(),
      
      paths.isUseTs && 
        new ESLintPlugin({
          extensions: ['.tsx', '.ts', '.js', '.jsx'],
          fix: true,
        }),

      paths.isUseTs && 
        new ForkTsCheckerWebpackPlugin({
          typescript: {
            configFile: paths.appTsConfig
          },
        }),

      isEnvDevelopment && new ReactRefreshWebpackPlugin(),

    ].filter(Boolean),
  };
}