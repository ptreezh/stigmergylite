#!/usr/bin/env node

const GitAutoInstaller = require('./index');

// 解析命令行参数
const args = process.argv.slice(2);
const options = {};

// 检查是否有子命令
const subCommand = args[0];
const validSubCommands = ['doctor', 'fix', 'status', 'install-oh-my-opencode', 'help', '--help', '-h'];

// 如果是有效的子命令，执行对应的功能
if (validSubCommands.includes(subCommand)) {
  handleSubCommand(subCommand, args.slice(1));
} else {
  // 不是子命令，解析为选项
  parseOptionsAndInstall(args);
}

/**
 * 处理子命令
 */
async function handleSubCommand(command, args) {
  const installer = new GitAutoInstaller({ silent: false });

  try {
    switch (command) {
      case 'doctor':
        await installer.diagnose();
        break;

      case 'fix':
        await installer.fix();
        break;

      case 'status':
        await installer.status();
        break;

      case 'install-oh-my-opencode':
        const result = await installer.installOhMyOpenCodeOnly();
        process.exit(result ? 0 : 1);
        break;

      case 'help':
      case '--help':
      case '-h':
        installer.showHelp();
        break;
    }
    process.exit(0);
  } catch (error) {
    console.error('错误:', error.message);
    process.exit(1);
  }
}

/**
 * 解析选项并执行安装
 */
function parseOptionsAndInstall(args) {
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
    } else if (arg === '--version' || arg === '-v') {
      console.log('StigmergyLite v1.1.0');
      process.exit(0);
    } else {
      console.error(`未知选项: ${arg}`);
      console.error('运行 "stigmergylite help" 查看帮助');
      process.exit(1);
    }
  }

  // 运行安装程序
  runInstall(options);
}

/**
 * 运行安装程序
 */
async function runInstall(options) {
  try {
    const installer = new GitAutoInstaller(options);
    const result = await installer.install();

    if (!options.silent) {
      console.log('\n' + '='.repeat(50));
      console.log('安装完成！');
      console.log('='.repeat(50));

      // 显示安装结果
      console.log('\n安装结果:');
      console.log(`  Git: ${result.git.installed ? '✅' : '❌'}`);
      console.log(`  OpenCode: ${result.opencode ? '✅' : '❌'}`);
      console.log(`  Bun: ${result.bun ? '✅' : '❌'}`);
      console.log(`  Oh My OpenCode: ${result.ohMyOpenCode || result.ohmyopencode ? '✅' : '❌'}`);
      console.log(`  CodeBuddy: ${result.codebuddy ? '✅' : '❌'}`);
      console.log(`  iFlow CLI: ${result.iflow ? '✅' : '❌'}`);
      console.log(`  Qoder CLI: ${result.qodercli ? '✅' : '❌'}`);
      console.log(`  Qwen CLI: ${result.qwen ? '✅' : '❌'}`);

      console.log('\n下一步:');
      console.log('  1. 运行 "stigmergylite status" 查看完整状态');
      console.log('  2. 运行 "opencode" 启动 OpenCode');
      console.log('  3. 如果遇到问题，运行 "stigmergylite doctor" 诊断');
      console.log('  4. 运行 "stigmergylite help" 查看更多命令');

      console.log('\n' + '='.repeat(50));
    }

    process.exit(0);
  } catch (error) {
    console.error('\n错误:', error.message);
    console.error('\n如果遇到问题，可以尝试:');
    console.error('  1. 运行 "stigmergylite doctor" 诊断问题');
    console.error('  2. 运行 "stigmergylite fix" 自动修复');
    console.error('  3. 运行 "stigmergylite help" 查看帮助');
    process.exit(1);
  }
}
