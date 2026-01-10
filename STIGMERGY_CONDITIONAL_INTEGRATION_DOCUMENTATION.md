# DNASPEC条件式Stigmergy集成文档

## 1. 概述

DNASPEC采用条件式集成策略，确保在有无Stigmergy的情况下都能正常工作。这种设计使得DNASPEC既可以在独立模式下运行，也可以通过Stigmergy实现跨CLI工具的协作。

## 2. 设计原理

### 2.1 核心理念
- **独立性**：DNASPEC核心功能不依赖于Stigmergy
- **可选性**：Stigmergy集成是可选功能，不影响基本使用
- **透明性**：用户可以清楚地知道系统当前的工作模式
- **渐进性**：用户可以逐步启用高级功能

### 2.2 工作流程
```
用户启动DNASPEC CLI
      ↓
检测Stigmergy是否可用
      ↓
是 → 提供Stigmergy集成选项
      ↓
否 → 提供安装指引
      ↓
用户选择是否集成
      ↓
执行相应操作
```

## 3. 检测机制

### 3.1 Stigmergy检测器
DNASPEC使用专门的检测器来检查Stigmergy的可用性：

```python
class StigmergyDetector:
    @staticmethod
    def is_stigmergy_installed() -> bool:
        """检查Stigmergy是否已安装"""
        try:
            # 尝试直接调用stigmergy命令
            result = subprocess.run(['stigmergy', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            return result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError, OSError):
            # 如果直接调用失败，尝试通过npx调用
            try:
                result = subprocess.run(['npx', 'stigmergy', '--version'], 
                                      capture_output=True, text=True, timeout=10)
                return result.returncode == 0
            except (subprocess.SubprocessError, FileNotFoundError, OSError):
                return False
```

### 3.2 多层次检测
1. **直接调用检测**：尝试直接运行`stigmergy`命令
2. **间接调用检测**：尝试通过`npx stigmergy`运行
3. **版本信息获取**：获取Stigmergy版本信息
4. **CLI工具扫描**：检测可用的AI CLI工具

## 4. 回退机制

### 4.1 功能回退
当Stigmergy不可用时，DNASPEC会自动回退到基本功能：

```python
if args.stigmergy:
    # 验证Stigmergy集成
    if not stigmergy_available:
        print('❌ Stigmergy is not installed or not available')
        print('Please install Stigmergy first: npm install -g stigmergy')
        sys.exit(1)
```

### 4.2 用户指引
在无Stigmergy环境下，系统会提供清晰的安装指引：
```
ℹ️  Stigmergy not detected. To enable cross-CLI collaboration, install Stigmergy:
   npm install -g stigmergy
   Then integrate: dnaspec integrate --stigmergy
```

## 5. CLI命令行为

### 5.1 帮助信息
```bash
# 有Stigmergy环境
$ dnaspec
💡 Stigmergy detected! You can integrate DNASPEC with Stigmergy using:
   dnaspec integrate --stigmergy

# 无Stigmergy环境
$ dnaspec
ℹ️  Stigmergy not detected. To enable cross-CLI collaboration, install Stigmergy:
   npm install -g stigmergy
   Then integrate: dnaspec integrate --stigmergy
```

### 5.2 集成命令
```bash
# 在有Stigmergy环境下
$ dnaspec integrate --stigmergy
🚀 Starting DNASPEC Stigmergy Integration...
✅ Stigmergy integration completed successfully!

# 在无Stigmergy环境下
$ dnaspec integrate --stigmergy
❌ Stigmergy is not installed or not available
Please install Stigmergy first: npm install -g stigmergy
```

### 5.3 验证命令
```bash
# 在有Stigmergy环境下
$ dnaspec validate --stigmergy
✅ Stigmergy integration validation successful!

# 在无Stigmergy环境下
$ dnaspec validate --stigmergy
❌ Stigmergy is not installed or not available
```

## 6. 技术实现

### 6.1 延迟导入
为了避免在Stigmergy不可用时出现导入错误，采用延迟导入策略：

```python
def main():
    # 检查Stigmergy可用性
    stigmergy_available = is_stigmergy_available()
    
    # 延迟导入以避免循环依赖
    from .core.command_handler import CommandHandler
    from .core.interactive_shell import InteractiveShell
    # ...
```

### 6.2 条件导入
在Stigmergy适配器中也采用条件导入：

```python
class StigmergyAdapter:
    def __init__(self):
        # 延迟导入以避免循环依赖
        from .skill_executor import SkillExecutor
        from .python_bridge import PythonBridge
        from .skill_mapper import SkillMapper
        # ...
```

## 7. 用户体验

### 7.1 渐进式引导
系统会根据当前环境提供相应的操作建议：

```bash
# 首次使用提示（有Stigmergy）
$ dnaspec
Welcome to DNASPEC!
💡 Stigmergy detected! Enable cross-CLI collaboration with:
   dnaspec integrate --stigmergy

# 首次使用提示（无Stigmergy）
$ dnaspec
Welcome to DNASPEC!
ℹ️  Stigmergy not detected. To enable cross-CLI collaboration:
   npm install -g stigmergy
   dnaspec integrate --stigmergy
```

### 7.2 错误友好提示
```bash
# 尝试集成但Stigmergy未安装
$ dnaspec integrate --stigmergy
❌ Stigmergy is not installed
To enable cross-CLI collaboration:
1. Install Stigmergy: npm install -g stigmergy
2. Then run: dnaspec integrate --stigmergy
```

## 8. 维护策略

### 8.1 版本兼容性
- 定期测试与最新Stigmergy版本的兼容性
- 维护最低版本要求文档
- 提供版本升级指南

### 8.2 向后兼容
- 确保新版本DNASPEC在旧版本Stigmergy上仍能工作
- 提供降级路径
- 维护兼容性测试套件

## 9. 最佳实践

### 9.1 部署建议
1. **独立部署**：用户可以单独使用DNASPEC，无需安装Stigmergy
2. **集成部署**：用户可以安装Stigmergy以获得跨CLI协作能力
3. **渐进升级**：用户可以从独立模式逐步升级到集成模式

### 9.2 使用建议
1. **初学者**：建议先使用独立模式熟悉DNASPEC功能
2. **高级用户**：建议安装Stigmergy以获得完整的跨CLI协作体验
3. **团队用户**：建议统一部署Stigmergy以实现团队协作

通过这种条件式集成设计，DNASPEC能够在各种环境中为用户提供最佳体验，既保持了系统的独立性，又充分利用了Stigmergy带来的跨CLI协作能力。