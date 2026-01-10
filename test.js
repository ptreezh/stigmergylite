#!/usr/bin/env node

/**
 * 测试脚本
 */

const GitAutoInstaller = require('./index');

async function runTests() {
  console.log('🧪 开始测试 Git 自动安装程序\n');
  
  const installer = new GitAutoInstaller({
    silent: false,
    autoInstall: false,
    configureGitBash: true
  });
  
  try {
    // 测试 1: 检测操作系统
    console.log('测试 1: 检测操作系统');
    const osType = installer.detectOS();
    console.log(`✅ 操作系统: ${osType}\n`);
    
    // 测试 2: 检测 Git
    console.log('测试 2: 检测 Git 是否已安装');
    const gitStatus = await installer.isGitInstalled();
    console.log(`✅ Git 状态:`, gitStatus, '\n');
    
    // 测试 3: 查找 Git Bash
    console.log('测试 3: 查找 Git Bash 路径');
    const bashPath = installer.findGitBashPath();
    if (bashPath) {
      console.log(`✅ Git Bash 路径: ${bashPath}\n`);
    } else {
      console.log('⚠️  未找到 Git Bash\n');
    }
    
    // 测试 4: 配置 Git Bash 环境变量
    console.log('测试 4: 配置 Git Bash 环境变量');
    const configured = await installer.configureGitBashEnv();
    console.log(`✅ 配置结果: ${configured ? '成功' : '失败'}\n`);
    
    // 测试 5: 使用 Git Bash 执行命令（如果找到）
    if (bashPath) {
      console.log('测试 5: 使用 Git Bash 执行命令');
      try {
        const result = await installer.executeWithGitBash('echo "Hello from Git Bash"');
        console.log(`✅ 命令执行成功:`, result.stdout.trim(), '\n');
      } catch (error) {
        console.log(`❌ 命令执行失败:`, error.message, '\n');
      }
    }
    
    // 测试 6: 检查环境变量
    console.log('测试 6: 检查环境变量');
    console.log(`GIT_BASH_PATH: ${process.env.GIT_BASH_PATH || '未设置'}`);
    console.log(`GIT_INSTALL_ROOT: ${process.env.GIT_INSTALL_ROOT || '未设置'}\n`);
    
    console.log('✅ 所有测试完成\n');
    
    return {
      success: true,
      os: osType,
      git: gitStatus,
      gitBash: bashPath,
      env: {
        GIT_BASH_PATH: process.env.GIT_BASH_PATH,
        GIT_INSTALL_ROOT: process.env.GIT_INSTALL_ROOT
      }
    };
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 运行测试
runTests().then(result => {
  console.log('\n测试结果:');
  console.log(JSON.stringify(result, null, 2));
}).catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});