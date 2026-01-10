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
  } else if (arg === '--no-clis') {
    options.installIflowCLI = false;
    options.installQoderCLI = false;
    options.installQwenCLI = false;
    options.installCodebuddy = false;
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
开发环境自动安装程序 v1.0.3

用法:
  stigmergylite [选项]

选项:
  -s, --silent              静默模式，减少输出
  --no-auto-install         禁用自动安装
  --no-git-bash             不配置 Git Bash
  --no-opencode             不安装 OpenCode
  --no-bun                  不安装 Bun
  --no-oh-my-opencode       不安装 Oh My OpenCode
  --no-iflow                不安装 iFlow CLI
  --no-qoder                不安装 Qoder CLI
  --no-qwen                 不安装 Qwen CLI
  --no-codebuddy            不安装 CodeBuddy
  --no-clis                不安装任何 CLI 工具
  -h, --help                显示帮助信息
  -v, --version             显示版本信息

示例:
  stigmergylite                    # 安装 Git + 全部 CLI 工具（默认）
  stigmergylite --no-clis            # 仅安装 Git，不安装 CLI 工具
  stigmergylite -i                  # 仅安装 iFlow CLI
  stigmergylite -q                  # 仅安装 Qoder CLI
  stigmergylite -w                  # 仅安装 Qwen CLI
  stigmergylite -c                  # 仅安装 CodeBuddy
  stigmergylite --silent             # 静默模式安装
  stigmergylite --no-auto-install    # 仅检测，不安装

环境变量:
  GIT_BASH_PATH        Git Bash 的路径
  GIT_INSTALL_ROOT     Git 安装根目录

支持的 CLI 工具（默认全部安装）:
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