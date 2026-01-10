#!/usr/bin/env node

/**
 * npm install 钩子脚本
 * 在安装此包时自动检测和配置所有开发工具
 */

const GitAutoInstaller = require('./index');

async function postInstall() {
  console.log('\n🔧 开始自动安装开发工具...\n');
  
  try {
    const installer = new GitAutoInstaller({
      silent: false,
      autoInstall: true,
      configureGitBash: true
    });
    
    // 运行完整安装流程
    await installer.install();
    
    console.log('\n✨ 所有开发工具安装完成\n');
    console.log('📝 提示: 如需单独安装特定工具，可以使用以下命令:\n');
    console.log('  stigmergylite --no-opencode      # 不安装 OpenCode');
    console.log('  stigmergylite --no-bun             # 不安装 Bun');
    console.log('  stigmergylite --no-oh-my-opencode # 不安装 Oh My OpenCode');
    console.log('  stigmergylite --no-iflow          # 不安装 iFlow CLI');
    console.log('  stigmergylite --no-qoder          # 不安装 Qoder CLI');
    console.log('  stigmergylite --no-qwen           # 不安装 Qwen CLI');
    console.log('  stigmergylite --no-codebuddy      # 不安装 CodeBuddy');
  } catch (error) {
    console.error('❌ 自动安装失败:', error.message);
    process.exit(1);
  }
}

// 运行 post-install 脚本
postInstall();