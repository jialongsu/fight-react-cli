const fs = require('fs');
const path = require('path');
const {promisify} = require ('util')
const ora = require('ora');
const inquirer = require('inquirer');
const spawn = require('cross-spawn');
const figlet = promisify(require('figlet')); // 打印文字
const chalk = require('chalk'); // 修改控制台文字样式
const {commanderDirname, projectDirname, packagePath, templateWebpackPath} = require('./paths');

module.exports = async function createProject (projectName) {

  const questions = [
    {
      type: 'list',
      name: 'template',
      message: '请选择项目模板:',
      choices: [
        { name: 'javascript', value: 'fcc-template-javascript' },
        { name: 'typescript', value: 'fcc-template-typescript' },
        { name: 'fight-template', value: 'fcc-template' },
      ],
    },
    // {
    //   type: 'list',
    //   name: 'router',
    //   message: '是否添加react-router?',
    //   choices: [
    //     { name: 'yes', value: 'router' },
    //     { name: 'no', value: '' },
    //   ],
    // },
    // {
    //   type: 'list',
    //   name: 'data',
    //   message: '请选择数据管理容器:',
    //   choices: [
    //     { name: 'mobx', value: 'mobx' },
    //     { name: 'redux', value: 'redux' },
    //     { name: 'no', value: '' },
    //   ],
    // },
  ];

  const data = await figlet ('Welcome');
  console.log(chalk.green(data));
  const answers = await inquirer.prompt(questions);
  const projectDir = `${commanderDirname}/${projectName}`; // 创建项目的路径
  const templateName = answers.template;
  // const templateName = Object.values(answers).filter(Boolean).join('-');

  // 获取模板复制到创建的项目的目录下
  if(!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir); // 创建项目文件夹
    const templateDir = `${packagePath}/${templateName}`; // 模板项目路径
    const templateWebpackPackagePath = `${templateWebpackPath}/package.json`;
    const templatePackagePath = `${templateDir}/package.json`;
    const projectPackagePath = `${projectDir}/package.json`;

    copyFiles(templateDir, projectDir); // 将项目模板文件复制到创建的项目中
    copyFiles(templateWebpackPath, projectDir); // 将webpack配置文件复制到创建的项目中
    createPackageJson(projectName, projectDir, templateName);

    install(projectName);
  } else {
    console.log(chalk.red(`${projectName}项目已存在`));
    process.exit();
  }
}


function copyFiles(sourcePath, targetPath) {
  let paths = fs.readdirSync(sourcePath);

  paths.forEach((fileName) => {
    const filePath = `${sourcePath}/${fileName}`;
    const targetFilePath = `${targetPath}/${fileName}`
    const stat = fs.statSync(filePath);

    //判断是否是文件还是文件夹
    if(stat.isFile()) {
      fs.copyFileSync(filePath, targetFilePath);
    } else {
      // 需要在目标文件夹下面创建资源文件夹
      mkDir(targetFilePath);
      copyFiles(filePath, targetFilePath);
    }
  });
}

function mkDir(projectDir) {
  if(!fs.existsSync(projectDir)) {
    fs.mkdirSync(projectDir);
  }
}

function createPackageJson(projectName, projectDir, templateName) {
  const templateDir = `${packagePath}/${templateName}`; // 模板项目路径
  const templateWebpackPackagePath = `${templateWebpackPath}/package.json`;
  const templatePackagePath = `${templateDir}/package.json`;
  const projectPackagePath = `${projectDir}/package.json`;
  const packageInfoStr = fs.readFileSync(templatePackagePath, {encoding: 'utf8'});
  const templateWebpackPackageInfoStr = fs.readFileSync(templateWebpackPackagePath, {encoding: 'utf8'});
  const packageJsonInfo = JSON.parse(templateWebpackPackageInfoStr);

  packageJsonInfo.dependencies = {
    ...packageJsonInfo.dependencies,
    ...JSON.parse(packageInfoStr).dependencies,
  }; // 合并webpack模板与用户指定模板的package.json
  packageJsonInfo.name = projectName; // 修改项目名称
  fs.writeFileSync(projectPackagePath, JSON.stringify(packageJsonInfo, null, 2)); // 修改创建的项目中的package.json
}


function install(projectName) {
  const childProcess = spawn('yarn', ['install'], { cwd: `./${projectName}` });

  // 使用spawn运行命令相当于新开了一个线程在这个线程中运行命令，在我们脚手架的线程中就无法输出安装日志
  // 将子线程的日志通过stdout.pipe和stderr.pipe传输给主线程
  childProcess.stdout.pipe(process.stdout); // 传输正常日志
  childProcess.stderr.pipe(process.stderr); // 传输错误日志
  // 监听结束事件
  childProcess.on('close', code => {
    if (code !== 0) {
    return;
    }
    console.log(chalk.green('success'));
    console.log(chalk.green(`启动项目运行: cd ${projectName} && yarn start`));
    console.log(chalk.green(`打包项目: yarn run build 或者 npm run build`));
  });
}