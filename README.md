# Git AutoInstaller

自动检测、安装和配置 Git 的 npm 包，支持跨平台部署，特别为需要 Git Bash 的工具（如 CodeBuddy）设计。

## 特性

- ✅ 自动检测 Git 是否已安装
- ✅ 跨平台自动安装 Git（Windows/macOS/Linux）
- ✅ 自动查找和配置 Git Bash 路径
- ✅ 设置环境变量供其他工具使用
- ✅ 支持静默模式和自定义配置
- ✅ 提供 API 和 CLI 两种使用方式

## 安装

```bash
npm install git-autoinstaller
```

## 使用方法

### 1. 作为 CLI 工具使用

```bash
# 全局安装
npm install -g git-autoinstaller

# 基本使用
git-autoinstall

# 静默模式
git-autoinstall --silent

# 安装 Git 和 CodeBuddy
git-autoinstall --install-codebuddy

# 仅检测，不自动安装
git-autoinstall --no-auto-install
```

### 2. 作为 npm 包使用

```javascript
const GitAutoInstaller = require('git-autoinstaller');

// 创建安装器实例
const installer = new GitAutoInstaller({
  autoInstall: true,           // 自动安装 Git
  configureGitBash: true,      // 配置 Git Bash
  installCodeBuddy: false,     // 是否安装 CodeBuddy
  gitConfig: {                 // Git 配置
    userName: 'Your Name',
    userEmail: 'your.email@example.com',
    defaultBranch: 'main'
  }
});

// 执行安装
async function setupGit() {
  try {
    const result = await installer.install();
    console.log('安装成功:', result);
    
    // 获取 Git Bash 路径
    const bashPath = installer.getGitBashPath();
    console.log('Git Bash 路径:', bashPath);
    
    // 使用 Git Bash 执行命令
    const output = await installer.executeWithGitBash('git --version');
    console.log('Git 版本:', output.stdout);
  } catch (error) {
    console.error('安装失败:', error);
  }
}

setupGit();
```

### 3. 在其他工具中使用

```javascript
const GitAutoInstaller = require('git-autoinstaller');

async function setupCodeBuddy() {
  // 1. 确保 Git 和 Git Bash 可用
  const installer = new GitAutoInstaller({
    autoInstall: true,
    configureGitBash: true
  });
  
  await installer.install();
  
  // 2. 获取 Git Bash 路径
  const bashPath = installer.getGitBashPath();
  
  if (!bashPath) {
    throw new Error('Git Bash 未找到，无法运行 CodeBuddy');
  }
  
  // 3. 使用 Git Bash 运行 CodeBuddy
  const result = await installer.executeWithGitBash('codebuddy --help');
  console.log(result.stdout);
}
```

## 环境变量

安装完成后，会设置以下环境变量：

- `GIT_BASH_PATH`: Git Bash 可执行文件的完整路径
- `GIT_INSTALL_ROOT`: Git 安装根目录

这些环境变量可以被其他工具使用：

```javascript
const gitBashPath = process.env.GIT_BASH_PATH;
const gitInstallRoot = process.env.GIT_INSTALL_ROOT;
```

## 支持的操作系统

### Windows

- **Winget** (Windows 10/11 内置)
- **Chocolatey**
- **Scoop**
- 官方安装程序

### macOS

- **Homebrew**
- **Xcode Command Line Tools**

### Linux

- **apt** (Debian/Ubuntu)
- **dnf** (Fedora/RHEL/CentOS)
- **yum** (旧版本 Fedora/RHEL/CentOS)
- **pacman** (Arch Linux)

## Git Bash 路径检测

工具会自动搜索以下位置的 Git Bash：

### Windows

- `C:\Program Files\Git\bin\bash.exe`
- `C:\Program Files\Git\usr\bin\bash.exe`
- `C:\Program Files (x86)\Git\bin\bash.exe`
- `C:\Program Files (x86)\Git\usr\bin\bash.exe`
- `E:\PortableGit\bin\bash.exe`
- 从 `git.exe` 路径推断

### macOS/Linux

Git Bash 在 Unix 系统上通常就是 `/bin/bash`，可以直接使用。

## API 参考

### GitAutoInstaller

#### 构造函数

```javascript
new GitAutoInstaller(options)
```

**参数:**
- `options.silent` (boolean): 静默模式，默认 false
- `options.autoInstall` (boolean): 自动安装 Git，默认 true
- `options.configureGitBash` (boolean): 配置 Git Bash，默认 true
- `options.installCodeBuddy` (boolean): 安装 CodeBuddy，默认 false
- `options.gitConfig` (object): Git 配置选项

#### 方法

##### `detectOS()`

检测操作系统类型。

**返回:** `'windows' | 'macos' | 'linux' | 'unknown'`

##### `isGitInstalled()`

检查 Git 是否已安装。

**返回:** Promise<{ installed: boolean, path: string, version: string }>

##### `findGitBashPath()`

查找 Git Bash 路径。

**返回:** `string | null`

##### `configureGitBashEnv()`

配置 Git Bash 环境变量。

**返回:** Promise<boolean>

##### `installGit()`

安装 Git。

**返回:** Promise<boolean>

##### `configureGit(config)`

配置 Git。

**参数:**
- `config.userName` (string): 用户名
- `config.userEmail` (string): 邮箱
- `config.defaultBranch` (string): 默认分支名，默认 'main'

**返回:** Promise<void>

##### `installCodeBuddy()`

安装 CodeBuddy。

**返回:** Promise<boolean>

##### `install()`

执行完整的安装流程。

**返回:** Promise<{ success: boolean, git: object, gitBashPath: string, os: string }>

##### `getGitBashPath()`

获取 Git Bash 路径。

**返回:** `string | null`

##### `executeWithGitBash(command, options)`

使用 Git Bash 执行命令。

**参数:**
- `command` (string): 要执行的命令
- `options` (object): spawn 选项

**返回:** Promise<{ stdout: string, stderr: string, code: number }>

## 故障排除

### 找不到 Git Bash

如果工具报告找不到 Git Bash：

1. 确保 Git 已正确安装
2. 检查 Git 安装路径是否在标准位置
3. 手动设置环境变量：
   ```javascript
   process.env.GIT_BASH_PATH = 'C:\\Program Files\\Git\\bin\\bash.exe';
   ```

### 自动安装失败

如果自动安装失败：

1. 手动从 https://git-scm.com 下载并安装 Git
2. 确保有管理员权限（Windows）
3. 检查包管理器是否正确安装

### CodeBuddy 找不到 Git Bash

确保在运行 CodeBuddy 之前：

1. 先运行 `git-autoinstaller` 配置环境
2. 检查 `process.env.GIT_BASH_PATH` 是否已设置
3. 使用 `installer.executeWithGitBash()` 执行 CodeBuddy

## 示例项目

### 在 CodeBuddy 集成中使用

```javascript
const GitAutoInstaller = require('git-autoinstaller');

async function initializeCodeBuddy() {
  const installer = new GitAutoInstaller({
    autoInstall: true,
    configureGitBash: true
  });
  
  // 确保环境就绪
  await installer.install();
  
  // 获取 Git Bash 路径
  const bashPath = installer.getGitBashPath();
  
  if (!bashPath) {
    throw new Error('无法找到 Git Bash');
  }
  
  // 使用 Git Bash 运行 CodeBuddy
  await installer.executeWithGitBash('codebuddy init');
  
  console.log('CodeBuddy 初始化完成！');
}

initializeCodeBuddy();
```

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！