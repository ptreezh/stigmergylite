#!/usr/bin/env node

const GitAutoInstaller = require('./index');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {};

// 解析参数
for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  if (arg === '--silent' || arg === '-s') {
    options.silent = true;
  } else if (arg === '--no-auto-install') {
    options.autoInstall = false;
  } else if (arg === '--no-git-bash') {
    options.configureGitBash = false;
  } else if (arg === '--install-codebuddy' || arg === '-c') {
    options.installCodeBuddy = true;
  } else if (arg === '--no-opencode') {
    options.installOpenCode = false;
  } else if (arg === '--no-bun') {
    options.installBun = false;
  } else if (arg === '--no-oh-my-opencode') {
    options.installOhMyOpenCode = false;
  } else if (arg === '--full' || arg === '-f') {
    options.installOpenCode = true;
    options.installBun = true;
    options.installOhMyOpenCode = true;
  } else if (arg === '--iflow' || arg === '-i') {
    options.installIflowCLI = true;
  } else if (arg === '--qoder' || arg === '-q') {
    options.installQoderCLI = true;
  } else if (arg === '--qwen' || arg === '-w') {
    options.installQwenCLI = true;
  } else if (arg === '--codebuddy' || arg === '-c') {
    options.installCodebuddy = true;
  } else if (arg === '--all-clis' || arg === '-a') {
    options.installIflowCLI = true;
    options.installQoderCLI = true;
    options.installQwenCLI = true;
    options.installCodebuddy = true;
  } else if (arg === '--help' || arg === '-h') {
    printHelp();
    process.exit(0);
  } else if (arg === '--version' || arg === '-v') {
    console.log('dev-env-installer v1.0.0');
    process.exit(0);
  }
}

// 显示帮助信息
function printHelp() {
  console.log(`
开发环境自动安装程序 v1.0.2

用法:
  stigmergylite [选项]

选项:
  -s, --silent              静默模式，减少输出
  --no-auto-install         禁用自动安装
  --no-git-bash             不配置 Git Bash
  --no-opencode             不安装 OpenCode
  --no-bun                  不安装 Bun
  --no-oh-my-opencode       不安装 Oh My OpenCode
  -i, --iflow               安装 iFlow CLI
  -q, --qoder               安装 Qoder CLI
  -w, --qwen               安装 Qwen CLI
  -c, --codebuddy           安装 CodeBuddy
  -a, --all-clis             安装所有 CLI 工具（iFlow + Qoder + Qwen + CodeBuddy）
  -f, --full                完整安装（Git + OpenCode + Bun + Oh My OpenCode + 所有 CLI）
  -h, --help                显示帮助信息
  -v, --version             显示版本信息

示例:
  stigmergylite                          # 自动检测并安装 Git
  stigmergylite -f                      # 完整安装所有工具
  stigmergylite --all-clis               # 安装所有 AI CLI 工具
  stigmergylite -i -q -w -c           # 安装特定 CLI 工具
  stigmergylite --silent                # 静默模式安装
  stigmergylite --no-auto-install       # 仅检测，不安装

环境变量:
  GIT_BASH_PATH        Git Bash 的路径
  GIT_INSTALL_ROOT     Git 安装根目录

支持的 CLI 工具:
  iFlow CLI       npm i -g @iflow-ai/iflow-cli
  Qoder CLI       npm i -g @qoder-ai/qodercli
  Qwen CLI       npm i -g @qwen-code/qwen-code
  CodeBuddy      npm i -g @tencent-ai/codebuddy-code
  `);
}

// 运行安装程序
async function main() {
  try {
    const installer = new GitAutoInstaller(options);
    const result = await installer.install();

    if (!options.silent) {
      console.log('\n安装结果:');
      console.log(JSON.stringify(result, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

main();