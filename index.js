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
      installCodeBuddy: options.installCodeBuddy || false,
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
   * 查找 Git Bash 路径（Windows）
   */
  findGitBashPath() {
    const osType = this.detectOS();
    
    if (osType !== 'windows') {
      return null;
    }

    // 常见的 Git Bash 路径
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

    // 尝试从 git.exe 的路径推断 bash.exe
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
    
    if (!bashPath) {
      this.log('无法配置 Git Bash：未找到 bash.exe', 'error');
      return false;
    }

    // 设置环境变量
    process.env.GIT_BASH_PATH = bashPath;
    process.env.GIT_INSTALL_ROOT = path.dirname(path.dirname(bashPath));

    this.log(`已设置 GIT_BASH_PATH=${bashPath}`, 'success');
    this.log(`已设置 GIT_INSTALL_ROOT=${process.env.GIT_INSTALL_ROOT}`, 'success');

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

    // 方法 4: 下载官方安装程序
    this.log('无法通过包管理器安装，请手动从 https://git-scm.com/download/win 下载并安装 Git', 'warning');
    this.log('安装后需要重新运行此脚本', 'warning');
    
    throw new Error('无法自动安装 Git，请手动安装');
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

    throw new Error('无法自动安装 Git，请手动安装');
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

    throw new Error('无法自动安装 Git，请手动安装');
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
    const { userName, userEmail, defaultBranch = 'main' } = config;

    if (userName) {
      execSync(`git config --global user.name "${userName}"`, { stdio: 'pipe' });
      this.log(`已设置用户名: ${userName}`, 'success');
    }

    if (userEmail) {
      execSync(`git config --global user.email "${userEmail}"`, { stdio: 'pipe' });
      this.log(`已设置邮箱: ${userEmail}`, 'success');
    }

    execSync(`git config --global init.defaultbranch ${defaultBranch}`, { stdio: 'pipe' });
    this.log(`已设置默认分支: ${defaultBranch}`, 'success');

    // Windows 特定配置
    if (this.detectOS() === 'windows') {
      execSync('git config --global core.autocrlf true', { stdio: 'pipe' });
      execSync('git config --global core.longpaths true', { stdio: 'pipe' });
      execSync('git config --global core.quotepath off', { stdio: 'pipe' });
      this.log('已配置 Windows 特定设置', 'success');
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

      this.log('执行: npm install -g codebuddy', 'info');
      execSync('npm install -g codebuddy', {
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

      this.log('执行: npm install -g iflowcli', 'info');
      execSync('npm install -g iflowcli', {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 验证安装
      const version = execSync('iflowcli --version', { encoding: 'utf-8' });
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

      this.log('执行: npm install -g @qoderai/qodercli', 'info');
      execSync('npm install -g @qoderai/qodercli', {
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
   * 安装 QwenCLI
   */
  async installQwenCLI() {
    this.log('开始安装 QwenCLI...', 'info');

    try {
      // 检查 QwenCLI 是否已安装
      if (this.commandExists('qwencli')) {
        this.log('QwenCLI 已安装', 'success');
        return true;
      }

      this.log('执行: npm install -g @qwen-code/qwen-code', 'info');
      execSync('npm install -g @qwen-code/qwen-code', {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      // 验证安装
      const version = execSync('qwencli --version', { encoding: 'utf-8' });
      this.log(`QwenCLI 安装成功: ${version.trim()}`, 'success');
      return true;
    } catch (error) {
      this.log(`QwenCLI 安装失败: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 安装 OpenCode
   */
  async installOpenCode() {
    this.log('开始安装 OpenCode...', 'info');

    try {
      // 检查是否已安装
      if (this.commandExists('opencode')) {
        this.log('OpenCode 已安装', 'success');
        return true;
      }

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
   * 安装 Oh My OpenCode
   */
  async installOhMyOpenCode() {
    this.log('开始安装 Oh My OpenCode...', 'info');

    try {
      // 检查 Bun 是否可用
      if (!this.commandExists('bun')) {
        throw new Error('Bun 未安装，无法安装 Oh My OpenCode');
      }

      this.log('执行: bunx oh-my-opencode install --no-tui --claude=no --chatgpt=no --gemini=no', 'info');
      execSync('bunx oh-my-opencode install --no-tui --claude=no --chatgpt=no --gemini=no', {
        stdio: this.options.silent ? 'pipe' : 'inherit',
        timeout: 300000
      });

      this.log('Oh My OpenCode 安装成功', 'success');
      return true;
    } catch (error) {
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

      // 1. 检测操作系统
      const osType = this.detectOS();
      this.log(`操作系统: ${osType}`, 'info');

      // 2. 检查 Git 是否已安装
      this.log('\n步骤 1: 检测和安装 Git', 'info');
      const gitStatus = await this.isGitInstalled();

      if (!gitStatus.installed) {
        if (this.options.autoInstall) {
          await this.installGit();

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

      // 4. 配置 Git（如果提供了配置）
      if (this.options.gitConfig) {
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
      if (this.options.installCodeBuddy) {
        this.log('\n步骤 5: 安装 CodeBuddy', 'info');
        await this.installCodeBuddy();
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
        os: osType
      };
    } catch (error) {
      this.log(`安装失败: ${error.message}`, 'error');
      throw error;
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
    
    if (!bashPath) {
      throw new Error('Git Bash 未找到，请先确保 Git 已正确安装');
    }

    return new Promise((resolve, reject) => {
      const proc = spawn(bashPath, ['-c', command], {
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
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`命令执行失败 (退出码: ${code}): ${stderr}`));
        }
      });

      proc.on('error', (error) => {
        reject(error);
      });
    });
  }
}

module.exports = GitAutoInstaller;
module.exports.default = GitAutoInstaller;