const path = require('path');
const fs = require('fs');

// process.cwd(): 获取当前输入命令的路径
// fs.realpathSync: 返回解析的路径名，也就是项目的根目录
// 为什么不使用__dirname？因为__dirname获取的是当前文件的路径，我们需要拿到项目的根目录来设置文件的绝对路径
const appDirectory = fs.realpathSync(process.cwd());

const resolveAppPath = (relativePath) => path.resolve(appDirectory, relativePath);

const buildPath = 'dist';

const appTsConfig = resolveAppPath('tsconfig.json');

const isUseTs = fs.existsSync(appTsConfig);

module.exports = {
  appSrc: resolveAppPath('src'),
  appIndexJs: resolveAppPath('src/index'),
  appBuildPath: resolveAppPath(buildPath),
  appPublic: resolveAppPath('public'),
  appHtml: resolveAppPath('public/index.ejs'),
  appTsConfig,

  isUseTs,
};

