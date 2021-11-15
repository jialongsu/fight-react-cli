const path = require('path');
const commanderDirname = process.cwd(); // 终端输入命令的路径
const projectDirname = path.resolve(__dirname, '../');
const packagePath = `${projectDirname}/packages`;
const templateWebpackPath = `${packagePath}/fcc-template-webpack`;

module.exports = {
  commanderDirname,
  projectDirname,
  packagePath,
  templateWebpackPath,
}