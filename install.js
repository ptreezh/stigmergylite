#!/usr/bin/env node

/**
 * npm install 钩子脚本
 * 在安装此包时自动检测和配置 Git
 */

const GitAutoInstaller = require('./index');

async function postInstall() {
  console.log('\n🔧 检测和配置 Git 环境...\n');
  
  try {
    const installer = new GitAutoInstaller({
      silent: false,
      autoInstall: false, // 默认不自动安装，避免意外
      configureGitBash: true
    });
    
    // 检查 Git 是否已安装
    const gitStatus = await installer.isGitInstalled();
    
    if (gitStatus.installed) {
      console.log('✅ Git 已安装:', gitStatus.version);
      
      // 配置 Git Bash 路径
      const bashPath = installer.findGitBashPath();
      if (bashPath) {
        console.log('✅ Git Bash 路径:', bashPath);
        await installer.configureGitBashEnv();
      } else {
        console.log('⚠️  未找到 Git Bash，某些工具可能无法正常工作');
      }
    } else {
      console.log('⚠️  Git 未安装');
      console.log('💡 运行以下命令自动安装 Git:');
      console.log('   npx git-autoinstaller');
    }
    
    console.log('\n✨ Git 环境检测完成\n');
  } catch (error) {
    console.error('❌ 检测失败:', error.message);
  }
}

// 运行 post-install 脚本
postInstall();