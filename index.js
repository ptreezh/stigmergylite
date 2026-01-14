const which = require('which');
const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

class GitAutoInstaller {
  constructor(options = {}) {
    this.options = {
      silent: options.silent || false,
      autoInstall: options.autoInstall !== false,
      configureGitBash: options.configureGitBash !== false,
      // 默认安装所有基础工具和 CLI 工具
      installCodeBuddy: options.installCodebuddy !== false,
      installOpenCode: options.installOpenCode !== false,
      installBun: options.installBun !== false,
      installOhMyOpenCode: options.installOhMyOpenCode !== false,
      installIflowCLI: options.installIflowCLI !== false,
      installQoderCLI: options.installQoderCLI !== false,
      installQwenCLI: options.installQwenCLI !== false,
      installCodebuddy: options.installCodebuddy !== false,
      ...options
    };
  }

  log(message, type = 'info') {
    if (!this.options.silent) {
      const prefix = {
        'info': 'ℹ️',
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
      }[type] || 'ℹ️';
      console.log(`${prefix} ${message}`);
    }
  }

  /**
   * 检测操作系统
   */
  detectOS() {
    const platform = os.platform();
    if (platform === 'win32') {
      return 'windows';
    } else if (platform === 'darwin') {
      return 'macos';
    } else if (platform === 'linux') {
      return 'linux';
    }
    return 'unknown';
  }

  /**
   * 检测 Git 是否已安装
   */
  async isGitInstalled() {
    try {
      const gitPath = which.sync('git');
      this.log(`Git 已安装: ${gitPath}`, 'success');
      return {
        installed: true,
        path: gitPath,
        version: this.getGitVersion()
      };
    } catch (error) {
      this.log('Git 未安装', 'warning');
      return {
        installed: false,
        path: null,
        version: null
      };
    }
  }

  /**
   * 获取 Git 版本
   */
  getGitVersion() {
    try {
      const version = execSync('git --version', { encoding: 'utf-8' });
      return version.trim();
    } catch (error) {
      return null;
    }
  }

  /**
   * 检测当前运行环境
   */
  detectEnvironment() {
    // 检测是否在Docker容器中
    const isDocker = () => {
      try {
        fs.statSync('/.dockerenv');
        return true;
      } catch (error) {
        try {
          return fs.readFileSync('/proc/self/cgroup', 'utf8').includes('docker');
        } catch (error) {
          return false;
        }
      }
    };

    // 检测是否有sudo权限
    const hasSudo = () => {
      try {
        execSync('sudo -n true', { stdio: 'pipe' });
        return true;
      } catch (error) {
        return false;
      }
    };

    return {
      isDocker: isDocker(),
      hasSudo: hasSudo(),
      osType: this.detectOS()
    };
  }

  /**
   * 在受限权限环境中安装Git
   */
  async installGitInRestrictedEnvironment() {
    const envInfo = this.detectEnvironment();

    if (envInfo.isDocker) {
      this.log('检测到Docker环境，无法自动安装Git，请在Dockerfile中预安装', 'warning');
      this.log('建议在Dockerfile中添加: RUN apk add --no-cache git (Alpine) 或 RUN apt-get install -y git (Ubuntu)', 'info');
      return false;
    } else if (!envInfo.hasSudo) {
      this.log('检测到无sudo权限，尝试用户级安装...', 'info');

      // 尝试使用用户级包管理器（仅适用于有brew的情况）
      if (this.commandExists('brew')) {
        try {
          // Homebrew 不支持 --user 参数，直接安装到用户目录
          execSync('brew install git', {
            stdio: this.options.silent ? 'pipe' : 'inherit',
            timeout: 300000
          });
          this.log('Git 通过 Homebrew 安装成功', 'success');
          return true;
        } catch (error) {
          this.log('Homebrew 安装失败，尝试其他方法...', 'warning');
        }
      }

      // 根据操作系统选择安装方法
      const osType = this.detectOS();
      if (osType === 'windows') {
        return await this.installGitOnWindowsUser();
      } else if (osType === 'linux') {
        return await this.installGitOnLinuxUser();
      } else if (osType === 'macos') {
        return await this.installGitOnMacOSUser();
      }
    }

    return false;
  }

  /**
   * 查找 Git Bash 路径（改进版，支持多平台）
   */
  findGitBashPath() {
    const osType = this.detectOS();

    // 非Windows系统，CodeBuddy可能不需要Git Bash，只需检查是否有Git命令
    if (osType !== 'windows') {
      // 在Linux/macOS上，如果安装了Git for Windows via WSL或类似环境
      if (osType === 'linux') {
        // 检查WSL环境下的Git Bash
        const wslGitBashPaths = [
          '/mnt/c/Program Files/Git/bin/bash.exe',
          '/mnt/c/Program Files (x86)/Git/bin/bash.exe'
        ];

        for (const bashPath of wslGitBashPaths) {
          if (fs.existsSync(bashPath)) {
            this.log(`找到WSL兼容的 Git Bash: ${bashPath}`, 'success');
            return bashPath;
          }
        }
      }

      // 对于非Windows系统，如果CodeBuddy需要Git Bash兼容性，返回系统bash
      // 否则，返回null表示不需要Git Bash
      try {
        const gitPath = which.sync('git');
        this.log(`在非Windows系统上找到 Git: ${gitPath}`, 'info');
        // 如果CodeBuddy需要Git Bash环境，可以返回系统bash
        const systemBash = '/bin/bash';
        if (fs.existsSync(systemBash)) {
          this.log(`找到系统bash: ${systemBash}`, 'info');
          return systemBash;
        }
      } catch (error) {
        // Git未安装
        this.log('在非Windows系统上未找到Git命令', 'warning');
      }

      return null;
    }

    // Windows系统的原有逻辑 - Git Bash是必需的
    const possiblePaths = [
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Program Files\\Git\\usr\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\usr\\bin\\bash.exe',
      'E:\\PortableGit\\bin\\bash.exe',
      'E:\\PortableGit\\usr\\bin\\bash.exe',
      path.join(process.env.ProgramFiles || '', 'Git', 'bin', 'bash.exe'),
      path.join(process.env['ProgramFiles(x86)'] || '', 'Git', 'bin', 'bash.exe'),
      path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Programs', 'Git', 'bin', 'bash.exe')
    ];

    for (const bashPath of possiblePaths) {
      if (fs.existsSync(bashPath)) {
        this.log(`找到 Git Bash: ${bashPath}`, 'success');
        return bashPath;
      }
    }

    // 尝试从git.exe的路径推断bash.exe
    try {
      const gitPath = which.sync('git');
      const gitDir = path.dirname(gitPath);
      const bashPath = path.join(gitDir, 'bash.exe');

      if (fs.existsSync(bashPath)) {
        this.log(`从 git.exe 推断 Git Bash: ${bashPath}`, 'success');
        return bashPath;
      }
    } catch (error) {
      // 忽略错误
    }

    this.log('未找到 Git Bash', 'warning');
    return null;
  }

  /**
   * 配置 Git Bash 环境变量
   */
  async configureGitBashEnv() {
    const bashPath = this.findGitBashPath();
    const osType = this.detectOS();

    // 对于Windows系统，Git Bash是必需的
    if (osType === 'windows' && !bashPath) {
      this.log('无法配置 Git Bash：Windows系统需要 Git Bash', 'error');
      return false;
    }

    // 对于非Windows系统，只要有Git命令即可
    if (osType !== 'windows') {
      if (!(await this.validateGitAvailability())) {
        this.log('无法配置环境：Git 未安装', 'error');
        return false;
      }
      // 在非Windows系统上，我们仍然设置环境变量，但值可能是系统bash或null
      if (bashPath) {
        process.env.GIT_BASH_PATH = bashPath;
        this.log(`已设置 GIT_BASH_PATH=${bashPath}`, 'success');
      } else {
        // 即使没有找到特定的bash，只要有git命令，我们也认为环境配置成功
        this.log('Git 已安装，非Windows系统不需要特定的 Git Bash', 'success');
        return true;
      }
    } else {
      // Windows系统：设置Git Bash路径
      process.env.GIT_BASH_PATH = bashPath;
      process.env.GIT_INSTALL_ROOT = path.dirname(path.dirname(bashPath));
      this.log(`已设置 GIT_BASH_PATH=${bashPath}`, 'success');
      this.log(`已设置 GIT_INSTALL_ROOT=${process.env.GIT_INSTALL_ROOT}`, 'success');
    }

    return true;
  }

  /**
   * 安装 Git
   */
  async installGit() {
    const osType = this.detectOS();
    
    this.log(`检测到操作系统: ${osType}`, 'info');
    this.log('开始安装 Git...', 'info');

    try {
      switch (osType) {
        case 'windows':
          return await this.installGitOnWindows();
        case 'macos':
          return await this.installGitOnMacOS();
        case 'linux':
          return await this.installGitOnLinux();
        default:
          throw new Error(`不支持的操作系统: ${osType}`);
      }
    } catch (error) {
      this.log(`Git 安装失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 在 Windows 上安装 Git
   */
  async installGitOnWindows() {
    this.log('在 Windows 上安装 Git...', 'info');

    // 方法 1: 尝试使用 winget
    if (this.commandExists('winget')) {
      this.log('使用 winget 安装 Git...', 'info');
      try {
        execSync('winget install --id Git.Git -e --source winget --accept-package-agreements --accept-source-agreements', {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 300000
        });
        this.log('Git 通过 winget 安装成功', 'success');
        return true;
      } catch (error) {
        this.log('winget 安装失败，尝试其他方法...', 'warning');
      }
    }

    // 方法 2: 尝试使用 chocolatey
    if (this.commandExists('choco')) {
      this.log('使用 chocolatey 安装 Git...', 'info');
      try {
        execSync('choco install git -y', {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 300000
        });
        this.log('Git 通过 chocolatey 安装成功', 'success');
        return true;
      } catch (error) {
        this.log('chocolatey 安装失败，尝试其他方法...', 'warning');
      }
    }

    // 方法 3: 尝试使用 scoop
    if (this.commandExists('scoop')) {
      this.log('使用 scoop 安装 Git...', 'info');
      try {
        execSync('scoop install git', {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 300000
        });
        this.log('Git 通过 scoop 安装成功', 'success');
        return true;
      } catch (error) {
        this.log('scoop 安装失败...', 'warning');
      }
    }

    // 方法 4: 尝试用户级安装（无管理员权限）
    this.log('尝试用户级安装 Git（无需管理员权限）...', 'info');
    const userInstallResult = await this.installGitOnWindowsUser();
    if (userInstallResult) {
      return true;
    }

    // 方法 5: 下载官方安装程序
    this.log('无法自动安装 Git，请手动从 https://git-scm.com/download/win 下载并安装 Git', 'warning');
    this.log('安装后需要重新运行此脚本', 'warning');

    throw new Error('无法自动安装 Git，请手动安装');
  }

  /**
   * 在 Windows 上安装 Git（用户级，无管理员权限）
   * 使用便携版 Git
   */
  async installGitOnWindowsUser() {
    this.log('下载便携版 Git 到用户目录...', 'info');

    try {
      const https = require('https');
      const http = require('http');
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      // 用户目录
      const userDir = path.join(os.homedir(), 'git-portable');
      fs.mkdirSync(userDir, { recursive: true });

      // Git for Windows 便携版下载链接（使用最新版本）
      const gitUrl = 'https://github.com/git-for-windows/git/releases/download/v2.47.0.windows.2/MinGit-2.47.0-64-bit.zip';
      const zipPath = path.join(os.tmpdir(), 'MinGit.zip');

      this.log(`正在下载 Git 便携版: ${gitUrl}`, 'info');

      // 下载文件
      await this.downloadFile(gitUrl, zipPath);

      this.log('正在解压 Git...', 'info');

      // 解压 ZIP 文件（使用 PowerShell 内置功能）
      const extractScript = `
        Expand-Archive -Path "${zipPath}" -DestinationPath "${userDir}" -Force
      `;

      execSync(`powershell.exe -Command "${extractScript}"`, {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 删除下载的 ZIP 文件
      fs.unlinkSync(zipPath);

      // 配置 Git
      const gitBinPath = path.join(userDir, 'mingw64', 'bin');
      const gitExePath = path.join(gitBinPath, 'git.exe');

      // 设置环境变量（仅对当前进程有效）
      process.env.PATH = `${gitBinPath};${process.env.PATH}`;
      process.env.GIT_INSTALL_ROOT = userDir;

      // 配置 Git
      execSync(`"${gitExePath}" config --global core.autocrlf true`, { stdio: 'pipe' });
      execSync(`"${gitExePath}" config --global core.longpaths true`, { stdio: 'pipe' });
      execSync(`"${gitExePath}" config --global core.quotepath off`, { stdio: 'pipe' });

      // 持久化 PATH 到用户环境变量（无需管理员权限）
      await this.persistUserPath(gitBinPath, 'windows');

      this.log(`Git 便携版安装成功: ${gitExePath}`, 'success');
      this.log(`Git 路径已添加到用户 PATH 环境变量`, 'success');

      // 显示重启终端的具体指示
      console.log('\n' + '='.repeat(60));
      console.log('📌 重要提示：请重启终端以使环境变量生效');
      console.log('='.repeat(60));
      console.log('\n为了让其他 CLI 工具（如 Qoder CLI、CodeBuddy、iFlow CLI 等）');
      console.log('能够检测到 Git，您需要执行以下操作之一：\n');
      console.log('  选项 1（推荐）: 关闭当前终端窗口，然后重新打开\n');
      console.log('  选项 2: 按 Ctrl+C 退出当前进程，然后重新运行命令\n');
      console.log('\n重启后，所有 CLI 工具将自动检测到 Git。\n');
      console.log('='.repeat(60) + '\n');

      return true;
    } catch (error) {
      this.log(`便携版 Git 安装失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 下载文件（支持 HTTP 和 HTTPS）
   */
  downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const http = require('http');
      const fs = require('fs');
      const urlModule = require('url');

      const protocol = urlModule.parse(url).protocol === 'https:' ? https : http;
      const file = fs.createWriteStream(destPath);

      protocol.get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // 处理重定向
          fs.unlinkSync(destPath);
          this.downloadFile(response.headers.location, destPath)
            .then(resolve)
            .catch(reject);
          return;
        }

        if (response.statusCode !== 200) {
          reject(new Error(`下载失败，HTTP 状态码: ${response.statusCode}`));
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;

        response.pipe(file);

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          if (!this.options.silent && totalSize) {
            const progress = ((downloadedSize / totalSize) * 100).toFixed(2);
            process.stdout.write(`\r下载进度: ${progress}%`);
          }
        });

        file.on('finish', () => {
          if (!this.options.silent) {
            console.log('\n');
          }
          file.close();
          resolve();
        });

        file.on('error', (err) => {
          fs.unlink(destPath, () => {});
          reject(err);
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
  }

  /**
   * 在 macOS 上安装 Git
   */
  async installGitOnMacOS() {
    this.log('在 macOS 上安装 Git...', 'info');

    // 方法 1: 使用 Homebrew
    if (this.commandExists('brew')) {
      this.log('使用 Homebrew 安装 Git...', 'info');
      try {
        execSync('brew install git', {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 300000
        });
        this.log('Git 通过 Homebrew 安装成功', 'success');
        return true;
      } catch (error) {
        this.log('Homebrew 安装失败...', 'warning');
      }
    }

    // 方法 2: 使用 Xcode Command Line Tools
    this.log('尝试安装 Xcode Command Line Tools...', 'info');
    try {
      execSync('xcode-select --install', {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });
      this.log('Xcode Command Line Tools 安装成功', 'success');
      return true;
    } catch (error) {
      this.log('Xcode Command Line Tools 安装失败...', 'warning');
    }

    // 如果上述方法都失败，尝试无权限安装
    this.log('尝试无权限安装 Git...', 'info');
    return await this.installGitInRestrictedEnvironment();
  }

  /**
   * 在 Linux 上安装 Git
   */
  async installGitOnLinux() {
    this.log('在 Linux 上安装 Git...', 'info');

    // 方法 1: 使用 apt (Debian/Ubuntu)
    if (this.commandExists('apt-get')) {
      this.log('使用 apt-get 安装 Git...', 'info');
      try {
        execSync('sudo apt-get update && sudo apt-get install -y git-all', {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 300000
        });
        this.log('Git 通过 apt-get 安装成功', 'success');
        return true;
      } catch (error) {
        this.log('apt-get 安装失败...', 'warning');
      }
    }

    // 方法 2: 使用 dnf (Fedora/RHEL/CentOS)
    if (this.commandExists('dnf')) {
      this.log('使用 dnf 安装 Git...', 'info');
      try {
        execSync('sudo dnf install -y git-all', {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 300000
        });
        this.log('Git 通过 dnf 安装成功', 'success');
        return true;
      } catch (error) {
        this.log('dnf 安装失败...', 'warning');
      }
    }

    // 方法 3: 使用 yum (老版本 Fedora/RHEL/CentOS)
    if (this.commandExists('yum')) {
      this.log('使用 yum 安装 Git...', 'info');
      try {
        execSync('sudo yum install -y git-all', {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 300000
        });
        this.log('Git 通过 yum 安装成功', 'success');
        return true;
      } catch (error) {
        this.log('yum 安装失败...', 'warning');
      }
    }

    // 方法 4: 使用 pacman (Arch Linux)
    if (this.commandExists('pacman')) {
      this.log('使用 pacman 安装 Git...', 'info');
      try {
        execSync('sudo pacman -S --noconfirm git', {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 300000
        });
        this.log('Git 通过 pacman 安装成功', 'success');
        return true;
      } catch (error) {
        this.log('pacman 安装失败...', 'warning');
      }
    }

    // 如果上述方法都失败，尝试无sudo安装
    this.log('尝试无sudo权限安装 Git...', 'info');
    return await this.installGitInRestrictedEnvironment();
  }

  /**
   * 在 Linux 上安装 Git（用户级，无 sudo 权限）
   * 使用预编译的二进制文件
   */
  async installGitOnLinuxUser() {
    this.log('下载预编译的 Git 二进制文件到用户目录...', 'info');

    try {
      const path = require('path');
      const os = require('os');
      const { execSync } = require('child_process');

      // 检测系统架构
      const arch = os.arch();
      const platform = os.platform();

      let gitUrl;
      let extractPath = path.join(os.homedir(), 'git-user');

      // 根据架构选择合适的预编译版本
      if (arch === 'x64') {
        // 64位系统
        if (platform === 'linux') {
          gitUrl = 'https://github.com/git/git/releases/download/v2.47.0/git-2.47.0-x86_64.tar.gz';
        }
      } else if (arch === 'arm64') {
        // ARM64 系统
        if (platform === 'linux') {
          gitUrl = 'https://github.com/git/git/releases/download/v2.47.0/git-2.47.0-aarch64.tar.gz';
        }
      } else {
        throw new Error(`不支持的架构: ${arch}`);
      }

      // 创建用户目录
      const tempDir = path.join(os.tmpdir(), 'git-install');
      const tarPath = path.join(tempDir, 'git.tar.gz');
      const fs = require('fs');

      fs.mkdirSync(tempDir, { recursive: true });

      this.log(`正在下载 Git: ${gitUrl}`, 'info');

      // 使用 curl 或 wget 下载
      if (this.commandExists('curl')) {
        execSync(`curl -L -o "${tarPath}" "${gitUrl}"`, {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 600000
        });
      } else if (this.commandExists('wget')) {
        execSync(`wget -O "${tarPath}" "${gitUrl}"`, {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 600000
        });
      } else {
        throw new Error('需要 curl 或 wget 来下载 Git');
      }

      this.log('正在解压 Git...', 'info');

      // 解压到用户目录
      fs.mkdirSync(extractPath, { recursive: true });
      execSync(`tar -xzf "${tarPath}" -C "${extractPath}" --strip-components=1`, {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 清理临时文件
      fs.unlinkSync(tarPath);
      fs.rmdirSync(tempDir);

      // 配置环境变量
      const gitBinPath = extractPath;
      process.env.PATH = `${gitBinPath}:${process.env.PATH}`;
      process.env.GIT_INSTALL_ROOT = extractPath;

      // 配置 Git
      execSync(`${gitBinPath}/git config --global core.autocrlf input`, { stdio: 'pipe' });
      execSync(`${gitBinPath}/git config --global core.longpaths true`, { stdio: 'pipe' });
      execSync(`${gitBinPath}/git config --global core.quotepath off`, { stdio: 'pipe' });

      // 持久化 PATH 到用户环境变量（无需 sudo 权限）
      await this.persistUserPath(gitBinPath, 'linux');

      this.log(`Git 预编译版本安装成功: ${gitBinPath}/git`, 'success');
      this.log(`Git 路径已添加到 ~/.bashrc`, 'success');

      // 显示重启终端的具体指示
      console.log('\n' + '='.repeat(60));
      console.log('📌 重要提示：请重启终端以使环境变量生效');
      console.log('='.repeat(60));
      console.log('\n为了让其他 CLI 工具（如 Qoder CLI、CodeBuddy、iFlow CLI 等）');
      console.log('能够检测到 Git，您需要执行以下操作之一：\n');
      console.log('  选项 1（推荐）: 关闭当前终端，重新打开终端\n');
      console.log('  选项 2: 运行以下命令使配置立即生效：');
      console.log('           source ~/.bashrc\n');
      console.log('  选项 3: 按 Ctrl+C 退出当前进程，然后重新运行命令\n');
      console.log('\n重启后或 source 后，所有 CLI 工具将自动检测到 Git。\n');
      console.log('='.repeat(60) + '\n');

      return true;
    } catch (error) {
      this.log(`预编译 Git 安装失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 在 macOS 上安装 Git（用户级，无 Homebrew）
   */
  async installGitOnMacOSUser() {
    this.log('下载预编译的 Git 二进制文件到用户目录...', 'info');

    try {
      const path = require('path');
      const os = require('os');
      const { execSync } = require('child_process');
      const fs = require('fs');

      // 检测架构
      const arch = os.arch();
      let gitUrl;

      if (arch === 'x64') {
        gitUrl = 'https://github.com/git/git/releases/download/v2.47.0/git-2.47.0-x86_64-apple-darwin.tar.gz';
      } else if (arch === 'arm64') {
        gitUrl = 'https://github.com/git/git/releases/download/v2.47.0/git-2.47.0-arm64-apple-darwin.tar.gz';
      } else {
        throw new Error(`不支持的架构: ${arch}`);
      }

      // 创建用户目录
      const tempDir = path.join(os.tmpdir(), 'git-install');
      const tarPath = path.join(tempDir, 'git.tar.gz');
      const extractPath = path.join(os.homedir(), 'git-user');

      fs.mkdirSync(tempDir, { recursive: true });

      this.log(`正在下载 Git: ${gitUrl}`, 'info');

      // macOS 通常有 curl
      if (this.commandExists('curl')) {
        execSync(`curl -L -o "${tarPath}" "${gitUrl}"`, {
          stdio: this.options.silent ? 'pipe' : 'inherit',
          timeout: 600000
        });
      } else {
        throw new Error('需要 curl 来下载 Git');
      }

      this.log('正在解压 Git...', 'info');

      // 解压到用户目录
      fs.mkdirSync(extractPath, { recursive: true });
      execSync(`tar -xzf "${tarPath}" -C "${extractPath}" --strip-components=1`, {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 清理临时文件
      fs.unlinkSync(tarPath);
      fs.rmdirSync(tempDir);

      // 配置环境变量
      const gitBinPath = extractPath;
      process.env.PATH = `${gitBinPath}:${process.env.PATH}`;
      process.env.GIT_INSTALL_ROOT = extractPath;

      // 配置 Git
      execSync(`${gitBinPath}/git config --global core.autocrlf input`, { stdio: 'pipe' });
      execSync(`${gitBinPath}/git config --global core.longpaths true`, { stdio: 'pipe' });
      execSync(`${gitBinPath}/git config --global core.quotepath off`, { stdio: 'pipe' });

      // 持久化 PATH 到用户环境变量（无需管理员权限）
      await this.persistUserPath(gitBinPath, 'macos');

      this.log(`Git 预编译版本安装成功: ${gitBinPath}/git`, 'success');
      this.log(`Git 路径已添加到 ~/.zshrc (或 ~/.bashrc)`, 'success');

      // 显示重启终端的具体指示
      console.log('\n' + '='.repeat(60));
      console.log('📌 重要提示：请重启终端以使环境变量生效');
      console.log('='.repeat(60));
      console.log('\n为了让其他 CLI 工具（如 Qoder CLI、CodeBuddy、iFlow CLI 等）');
      console.log('能够检测到 Git，您需要执行以下操作之一：\n');
      console.log('  选项 1（推荐）: 关闭当前终端，重新打开终端\n');
      console.log('  选项 2: 运行以下命令使配置立即生效：');
      console.log('           source ~/.zshrc      (如果使用 zsh，这是默认)');
      console.log('           source ~/.bashrc     (如果使用 bash)\n');
      console.log('  选项 3: 按 Ctrl+C 退出当前进程，然后重新运行命令\n');
      console.log('\n重启后或 source 后，所有 CLI 工具将自动检测到 Git。\n');
      console.log('='.repeat(60) + '\n');

      return true;
    } catch (error) {
      this.log(`预编译 Git 安装失败: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * 持久化 PATH 到用户环境变量（无需管理员/sudo 权限）
   */
  async persistUserPath(gitBinPath, osType) {
    try {
      if (osType === 'windows') {
        // Windows: 修改注册表用户级 PATH（无需管理员权限）
        const registryPath = 'HKEY_CURRENT_USER\\Environment';
        const registryKey = 'Path';

        // 使用 PowerShell 读取现有 PATH
        const currentPathCommand = `[System.Environment]::GetEnvironmentVariable("Path", "User")`;
        let currentPath = execSync(`powershell.exe -Command "${currentPathCommand}"`, {
          encoding: 'utf8',
          stdio: 'pipe'
        }).trim();

        // 检查是否已存在
        if (!currentPath.includes(gitBinPath)) {
          // 添加到 PATH
          const newPath = `${gitBinPath};${currentPath}`;
          const setPathCommand = `[System.Environment]::SetEnvironmentVariable("Path", "${newPath}", "User")`;

          execSync(`powershell.exe -Command "${setPathCommand}"`, {
            stdio: this.options.silent ? 'pipe' : 'inherit'
          });

          this.log('已更新用户 PATH 环境变量', 'success');
        } else {
          this.log('PATH 中已包含 Git 路径，跳过更新', 'info');
        }
      } else if (osType === 'linux' || osType === 'macos') {
        // Linux/macOS: 修改 ~/.bashrc 和 ~/.zshrc
        const fs = require('fs');
        const os = require('os');
        const path = require('path');

        const shell = process.env.SHELL || '/bin/bash';
        const useZsh = shell.includes('zsh');

        const bashrcPath = path.join(os.homedir(), '.bashrc');
        const zshrcPath = path.join(os.homedir(), '.zshrc');

        const exportLine = `\n# Git from stigmergylite\nexport PATH="${gitBinPath}:$PATH"\n`;

        // 更新 ~/.bashrc
        if (fs.existsSync(bashrcPath)) {
          const bashrcContent = fs.readFileSync(bashrcPath, 'utf-8');
          if (!bashrcContent.includes(gitBinPath)) {
            fs.appendFileSync(bashrcPath, exportLine);
            this.log('已更新 ~/.bashrc', 'success');
          }
        } else {
          fs.writeFileSync(bashrcPath, exportLine);
          this.log('已创建 ~/.bashrc', 'success');
        }

        // 更新 ~/.zshrc（macOS 默认使用 zsh）
        if (osType === 'macos' || useZsh) {
          if (fs.existsSync(zshrcPath)) {
            const zshrcContent = fs.readFileSync(zshrcPath, 'utf-8');
            if (!zshrcContent.includes(gitBinPath)) {
              fs.appendFileSync(zshrcPath, exportLine);
              this.log('已更新 ~/.zshrc', 'success');
            }
          } else {
            fs.writeFileSync(zshrcPath, exportLine);
            this.log('已创建 ~/.zshrc', 'success');
          }
        }
      }
    } catch (error) {
      this.log(`持久化 PATH 失败: ${error.message}`, 'warning');
      this.log('Git 已安装，但请手动将以下路径添加到 PATH:', 'warning');
      this.log(gitBinPath, 'info');
    }
  }

  /**
   * 检查命令是否存在
   */
  commandExists(command) {
    try {
      which.sync(command);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 配置 Git
   */
  async configureGit(config = {}) {
    const {
      userName = null,
      userEmail = null,
      defaultBranch = 'main'
    } = config;

    // 1. 配置用户名和邮箱（优先使用提供的值）
    if (userName) {
      execSync(`git config --global user.name "${userName}"`, { stdio: 'pipe' });
      this.log(`已设置用户名: ${userName}`, 'success');
    } else {
      // 检查是否已配置
      try {
        const existingName = execSync('git config --global user.name', { encoding: 'utf-8', stdio: 'pipe' }).trim();
        if (existingName) {
          this.log(`用户名已配置: ${existingName}`, 'info');
        }
      } catch (error) {
        // 未配置，使用系统用户名作为默认值
        const defaultName = this.getSystemUsername();
        if (defaultName) {
          execSync(`git config --global user.name "${defaultName}"`, { stdio: 'pipe' });
          this.log(`已设置默认用户名: ${defaultName}`, 'success');
        } else {
          this.log('⚠️  未配置 Git 用户名，请在首次 commit 前设置:', 'warning');
          this.log('  git config --global user.name "Your Name"', 'info');
        }
      }
    }

    if (userEmail) {
      execSync(`git config --global user.email "${userEmail}"`, { stdio: 'pipe' });
      this.log(`已设置邮箱: ${userEmail}`, 'success');
    } else {
      // 检查是否已配置
      try {
        const existingEmail = execSync('git config --global user.email', { encoding: 'utf-8', stdio: 'pipe' }).trim();
        if (existingEmail) {
          this.log(`邮箱已配置: ${existingEmail}`, 'info');
        }
      } catch (error) {
        // 未配置，使用系统邮箱作为默认值
        const defaultEmail = this.getSystemEmail();
        if (defaultEmail) {
          execSync(`git config --global user.email "${defaultEmail}"`, { stdio: 'pipe' });
          this.log(`已设置默认邮箱: ${defaultEmail}`, 'success');
        } else {
          this.log('⚠️  未配置 Git 邮箱，请在首次 commit 前设置:', 'warning');
          this.log('  git config --global user.email "your.email@example.com"', 'info');
        }
      }
    }

    // 2. 配置默认分支
    execSync(`git config --global init.defaultbranch ${defaultBranch}`, { stdio: 'pipe' });
    this.log(`已设置默认分支: ${defaultBranch}`, 'success');

    // 3. Windows 特定配置
    if (this.detectOS() === 'windows') {
      execSync('git config --global core.autocrlf true', { stdio: 'pipe' });
      execSync('git config --global core.longpaths true', { stdio: 'pipe' });
      execSync('git config --global core.quotepath off', { stdio: 'pipe' });
      this.log('已配置 Windows 特定设置', 'success');
    }

    // 4. 配置核心路径设置（确保 Git 能找到自己的可执行文件）
    const gitInstallRoot = process.env.GIT_INSTALL_ROOT || '';
    if (gitInstallRoot) {
      try {
        // 配置 Git 的路径相关设置
        this.log(`Git 安装根目录: ${gitInstallRoot}`, 'info');
      } catch (error) {
        // 忽略错误
      }
    }
  }

  /**
   * 检查 Git 是否已配置用户名和邮箱
   */
  async checkGitConfigured() {
    try {
      const userName = execSync('git config --global user.name', { encoding: 'utf-8', stdio: 'pipe' }).trim();
      const userEmail = execSync('git config --global user.email', { encoding: 'utf-8', stdio: 'pipe' }).trim();

      return !!(userName && userEmail);
    } catch (error) {
      // 未配置或配置不完整
      return false;
    }
  }

  /**
   * 获取系统用户名
   */
  getSystemUsername() {
    try {
      const os = require('os');
      const userInfo = os.userInfo();
      return userInfo.username;
    } catch (error) {
      return null;
    }
  }

  /**
   * 获取系统邮箱
   */
  getSystemEmail() {
    try {
      const os = require('os');
      const userInfo = os.userInfo();

      // 尝试从 username 推断邮箱
      const username = userInfo.username;
      const domains = ['localhost', 'localdomain']; // 不应该使用这些域名

      if (username && !domains.includes(os.hostname())) {
        return `${username}@${os.hostname() || 'localhost'}`;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * 安装 CodeBuddy
   */
  async installCodeBuddy() {
    this.log('开始安装 CodeBuddy...', 'info');

    try {
      // 检查 CodeBuddy 是否已安装
      if (this.commandExists('codebuddy')) {
        this.log('CodeBuddy 已安装', 'success');
        return true;
      }

      this.log('执行: npm i -g @tencent-ai/codebuddy-code', 'info');
      execSync('npm i -g @tencent-ai/codebuddy-code', {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 验证安装
      const version = execSync('codebuddy --version', { encoding: 'utf-8' });
      this.log(`CodeBuddy 安装成功: ${version.trim()}`, 'success');
      return true;
    } catch (error) {
      this.log(`CodeBuddy 安装失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 安装 iFlow CLI
   */
  async installIflowCLI() {
    this.log('开始安装 iFlow CLI...', 'info');

    try {
      // 检查 iFlow CLI 是否已安装
      if (this.commandExists('iflow')) {
        this.log('iFlow CLI 已安装', 'success');
        return true;
      }

      this.log('执行: npm i -g @iflow-ai/iflow-cli', 'info');
      execSync('npm i -g @iflow-ai/iflow-cli', {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 验证安装
      const version = execSync('iflow --version', { encoding: 'utf-8' });
      this.log(`iFlow CLI 安装成功: ${version.trim()}`, 'success');
      return true;
    } catch (error) {
      this.log(`iFlow CLI 安装失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 安装 QoderCLI
   */
  async installQoderCLI() {
    this.log('开始安装 QoderCLI...', 'info');

    try {
      // 检查 QoderCLI 是否已安装
      if (this.commandExists('qodercli')) {
        this.log('QoderCLI 已安装', 'success');
        return true;
      }

      this.log('执行: npm install -g @qoder-ai/qodercli', 'info');
      execSync('npm install -g @qoder-ai/qodercli', {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 验证安装
      const version = execSync('qodercli --version', { encoding: 'utf-8' });
      this.log(`QoderCLI 安装成功: ${version.trim()}`, 'success');
      return true;
    } catch (error) {
      this.log(`QoderCLI 安装失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 安装 Qwen CLI
   */
  async installQwenCLI() {
    this.log('开始安装 Qwen CLI...', 'info');

    try {
      // 检查 Qwen CLI 是否已安装
      if (this.commandExists('qwen')) {
        this.log('Qwen CLI 已安装', 'success');
        return true;
      }

      this.log('执行: npm i -g @qwen-code/qwen-code', 'info');
      execSync('npm i -g @qwen-code/qwen-code', {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 验证安装
      const version = execSync('qwen --version', { encoding: 'utf-8' });
      this.log(`Qwen CLI 安装成功: ${version.trim()}`, 'success');
      return true;
    } catch (error) {
      this.log(`Qwen CLI 安装失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 安装 OpenCode
   */
  async installOpenCode() {
    this.log('开始安装 OpenCode...', 'info');

    // 检查是否已安装
    if (this.commandExists('opencode')) {
      this.log('OpenCode 已安装', 'success');
      return true;
    }

    // 检测操作系统和架构
    const platform = os.platform();
    const arch = os.arch();

    // OpenCode 支持的平台和架构组合
    const supportedPlatforms = [
      { platform: 'win32', arch: 'x64', package: 'opencode-windows-x64' },
      { platform: 'darwin', arch: 'x64', package: 'opencode-darwin-x64' },
      { platform: 'darwin', arch: 'arm64', package: 'opencode-darwin-arm64' },
      { platform: 'linux', arch: 'x64', package: 'opencode-linux-x64' },
      { platform: 'linux', arch: 'arm64', package: 'opencode-linux-arm64' },
    ];

    // 检查当前平台是否支持
    const isSupported = supportedPlatforms.some(
      p => p.platform === platform && p.arch === arch
    );

    // Windows ARM64 不受支持 - 明确跳过
    if (platform === 'win32' && arch === 'arm64') {
      this.log('⚠️  检测到 Windows ARM64 架构', 'warning');
      this.log('❌ OpenCode 目前不支持 Windows ARM64 架构', 'error');
      this.log('', 'info');
      this.log('可能的解决方案：', 'info');
      this.log('  1. 使用 WSL2 (Windows Subsystem for Linux) 安装 Linux 版本', 'info');
      this.log('     在 WSL2 中运行: npm install -g opencode-ai', 'info');
      this.log('  2. 等待 OpenCode 官方发布 Windows ARM64 版本', 'info');
      this.log('  3. 使用其他 AI CLI 工具（CodeBuddy、iFlow、Qoder、Qwen 均支持 ARM64）', 'info');
      this.log('', 'info');
      this.log('跳过 OpenCode 安装，继续安装其他工具...', 'info');
      return false;
    }

    // 其他不受支持的平台 - 警告但仍尝试安装
    if (!isSupported) {
      this.log(`⚠️  当前平台 ${platform} ${arch} 可能不受 OpenCode 官方支持`, 'warning');
      this.log('尝试安装 opencode-ai（可能失败）...', 'info');
    } else {
      this.log(`检测到平台: ${platform} ${arch}`, 'info');
    }

    // 尝试安装
    try {
      this.log('执行: npm install -g opencode-ai', 'info');
      execSync('npm install -g opencode-ai', {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 验证安装
      const version = execSync('opencode --version', { encoding: 'utf-8' });
      this.log(`OpenCode 安装成功: ${version.trim()}`, 'success');
      return true;
    } catch (error) {
      this.log(`OpenCode 安装失败: ${error.message}`, 'error');

      // 如果是架构不支持的错误，提供额外信息并返回 false（不中断流程）
      if (error.message.includes('EBADPLATFORM') ||
          error.message.includes('not found') ||
          error.message.includes('404')) {
        this.log('', 'info');
        this.log('这可能是由于当前架构不受支持导致的', 'warning');
        this.log('请访问 https://www.npmjs.com/package/opencode-ai 查看支持的平台', 'info');
        this.log('', 'info');
        this.log('跳过 OpenCode，继续安装其他工具...', 'info');
        return false; // 返回 false 而不是抛出异常
      }

      // 对于其他错误，仍然抛出异常
      throw error;
    }
  }

  /**
   * 安装 Bun
   */
  async installBun() {
    this.log('开始安装 Bun...', 'info');

    try {
      // 检查是否已安装
      if (this.commandExists('bun')) {
        this.log('Bun 已安装', 'success');
        return true;
      }

      this.log('执行: npm install -g bun', 'info');
      execSync('npm install -g bun', {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 刷新当前进程的 PATH（解决 Windows 上 PATH 未更新的问题）
      const osType = this.detectOS();
      if (osType === 'windows') {
        const npmGlobalPath = path.join(process.env.APPDATA || '', 'npm');
        if (!process.env.PATH.includes(npmGlobalPath)) {
          process.env.PATH = `${npmGlobalPath};${process.env.PATH}`;
          this.log('已刷新 PATH 环境变量', 'info');
        }
      } else {
        const npmGlobalPath = path.join(os.homedir(), '.npm-global', 'bin');
        if (!process.env.PATH.includes(npmGlobalPath)) {
          process.env.PATH = `${npmGlobalPath}:${process.env.PATH}`;
          this.log('已刷新 PATH 环境变量', 'info');
        }
      }

      // 验证安装
      const version = execSync('bun --version', { encoding: 'utf-8' });
      this.log(`Bun 安装成功: ${version.trim()}`, 'success');
      return true;
    } catch (error) {
      this.log(`Bun 安装失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 检查并修复 OpenCode 配置文件
   */
  async checkAndFixOpenCodeConfig() {
    const configDir = path.join(os.homedir(), '.config', 'opencode');
    const configFile = path.join(configDir, 'opencode.json');

    try {
      // 1. 检查配置文件是否存在
      if (!fs.existsSync(configFile)) {
        // 配置文件不存在是正常的，OpenCode 会在首次运行时创建
        return true;
      }

      // 2. 尝试解析配置文件
      try {
        const content = fs.readFileSync(configFile, 'utf-8');
        JSON.parse(content); // 尝试解析
        this.log('✅ OpenCode 配置文件格式正确', 'success');
        return true;
      } catch (error) {
        // 配置文件有语法错误
        this.log('⚠️  OpenCode 配置文件损坏', 'warning');
        this.log(`   文件: ${configFile}`, 'info');
        this.log(`   错误: ${error.message}`, 'info');

        // 备份损坏的配置文件
        const backupFile = `${configFile}.backup.${Date.now()}`;
        try {
          fs.copyFileSync(configFile, backupFile);
          this.log(`   已备份到: ${backupFile}`, 'info');
        } catch (backupError) {
          this.log('   备份失败，继续尝试修复...', 'warning');
        }

        // 尝试修复：创建一个空的有效配置
        try {
          const defaultConfig = {};
          fs.writeFileSync(configFile, JSON.stringify(defaultConfig, null, 2), 'utf-8');
          this.log('✅ 已创建新的默认配置文件', 'success');
          return true;
        } catch (fixError) {
          this.log('❌ 无法修复配置文件', 'error');
          this.log('   请手动删除或修复配置文件:', 'warning');
          this.log(`   ${configFile}`, 'info');
          return false;
        }
      }
    } catch (error) {
      this.log(`检查配置文件时出错: ${error.message}`, 'warning');
      return true; // 不阻塞安装流程
    }
  }

  /**
   * 安装 Oh My OpenCode
   */
  async installOhMyOpenCode() {
    this.log('开始安装 Oh My OpenCode...', 'info');

    try {
      // 1. 检查 Bun 是否可用
      if (!this.commandExists('bun')) {
        throw new Error('Bun 未安装，无法安装 Oh My OpenCode');
      }

      // 2. 检查 OpenCode（Oh My OpenCode 的依赖）
      const opencodeExists = this.commandExists('opencode');
      if (!opencodeExists) {
        this.log('⚠️  OpenCode 未安装', 'warning');
        this.log('   Oh My OpenCode 可能需要 OpenCode 才能正常工作', 'info');
        this.log('   如果安装失败，请先安装 OpenCode', 'info');
      } else {
        // 2.5. 检查并修复 OpenCode 配置文件
        const configOk = await this.checkAndFixOpenCodeConfig();
        if (!configOk) {
          this.log('⚠️  OpenCode 配置文件问题，Oh My OpenCode 安装可能失败', 'warning');
          this.log('   建议手动修复配置文件后重试', 'info');
        }
      }

      // 3. 检查并获取 bunx 命令
      let bunxCommand = 'bunx';
      let bunxPath = null;

      try {
        bunxPath = which.sync('bunx');
        this.log(`✅ bunx 可用: ${bunxPath}`, 'success');
      } catch (error) {
        this.log('⚠️  bunx 命令不可用，尝试刷新 PATH...', 'warning');

        // 尝试刷新 PATH
        const osType = this.detectOS();
        if (osType === 'windows') {
          const npmGlobalPath = path.join(process.env.APPDATA || '', 'npm');
          if (!process.env.PATH.includes(npmGlobalPath)) {
            process.env.PATH = `${npmGlobalPath};${process.env.PATH}`;
            this.log('已刷新 PATH 环境变量', 'info');
          }
        } else {
          const npmGlobalPath = path.join(os.homedir(), '.npm-global', 'bin');
          if (!process.env.PATH.includes(npmGlobalPath)) {
            process.env.PATH = `${npmGlobalPath}:${process.env.PATH}`;
            this.log('已刷新 PATH 环境变量', 'info');
          }
        }

        // 再次检查
        try {
          bunxPath = which.sync('bunx');
          this.log(`✅ bunx 现在可用: ${bunxPath}`, 'success');
        } catch (error2) {
          // 使用 npx 作为后备方案
          this.log('使用 npx 作为后备方案', 'info');
          bunxCommand = 'npx --bun';
        }
      }

      // 4. 尝试安装（带重试机制）
      const maxRetries = 3;
      for (let i = 0; i < maxRetries; i++) {
        try {
          this.log(`尝试安装 Oh My OpenCode (尝试 ${i + 1}/${maxRetries})...`, 'info');

          const command = `${bunxCommand} oh-my-opencode install --no-tui --claude=no --chatgpt=no --gemini=no`;

          execSync(command, {
            stdio: this.options.silent ? 'pipe' : 'inherit',
            timeout: 300000,
            env: {
              ...process.env,
              PATH: process.env.PATH // 确保使用更新后的 PATH
            }
          });

          this.log('Oh My OpenCode 安装成功', 'success');
          return true;

        } catch (error) {
          this.log(`安装失败: ${error.message}`, 'error');

          if (i < maxRetries - 1) {
            // 指数退避重试
            const delay = 1000 * (2 ** i); // 1s, 2s, 4s
            this.log(`${delay / 1000} 秒后重试...`, 'info');
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            // 最后一次尝试也失败了
            this.log('', 'info');
            this.log('Oh My OpenCode 自动安装失败', 'error');
            this.log('', 'info');
            this.log('可能的解决方案：', 'info');

            if (!opencodeExists) {
              this.log('  1. 先安装 OpenCode，然后重试', 'info');
              this.log('     npm install -g opencode-ai', 'info');
              this.log('', 'info');
            }

            this.log('  2. 重启终端后手动运行:', 'info');
            this.log('     bunx oh-my-opencode install --no-tui --claude=no --chatgpt=no --gemini=no', 'info');
            this.log('', 'info');

            this.log('  3. 检查网络连接和防火墙设置', 'info');
            this.log('', 'info');

            this.log('  4. 使用 npx 直接运行:', 'info');
            this.log('     npx --bun oh-my-opencode install --no-tui --claude=no --chatgpt=no --gemini=no', 'info');
            this.log('', 'info');

            // 如果错误消息包含配置文件相关错误，额外提示
            if (error.message && error.message.includes('config')) {
              this.log('  5. 检查 OpenCode 配置文件:', 'info');
              const configFile = path.join(os.homedir(), '.config', 'opencode', 'opencode.json');
              this.log(`     ${configFile}`, 'info');
              this.log('     如果配置文件损坏，请删除或修复它', 'info');
              this.log('', 'info');
            }

            throw new Error(`Oh My OpenCode 安装失败: ${error.message}`);
          }
        }
      }

    } catch (error) {
      // 如果是我们已经处理过的错误，直接重新抛出
      if (error.message.includes('Oh My OpenCode 安装失败')) {
        throw error;
      }

      // 其他错误
      this.log(`Oh My OpenCode 安装失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 主安装流程
   */
  async install() {
    try {
      this.log('='.repeat(50), 'info');
      this.log('开发环境自动安装程序', 'info');
      this.log('='.repeat(50), 'info');

      // 1. 检测操作系统和环境
      const osType = this.detectOS();
      const envInfo = this.detectEnvironment();
      this.log(`操作系统: ${osType}, Docker环境: ${envInfo.isDocker}, 有sudo权限: ${envInfo.hasSudo}`, 'info');

      // 2. 检查 Git 是否已安装
      this.log('\n步骤 1: 检测和安装 Git', 'info');
      const gitStatus = await this.isGitInstalled();

      if (!gitStatus.installed) {
        if (this.options.autoInstall) {
          // 根据环境选择合适的安装方法
          if (envInfo.isDocker) {
            // Docker环境下给出明确提示
            throw new Error('在Docker环境中，请在Dockerfile中预安装Git。建议添加: RUN apk add --no-cache git (Alpine) 或 RUN apt-get install -y git (Ubuntu)');
          } else {
            await this.installGit();
          }

          // 重新检查
          const newGitStatus = await this.isGitInstalled();
          if (!newGitStatus.installed) {
            throw new Error('Git 安装失败');
          }
        } else {
          throw new Error('Git 未安装且自动安装已禁用');
        }
      }

      // 3. 配置 Git Bash 路径
      if (this.options.configureGitBash) {
        await this.configureGitBashEnv();
      }

      // 4. 配置 Git（如果提供了配置或未配置过）
      const gitConfigured = await this.checkGitConfigured();
      if (!gitConfigured || this.options.gitConfig) {
        this.log('\n步骤 4: 配置 Git', 'info');
        await this.configureGit(this.options.gitConfig);
      }

      // 5. 安装 OpenCode
      if (this.options.installOpenCode) {
        this.log('\n步骤 2: 安装 OpenCode', 'info');
        await this.installOpenCode();
      }

      // 6. 安装 Bun
      if (this.options.installBun) {
        this.log('\n步骤 3: 安装 Bun', 'info');
        await this.installBun();
      }

      // 7. 安装 Oh My OpenCode
      if (this.options.installOhMyOpenCode) {
        this.log('\n步骤 4: 安装 Oh My OpenCode', 'info');
        await this.installOhMyOpenCode();
      }

      // 8. 安装 CodeBuddy（如果需要）
      if (this.options.installCodebuddy) {
        this.log('\n步骤 5: 安装 CodeBuddy', 'info');
        await this.installCodeBuddy();
      }

      // 9. 安装 iFlow CLI（如果需要）
      if (this.options.installIflowCLI) {
        this.log('\n步骤 6: 安装 iFlow CLI', 'info');
        await this.installIflowCLI();
      }

      // 10. 安装 Qoder CLI（如果需要）
      if (this.options.installQoderCLI) {
        this.log('\n步骤 7: 安装 Qoder CLI', 'info');
        await this.installQoderCLI();
      }

      // 11. 安装 Qwen CLI（如果需要）
      if (this.options.installQwenCLI) {
        this.log('\n步骤 8: 安装 Qwen CLI', 'info');
        await this.installQwenCLI();
      }

      this.log('\n' + '='.repeat(50), 'success');
      this.log('安装完成！', 'success');
      this.log('='.repeat(50), 'success');

      return {
        success: true,
        git: await this.isGitInstalled(),
        gitBashPath: this.findGitBashPath(),
        opencode: this.commandExists('opencode'),
        bun: this.commandExists('bun'),
        iflow: this.commandExists('iflow'),
        qodercli: this.commandExists('qodercli'),
        qwen: this.commandExists('qwen'),
        codebuddy: this.commandExists('codebuddy'),
        os: osType,
        environment: envInfo
      };
    } catch (error) {
      this.log(`安装失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 验证Git是否可用
   */
  async validateGitAvailability() {
    try {
      const gitPath = which.sync('git');
      this.log(`验证Git可用性: ${gitPath}`, 'success');
      return true;
    } catch (error) {
      this.log('Git不可用，请先安装Git', 'error');
      return false;
    }
  }

  /**
   * 获取 Git Bash 路径（供外部使用）
   */
  getGitBashPath() {
    return this.findGitBashPath();
  }

  /**
   * 使用 Git Bash 执行命令
   */
  async executeWithGitBash(command, options = {}) {
    const bashPath = this.getGitBashPath();
    const osType = this.detectOS();

    // 在Windows上必须有Git Bash
    if (osType === 'windows' && !bashPath) {
      throw new Error('Git Bash 未找到，请先确保 Git for Windows 已正确安装');
    }

    // 在非Windows系统上，如果有bash则使用，否则直接执行命令
    let executable, args;
    if (bashPath && osType === 'windows') {
      // Windows: 使用Git Bash
      executable = bashPath;
      args = ['-c', command];
    } else if (osType !== 'windows') {
      // 非Windows: 直接使用系统bash或尝试执行命令
      if (bashPath) {
        executable = bashPath;
        args = ['-c', command];
      } else {
        // 如果没有找到bash，但有git命令，可以尝试直接执行
        if (await this.validateGitAvailability()) {
          // 对于简单的Git命令，我们可以直接执行
          executable = 'sh';  // 使用sh作为备选
          args = ['-c', command];
        } else {
          throw new Error('Git 未安装，请先安装 Git');
        }
      }
    } else {
      // 其他情况
      throw new Error('无法执行命令：未找到合适的执行环境');
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(executable, args, {
        ...options,
        env: {
          ...process.env,
          ...options.env
        }
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 || (code === undefined && stderr === '')) {
          resolve({ stdout, stderr, code: code || 0 });
        } else {
          reject(new Error(`命令执行失败 (退出码: ${code}): ${stderr}`));
        }
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * 诊断环境和 OpenCode 配置
   */
  async diagnose() {
    const diagnosticResults = {
      system: {},
      tools: {},
      config: {},
      issues: [],
      warnings: []
    };

    this.log('='.repeat(70), 'info');
    this.log('OpenCode 环境诊断', 'info');
    this.log('='.repeat(70), 'info');

    // 1. 系统信息
    this.log('\n【1. 系统信息】', 'info');
    diagnosticResults.system = {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      homeDir: os.homedir()
    };
    this.log(`  平台: ${diagnosticResults.system.platform}`, 'info');
    this.log(`  架构: ${diagnosticResults.system.arch}`, 'info');
    this.log(`  Node.js: ${diagnosticResults.system.nodeVersion}`, 'info');

    // 2. 工具检查
    this.log('\n【2. 工具检查】', 'info');

    // Bun
    const bunExists = this.commandExists('bun');
    diagnosticResults.tools.bun = { installed: bunExists };
    if (bunExists) {
      try {
        const bunVersion = execSync('bun --version', { encoding: 'utf-8' });
        diagnosticResults.tools.bun.version = bunVersion.trim();
        this.log(`  ✅ Bun: ${bunVersion.trim()}`, 'success');
      } catch (error) {
        this.log('  ⚠️  Bun: 已安装但无法获取版本', 'warning');
        diagnosticResults.warnings.push('Bun 已安装但无法获取版本');
      }
    } else {
      this.log('  ❌ Bun: 未安装', 'error');
      diagnosticResults.issues.push('Bun 未安装');
    }

    // bunx
    try {
      const bunxPath = which.sync('bunx');
      diagnosticResults.tools.bunx = { installed: true, path: bunxPath };
      this.log(`  ✅ bunx: ${bunxPath}`, 'success');
    } catch (error) {
      diagnosticResults.tools.bunx = { installed: false };
      this.log('  ❌ bunx: 不可用', 'error');
      diagnosticResults.issues.push('bunx 命令不可用（PATH 问题）');
    }

    // OpenCode
    const opencodeExists = this.commandExists('opencode');
    diagnosticResults.tools.opencode = { installed: opencodeExists };
    if (opencodeExists) {
      try {
        const opencodeVersion = execSync('opencode --version', { encoding: 'utf-8' });
        diagnosticResults.tools.opencode.version = opencodeVersion.trim();
        this.log(`  ✅ OpenCode: ${opencodeVersion.trim()}`, 'success');
      } catch (error) {
        this.log('  ⚠️  OpenCode: 已安装但无法运行', 'warning');
        diagnosticResults.warnings.push('OpenCode 已安装但无法运行');
      }
    } else {
      this.log('  ❌ OpenCode: 未安装', 'error');
      diagnosticResults.issues.push('OpenCode 未安装');
    }

    // Git
    const gitInstalled = await this.isGitInstalled();
    diagnosticResults.tools.git = gitInstalled;
    if (gitInstalled.installed) {
      this.log(`  ✅ Git: ${gitInstalled.version || '已安装'}`, 'success');
    } else {
      this.log('  ❌ Git: 未安装', 'error');
      diagnosticResults.issues.push('Git 未安装');
    }

    // 3. 配置文件检查
    this.log('\n【3. OpenCode 配置文件检查】', 'info');
    const configFile = path.join(os.homedir(), '.config', 'opencode', 'opencode.json');
    diagnosticResults.config.configFile = configFile;

    if (fs.existsSync(configFile)) {
      try {
        const content = fs.readFileSync(configFile, 'utf-8');
        const config = JSON.parse(content);
        diagnosticResults.config.configValid = true;
        diagnosticResults.config.configSize = content.length;
        this.log(`  ✅ 配置文件格式正确 (${content.length} 字节)`, 'success');

        // 检查配置内容
        const keys = Object.keys(config);
        if (keys.length > 0) {
          this.log(`     配置项: ${keys.join(', ')}`, 'info');
          diagnosticResults.config.configKeys = keys;
        }
      } catch (error) {
        diagnosticResults.config.configValid = false;
        diagnosticResults.config.configError = error.message;
        this.log(`  ❌ 配置文件损坏: ${error.message}`, 'error');
        diagnosticResults.issues.push(`OpenCode 配置文件损坏: ${error.message}`);
      }
    } else {
      this.log('  ℹ️  配置文件不存在（正常）', 'info');
      diagnosticResults.config.configExists = false;
    }

    // 4. PATH 检查
    this.log('\n【4. PATH 环境变量检查】', 'info');
    const npmPath = path.join(process.env.APPDATA || '', 'npm');
    const hasNpmInPath = process.env.PATH.toLowerCase().includes(npmPath.toLowerCase());
    diagnosticResults.system.pathIncludesNpm = hasNpmInPath;

    this.log(`  npm 全局路径: ${npmPath}`, 'info');
    this.log(`  PATH 包含 npm: ${hasNpmInPath ? '✅' : '❌'}`, hasNpmInPath ? 'success' : 'error');

    if (!hasNpmInPath) {
      diagnosticResults.issues.push('PATH 中缺少 npm 全局路径');
    }

    // 5. 权限检查
    this.log('\n【5. 权限检查】', 'info');
    const configDir = path.join(os.homedir(), '.config', 'opencode');
    try {
      fs.accessSync(configDir, fs.constants.W_OK);
      this.log(`  ✅ 配置目录可写`, 'success');
      diagnosticResults.config.configDirWritable = true;
    } catch (error) {
      this.log(`  ❌ 配置目录不可写`, 'error');
      diagnosticResults.issues.push('OpenCode 配置目录权限不足');
      diagnosticResults.config.configDirWritable = false;
    }

    // 6. Oh My OpenCode 检查
    this.log('\n【6. Oh My OpenCode 检查】', 'info');
    const ohMyOpenCodeDir = path.join(os.homedir(), '.opencode');
    diagnosticResults.config.ohMyOpenCodeInstalled = fs.existsSync(ohMyOpenCodeDir);

    if (fs.existsSync(ohMyOpenCodeDir)) {
      this.log(`  ✅ Oh My OpenCode 已安装: ${ohMyOpenCodeDir}`, 'success');
      // 检查插件目录
      const pluginsDir = path.join(ohMyOpenCodeDir, 'plugins');
      if (fs.existsSync(pluginsDir)) {
        try {
          const plugins = fs.readdirSync(pluginsDir);
          this.log(`     已安装插件: ${plugins.length} 个`, 'info');
          if (plugins.length > 0 && !this.options.silent) {
            plugins.forEach(plugin => {
              this.log(`       - ${plugin}`, 'info');
            });
          }
          diagnosticResults.config.installedPlugins = plugins;
        } catch (error) {
          this.log(`  ⚠️  无法读取插件目录`, 'warning');
        }
      }
    } else {
      this.log('  ℹ️  Oh My OpenCode 未安装', 'info');
    }

    // 总结
    this.log('\n' + '='.repeat(70), 'info');
    this.log('诊断总结', 'info');
    this.log('='.repeat(70), 'info');
    this.log(`\n严重问题: ${diagnosticResults.issues.length}`, 'info');
    this.log(`警告: ${diagnosticResults.warnings.length}`, 'info');

    if (diagnosticResults.issues.length > 0) {
      this.log('\n❌ 发现以下问题:', 'error');
      diagnosticResults.issues.forEach((issue, index) => {
        this.log(`  ${index + 1}. ${issue}`, 'error');
      });
    }

    if (diagnosticResults.warnings.length > 0) {
      this.log('\n⚠️  发现以下警告:', 'warning');
      diagnosticResults.warnings.forEach((warning, index) => {
        this.log(`  ${index + 1}. ${warning}`, 'warning');
      });
    }

    if (diagnosticResults.issues.length === 0 && diagnosticResults.warnings.length === 0) {
      this.log('\n✅ 所有检查通过，环境正常！', 'success');
    } else {
      this.log('\n💡 建议: 运行 "stigmergylite fix" 自动修复问题', 'info');
    }

    this.log('='.repeat(70), 'info');

    diagnosticResults.healthy = diagnosticResults.issues.length === 0;
    return diagnosticResults;
  }

  /**
   * 自动修复常见问题
   */
  async fix() {
    this.log('='.repeat(70), 'info');
    this.log('自动修复 OpenCode 环境', 'info');
    this.log('='.repeat(70), 'info');

    const fixes = [];

    // 1. 修复配置文件
    this.log('\n【1. 检查 OpenCode 配置文件】', 'info');
    const configFixed = await this.checkAndFixOpenCodeConfig();
    if (configFixed) {
      this.log('  ✅ 配置文件检查完成', 'success');
    } else {
      this.log('  ⚠️  配置文件需要手动修复', 'warning');
    }

    // 2. 刷新 PATH
    this.log('\n【2. 刷新 PATH 环境变量】', 'info');
    const osType = this.detectOS();
    if (osType === 'windows') {
      const npmGlobalPath = path.join(process.env.APPDATA || '', 'npm');
      if (!process.env.PATH.includes(npmGlobalPath)) {
        process.env.PATH = `${npmGlobalPath};${process.env.PATH}`;
        this.log('  ✅ PATH 已刷新', 'success');
        fixes.push('PATH 已刷新');
      } else {
        this.log('  ℹ️  PATH 已包含 npm 路径', 'info');
      }
    }

    // 3. 检查 Git Bash 路径
    this.log('\n【3. 配置 Git Bash】', 'info');
    if (osType === 'windows') {
      const gitBashConfigured = await this.configureGitBashEnv();
      if (gitBashConfigured) {
        this.log('  ✅ Git Bash 配置完成', 'success');
        fixes.push('Git Bash 已配置');
      } else {
        this.log('  ⚠️  Git Bash 配置失败', 'warning');
      }
    }

    // 4. 验证工具可用性
    this.log('\n【4. 验证工具可用性】', 'info');
    const toolsOk = [];

    if (this.commandExists('bun')) {
      this.log('  ✅ Bun 可用', 'success');
      toolsOk.push('Bun');
    } else {
      this.log('  ❌ Bun 不可用，请手动安装: npm install -g bun', 'error');
    }

    if (this.commandExists('opencode')) {
      this.log('  ✅ OpenCode 可用', 'success');
      toolsOk.push('OpenCode');
    } else {
      this.log('  ❌ OpenCode 不可用，请手动安装: npm install -g opencode-ai', 'error');
    }

    try {
      which.sync('bunx');
      this.log('  ✅ bunx 可用', 'success');
      toolsOk.push('bunx');
    } catch (error) {
      this.log('  ⚠️  bunx 不可用，尝试刷新 PATH', 'warning');
    }

    // 5. 尝试重新安装 Oh My OpenCode
    this.log('\n【5. 检查 Oh My OpenCode】', 'info');
    const ohMyOpenCodeDir = path.join(os.homedir(), '.opencode');
    if (!fs.existsSync(ohMyOpenCodeDir)) {
      this.log('  ℹ️  Oh My OpenCode 未安装', 'info');
      this.log('  如需安装，请运行: stigmergylite install-oh-my-opencode', 'info');
    } else {
      this.log('  ✅ Oh My OpenCode 已安装', 'success');
    }

    // 总结
    this.log('\n' + '='.repeat(70), 'info');
    this.log('修复总结', 'info');
    this.log('='.repeat(70), 'info');

    if (fixes.length > 0) {
      this.log('\n已执行的修复:', 'success');
      fixes.forEach((fix, index) => {
        this.log(`  ${index + 1}. ${fix}`, 'success');
      });
    } else {
      this.log('\n无需自动修复', 'info');
    }

    this.log('\n💡 建议的后续步骤:', 'info');
    this.log('  1. 运行 "stigmergylite status" 查看安装状态', 'info');
    this.log('  2. 运行 "stigmergylite install-oh-my-opencode" 重新安装 Oh My OpenCode', 'info');
    this.log('  3. 如果问题仍然存在，运行 "stigmergylite doctor" 进行完整诊断', 'info');

    this.log('='.repeat(70), 'info');

    return { fixes, toolsOk };
  }

  /**
   * 显示安装状态
   */
  async status() {
    this.log('='.repeat(70), 'info');
    this.log('安装状态', 'info');
    this.log('='.repeat(70), 'info');

    const status = {
      tools: {},
      config: {},
      healthy: true
    };

    // Git
    this.log('\n【Git】', 'info');
    try {
      const gitStatus = await this.isGitInstalled();
      if (gitStatus.installed) {
        this.log(`  状态: ✅ 已安装`, 'success');
        this.log(`  版本: ${gitStatus.version || '未知'}`, 'info');
        this.log(`  路径: ${gitStatus.path || '未知'}`, 'info');
        status.tools.git = { installed: true, version: gitStatus.version };
      } else {
        this.log(`  状态: ❌ 未安装`, 'error');
        status.tools.git = { installed: false };
        status.healthy = false;
      }
    } catch (error) {
      this.log(`  状态: ❌ 检测失败`, 'error');
      status.tools.git = { installed: false, error: error.message };
      status.healthy = false;
    }

    // OpenCode
    this.log('\n【OpenCode】', 'info');
    if (this.commandExists('opencode')) {
      try {
        const version = execSync('opencode --version', { encoding: 'utf-8' });
        this.log(`  状态: ✅ 已安装`, 'success');
        this.log(`  版本: ${version.trim()}`, 'info');
        status.tools.opencode = { installed: true, version: version.trim() };
      } catch (error) {
        this.log(`  状态: ⚠️  已安装但无法运行`, 'warning');
        status.tools.opencode = { installed: true, error: error.message };
      }
    } else {
      this.log(`  状态: ❌ 未安装`, 'error');
      status.tools.opencode = { installed: false };
      status.healthy = false;
    }

    // Bun
    this.log('\n【Bun】', 'info');
    if (this.commandExists('bun')) {
      try {
        const version = execSync('bun --version', { encoding: 'utf-8' });
        this.log(`  状态: ✅ 已安装`, 'success');
        this.log(`  版本: ${version.trim()}`, 'info');
        status.tools.bun = { installed: true, version: version.trim() };
      } catch (error) {
        this.log(`  状态: ⚠️  已安装但无法运行`, 'warning');
        status.tools.bun = { installed: true, error: error.message };
      }
    } else {
      this.log(`  状态: ❌ 未安装`, 'error');
      status.tools.bun = { installed: false };
    }

    // Oh My OpenCode
    this.log('\n【Oh My OpenCode】', 'info');
    const ohMyOpenCodeDir = path.join(os.homedir(), '.opencode');
    if (fs.existsSync(ohMyOpenCodeDir)) {
      this.log(`  状态: ✅ 已安装`, 'success');
      this.log(`  路径: ${ohMyOpenCodeDir}`, 'info');

      // 检查插件
      const pluginsDir = path.join(ohMyOpenCodeDir, 'plugins');
      if (fs.existsSync(pluginsDir)) {
        try {
          const plugins = fs.readdirSync(pluginsDir);
          this.log(`  插件: ${plugins.length} 个`, 'info');
          status.config.ohMyOpenCodePlugins = plugins;
        } catch (error) {
          this.log(`  插件: 无法读取`, 'warning');
        }
      }
      status.config.ohMyOpenCodeInstalled = true;
    } else {
      this.log(`  状态: ❌ 未安装`, 'error');
      status.config.ohMyOpenCodeInstalled = false;
      status.healthy = false;
    }

    // CLI 工具
    this.log('\n【CLI 工具】', 'info');
    const cliTools = [
      { name: 'CodeBuddy', command: 'codebuddy', package: '@tencent-ai/codebuddy-code' },
      { name: 'iFlow CLI', command: 'iflow', package: '@iflow-ai/iflow-cli' },
      { name: 'Qoder CLI', command: 'qodercli', package: '@qoder-ai/qodercli' },
      { name: 'Qwen CLI', command: 'qwen', package: '@qwen-code/qwen-code' }
    ];

    cliTools.forEach(tool => {
      if (this.commandExists(tool.command)) {
        this.log(`  ${tool.name}: ✅`, 'success');
        status.tools[tool.command] = { installed: true };
      } else {
        this.log(`  ${tool.name}: ❌`, 'info');
        status.tools[tool.command] = { installed: false };
      }
    });

    // 总结
    this.log('\n' + '='.repeat(70), 'info');
    if (status.healthy) {
      this.log('✅ 所有核心工具已安装', 'success');
    } else {
      this.log('⚠️  部分工具未安装', 'warning');
      this.log('\n建议:', 'info');
      this.log('  运行 "stigmergylite" 安装缺失的工具', 'info');
    }
    this.log('='.repeat(70), 'info');

    return status;
  }

  /**
   * 仅安装 Oh My OpenCode
   */
  async installOhMyOpenCodeOnly() {
    this.log('='.repeat(70), 'info');
    this.log('单独安装 Oh My OpenCode', 'info');
    this.log('='.repeat(70), 'info');

    try {
      // 检查依赖
      this.log('\n检查依赖...', 'info');

      if (!this.commandExists('bun')) {
        this.log('❌ Bun 未安装，请先安装 Bun', 'error');
        this.log('   运行: npm install -g bun', 'info');
        return false;
      }

      if (!this.commandExists('opencode')) {
        this.log('⚠️  OpenCode 未安装', 'warning');
        this.log('   Oh My OpenCode 需要 OpenCode', 'info');
        this.log('   运行: npm install -g opencode-ai', 'info');
        return false;
      }

      // 修复配置文件（如果需要）
      await this.checkAndFixOpenCodeConfig();

      // 安装
      this.log('\n开始安装 Oh My OpenCode...', 'info');
      const result = await this.installOhMyOpenCode();

      if (result) {
        this.log('\n✅ Oh My OpenCode 安装成功！', 'success');
        this.log('\n下一步:', 'info');
        this.log('  - 运行 "opencode" 启动 OpenCode', 'info');
        this.log('  - 运行 "stigmergylite status" 查看完整状态', 'info');
      }

      return result;
    } catch (error) {
      this.log(`\n❌ 安装失败: ${error.message}`, 'error');
      this.log('\n故障排查:', 'info');
      this.log('  1. 运行 "stigmergylite doctor" 诊断问题', 'info');
      this.log('  2. 运行 "stigmergylite fix" 自动修复', 'info');
      this.log('  3. 手动运行: bunx oh-my-opencode install --no-tui --claude=no --chatgpt=no --gemini=no', 'info');
      return false;
    }
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(`
StigmergyLite - 开发环境自动安装工具

用法:
  stigmergylite [命令] [选项]

命令:
  (无)              完整安装（默认）
  doctor            诊断环境和配置问题
  fix               自动修复常见问题
  status            显示安装状态
  install-oh-my-opencode  单独安装 Oh My OpenCode
  help              显示帮助信息

选项:
  -s, --silent              静默模式
  --no-auto-install         禁用自动安装
  --no-opencode             不安装 OpenCode
  --no-bun                  不安装 Bun
  --no-oh-my-opencode       不安装 Oh My OpenCode
  --no-clis                 不安装 CLI 工具

示例:
  stigmergylite                    # 完整安装
  stigmergylite doctor             # 诊断问题
  stigmergylite fix                # 自动修复
  stigmergylite status             # 查看状态
  stigmergylite install-oh-my-opencode  # 单独安装 Oh My OpenCode

故障排查:
  1. 遇到问题时先运行 "stigmergylite doctor"
  2. 然后运行 "stigmergylite fix" 自动修复
  3. 查看状态 "stigmergylite status"
  4. 如需帮助，访问 https://github.com/your-repo/stigmergylite

更多信息:
  https://github.com/your-repo/stigmergylite
    `);
  }
}

module.exports = GitAutoInstaller;
module.exports.default = GitAutoInstaller;