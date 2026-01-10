#!/usr/bin/env node

/**
 * 简单使用示例
 * 展示 dev-env-installer 的基本用法
 */

const GitAutoInstaller = require('./index');

async function simpleExample() {
  console.log('🚀 开发环境自动安装程序 - 简单示例\n');

  // 创建安装器实例
  const installer = new GitAutoInstaller({
    autoInstall: true,           // 自动安装 Git（如果需要）
    configureGitBash: true,      // 配置 Git Bash 路径
    installOpenCode: true,       // 安装 OpenCode
    installBun: true,            // 安装 Bun
    installOhMyOpenCode: true,   // 安装 Oh My OpenCode
    silent: false                // 显示详细输出
  });

  try {
    // 执行完整安装流程
    const result = await installer.install();

    // 显示结果
    console.log('\n✅ 安装完成！\n');
    console.log('环境信息:');
    console.log('- 操作系统:', result.os);
    console.log('- Git 版本:', result.git.version);
    console.log('- Git 路径:', result.git.path);
    console.log('- Git Bash 路径:', result.gitBashPath);
    console.log('- OpenCode 已安装:', result.opencode);
    console.log('- Bun 已安装:', result.bun);

    // 获取 Git Bash 路径
    const bashPath = installer.getGitBashPath();
    console.log('\n步骤 2: 使用 Git Bash 执行命令...\n');

    // 示例 1: 执行 Git 命令
    const gitVersion = await installer.executeWithGitBash('git --version');
    console.log('Git 版本:', gitVersion.stdout.trim());

    // 示例 2: 执行 Shell 命令
    const pwd = await installer.executeWithGitBash('pwd');
    console.log('当前目录:', pwd.stdout.trim());

    // 示例 3: 列出文件
    const ls = await installer.executeWithGitBash('ls -la');
    console.log('\n文件列表:');
    console.log(ls.stdout);

    console.log('\n✅ 示例运行成功！');

    return result;
  } catch (error) {
    console.error('\n❌ 错误:', error.message);
    throw error;
  }
}

// 运行示例
simpleExample()
  .then(() => {
    console.log('\n🎉 完成！');
  })
  .catch(error => {
    console.error('\n❌ 失败:', error);
    process.exit(1);
  });