#!/usr/bin/env node

/**
 * CodeBuddy 集成示例
 * 展示如何在 CodeBuddy 等工具中使用 git-autoinstaller
 */

const GitAutoInstaller = require('./index');

async function setupCodeBuddy() {
  console.log('🚀 CodeBuddy 环境设置\n');
  
  // 1. 创建安装器实例
  const installer = new GitAutoInstaller({
    autoInstall: true,           // 自动安装 Git（如果需要）
    configureGitBash: true,      // 配置 Git Bash 路径
    gitConfig: {                 // 配置 Git
      userName: 'CodeBuddy User',
      userEmail: 'codebuddy@example.com',
      defaultBranch: 'main'
    }
  });
  
  try {
    // 2. 执行安装和配置
    console.log('步骤 1: 检测和配置 Git 环境...\n');
    const result = await installer.install();
    
    console.log('✅ Git 环境配置完成\n');
    console.log('环境信息:');
    console.log('- 操作系统:', result.os);
    console.log('- Git 版本:', result.git.version);
    console.log('- Git 路径:', result.git.path);
    console.log('- Git Bash 路径:', result.gitBashPath);
    console.log();
    
    // 3. 获取 Git Bash 路径供 CodeBuddy 使用
    const bashPath = installer.getGitBashPath();
    
    if (!bashPath) {
      throw new Error('❌ 无法找到 Git Bash，CodeBuddy 无法运行');
    }
    
    console.log('步骤 2: 使用 Git Bash 执行命令...\n');
    
    // 4. 示例：使用 Git Bash 执行 Git 命令
    const gitVersion = await installer.executeWithGitBash('git --version');
    console.log('Git 版本:', gitVersion.stdout.trim());
    
    // 5. 示例：使用 Git Bash 执行 CodeBuddy 命令
    // 注意：这里需要根据实际的 CodeBuddy 安装方式调整
    console.log('\n步骤 3: 模拟 CodeBuddy 命令执行...\n');
    
    try {
      // 假设 CodeBuddy 已安装
      const codeBuddyHelp = await installer.executeWithGitBash('codebuddy --help 2>&1 || echo "CodeBuddy 未安装"');
      console.log('CodeBuddy 输出:', codeBuddyHelp.stdout.trim());
    } catch (error) {
      console.log('⚠️  CodeBuddy 未安装或无法运行');
      console.log('💡 提示: 请先安装 CodeBuddy，然后使用以下命令运行:');
      console.log(`   ${bashPath} -c "codebuddy --help"`);
    }
    
    // 6. 示例：在 CodeBuddy 中初始化项目
    console.log('\n步骤 4: 示例 - 初始化 Git 仓库...\n');
    
    const initResult = await installer.executeWithGitBash('cd /tmp && mkdir -p test-codebuddy && cd test-codebuddy && git init && echo "test" > test.txt && git add . && git commit -m "Initial commit"');
    console.log('仓库初始化输出:', initResult.stdout.trim());
    
    const logResult = await installer.executeWithGitBash('cd /tmp/test-codebuddy && git log --oneline');
    console.log('提交历史:', logResult.stdout.trim());
    
    console.log('\n✅ CodeBuddy 环境设置完成！');
    console.log('\n💡 使用提示:');
    console.log(`1. Git Bash 路径: ${bashPath}`);
    console.log(`2. 环境变量 GIT_BASH_PATH: ${process.env.GIT_BASH_PATH}`);
    console.log(`3. 环境变量 GIT_INSTALL_ROOT: ${process.env.GIT_INSTALL_ROOT}`);
    console.log('\n在 CodeBuddy 中使用 Git Bash:');
    console.log(`   ${bashPath} -c "your-command"`);
    
    return result;
  } catch (error) {
    console.error('❌ 设置失败:', error.message);
    throw error;
  }
}

// 运行示例
setupCodeBuddy()
  .then(result => {
    console.log('\n🎉 示例运行成功！');
  })
  .catch(error => {
    console.error('\n❌ 示例运行失败:', error);
    process.exit(1);
  });
