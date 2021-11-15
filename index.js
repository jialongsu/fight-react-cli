// 1. 创建命令
// 2. 获取用户输入的命令参数
// 3. 根据参数拉取模板项目
// 4. 执行yarn install(初始化项目)

const { program } = require('commander');
const createProject = require('./src/createProject');
const commands = {
  'create [projectName]': {
    description: 'create a projet',
    action: (projectName, options) => {
      createProject(projectName);
    },
  },
  'addPage [pageName]': {
    description: 'create a page',
    action: (pageName, options) => {
      console.log('create a page ', pageName, options);
    },
  },
};

Object.keys(commands).forEach((key) => {
  const options = commands[key];
  program
    .command(key)
    .description(options.description)
    .action(options.action);
});

// 解析命令行中的参数
program.parse(process.argv);

