# Git AutoInstaller 快速使用指南

## 📦 安装

```bash
npm install git-autoinstaller
```

## 🚀 快速开始

### 方法 1: 在你的 npm 包中使用

```javascript
const GitAutoInstaller = require('git-autoinstaller');

async function main() {
  const installer = new GitAutoInstaller({
    autoInstall: true,
    configureGitBash: true
  });
  
  // 自动检测和配置 Git
  await installer.install();
  
  // 获取 Git Bash 路径
  const bashPath = installer.getGitBashPath();
  console.log('Git Bash:', bashPath);
  
  // 使用 Git Bash 执行命令
  const result = await installer.executeWithGitBash('git --version');
  console.log('Git 版本:', result.stdout);
}

main();
```

### 方法 2: 作为 CLI 工具使用

```bash
# 全局安装
npm install -g git-autoinstaller

# 运行自动安装
git-autoinstall

# 静默模式
git-autoinstall --silent
```

## 🔧 解决 "找不到 Git Bash" 问题

### 问题场景

当你的工具（如 CodeBuddy）需要使用 Git Bash 时，可能会遇到以下错误：

```
Error: Cannot find Git Bash
```

### 解决方案

使用 `git-autoinstaller` 自动配置：

```javascript
const GitAutoInstaller = require('git-autoinstaller');

async function setupTool() {
  // 1. 创建安装器
  const installer = new GitAutoInstaller({
    autoInstall: true,
    configureGitBash: true
  });
  
  // 2. 执行安装和配置
  await installer.install();
  
  // 3. 获取 Git Bash 路径
  const bashPath = installer.getGitBashPath();
  
  if (!bashPath) {
    throw new Error('Git Bash 未找到');
  }
  
  // 4. 使用 Git Bash 运行你的工具
  await installer.executeWithGitBash('your-tool-command');
  
  return bashPath;
}
```

### 环境变量

安装完成后，以下环境变量会自动设置：

```javascript
process.env.GIT_BASH_PATH      // Git Bash 完整路径
process.env.GIT_INSTALL_ROOT   // Git 安装根目录
```

## 📝 实际使用示例

### 示例 1: CodeBuddy 集成

```javascript
const GitAutoInstaller = require('git-autoinstaller');

async function initializeCodeBuddy() {
  const installer = new GitAutoInstaller({
    autoInstall: true,
    configureGitBash: true,
    gitConfig: {
      userName: 'Your Name',
      userEmail: 'your.email@example.com'
    }
  });
  
  // 配置环境
  await installer.install();
  
  // 使用 Git Bash 运行 CodeBuddy
  const bashPath = installer.getGitBashPath();
  await installer.executeWithGitBash('codebuddy --help');
}

initializeCodeBuddy();
```

### 示例 2: 在其他工具中使用

```javascript
const GitAutoInstaller = require('git-autoinstaller');

async function runGitDependentTool() {
  const installer = new GitAutoInstaller();
  
  // 确保 Git 和 Git Bash 可用
  const result = await installer.install();
  
  if (!result.gitBashPath) {
    console.error('Git Bash 不可用');
    return;
  }
  
  // 使用 Git Bash 执行命令
  const output = await installer.executeWithGitBash('ls -la');
  console.log(output.stdout);
}

runGitDependentTool();
```

### 示例 3: 批量安装多个工具

```javascript
const GitAutoInstaller = require('git-autoinstaller');

async function setupDevelopmentEnvironment() {
  const installer = new GitAutoInstaller({
    autoInstall: true,
    configureGitBash: true
  });
  
  // 1. 配置 Git 环境
  await installer.install();
  
  const bashPath = installer.getGitBashPath();
  
  // 2. 安装其他依赖 Git 的工具
  const tools = [
    'codebuddy',
    'some-other-tool',
    'another-git-tool'
  ];
  
  for (const tool of tools) {
    try {
      console.log(`安装 ${tool}...`);
      await installer.executeWithGitBash(`npm install -g ${tool}`);
      console.log(`✅ ${tool} 安装成功`);
    } catch (error) {
      console.log(`❌ ${tool} 安装失败:`, error.message);
    }
  }
}

setupDevelopmentEnvironment();
```

## 🛠️ 高级用法

### 自定义 Git 配置

```javascript
const installer = new GitAutoInstaller({
  gitConfig: {
    userName: 'Developer',
    userEmail: 'dev@example.com',
    defaultBranch: 'main'
  }
});

await installer.install();
```

### 仅检测，不安装

```javascript
const installer = new GitAutoInstaller({
  autoInstall: false  // 禁用自动安装
});

const gitStatus = await installer.isGitInstalled();

if (!gitStatus.installed) {
  console.log('Git 未安装，请手动安装');
  process.exit(1);
}
```

### 静默模式

```javascript
const installer = new GitAutoInstaller({
  silent: true  // 减少输出
});

await installer.install();
```

### 使用 Git Bash 执行复杂命令

```javascript
const installer = new GitAutoInstaller();

// 执行多行命令
const result = await installer.executeWithGitBash(`
  cd /tmp
  mkdir -p test-project
  cd test-project
  git init
  echo "Hello" > README.md
  git add .
  git commit -m "Initial commit"
`);

console.log(result.stdout);
```

## 🔍 故障排除

### 问题 1: 找不到 Git Bash

**解决方案:**

```javascript
const installer = new GitAutoInstaller();
await installer.install();

const bashPath = installer.getGitBashPath();
console.log('Git Bash 路径:', bashPath);

// 如果仍然找不到，手动设置
if (!bashPath) {
  process.env.GIT_BASH_PATH = 'C:\\Program Files\\Git\\bin\\bash.exe';
}
```

### 问题 2: 自动安装失败

**解决方案:**

1. 手动安装 Git: https://git-scm.com
2. 或者使用包管理器：
   - Windows: `winget install Git.Git`
   - macOS: `brew install git`
   - Linux: `sudo apt install git`

### 问题 3: 权限错误

**解决方案（Windows）:**

以管理员身份运行 PowerShell 或命令提示符。

## 📊 支持的操作系统

| 操作系统 | 包管理器 | 状态 |
|---------|---------|------|
| Windows | Winget | ✅ |
| Windows | Chocolatey | ✅ |
| Windows | Scoop | ✅ |
| macOS | Homebrew | ✅ |
| macOS | Xcode CLI | ✅ |
| Linux | apt | ✅ |
| Linux | dnf/yum | ✅ |
| Linux | pacman | ✅ |

## 🎯 最佳实践

1. **在工具启动时配置**: 在你的工具启动时运行 `git-autoinstaller`
2. **检查返回值**: 验证 `gitBashPath` 是否存在
3. **使用环境变量**: 利用 `process.env.GIT_BASH_PATH` 在其他地方访问
4. **错误处理**: 捕获并处理安装失败的情况
5. **日志记录**: 在生产环境中记录安装过程

## 📚 更多资源

- [完整文档](README.md)
- [API 参考](README.md#api-参考)
- [示例代码](example-codebuddy.js)

## 💡 提示

- 首次运行会自动检测和配置 Git
- 如果 Git 已安装，会跳过安装步骤
- 环境变量在当前进程有效，如需全局生效，请手动设置系统环境变量
- Git Bash 路径会被缓存，可重复使用

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！