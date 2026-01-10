# DNASPEC条件式Stigmergy集成

## 1. 设计理念

DNASPEC采用条件式集成策略，确保在有无Stigmergy的情况下都能正常工作：

1. **无Stigmergy环境**：DNASPEC作为独立系统完整运行
2. **有Stigmergy环境**：DNASPEC通过Stigmergy实现跨CLI协作
3. **平滑过渡**：用户可以在两种模式间自由切换

## 2. 检测机制

### 2.1 Stigmergy检测器
```python
class StigmergyDetector:
    @staticmethod
    def is_stigmergy_installed() -> bool:
        """检查Stigmergy是否已安装"""
        try:
            result = subprocess.run(['stigmergy', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            return result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError, OSError):
            return False
```

### 2.2 运行时检测
在DNASPEC CLI启动时自动检测Stigmergy状态：
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

## 3. 回退机制

### 3.1 功能回退
当Stigmergy不可用时，DNASPEC自动回退到独立运行模式：

1. **集成命令**：提示用户安装Stigmergy
2. **验证命令**：提示用户Stigmergy未安装
3. **核心功能**：不受影响，正常运行

### 3.2 错误处理
```python
if args.stigmergy:
    # 验证Stigmergy集成
    if not stigmergy_available:
        print('❌ Stigmergy is not installed or not available')
        print('Please install Stigmergy first: npm install -g stigmergy')
        sys.exit(1)
```

## 4. CLI命令更新

### 4.1 条件式集成命令
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

### 4.2 条件式验证命令
```bash
# 在有Stigmergy环境下
$ dnaspec validate --stigmergy
✅ Stigmergy integration validation successful!

# 在无Stigmergy环境下
$ dnaspec validate --stigmergy
❌ Stigmergy is not installed or not available
```

## 5. 实现细节

### 5.1 延迟导入
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

### 5.2 条件导入
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

## 6. 测试策略

### 6.1 有Stigmergy环境测试
1. 验证Stigmergy检测功能
2. 测试集成命令执行
3. 验证钩子生成和部署
4. 测试跨CLI技能调用

### 6.2 无Stigmergy环境测试
1. 验证检测机制正确识别缺失
2. 测试回退机制
3. 确认核心功能不受影响
4. 验证错误提示信息

## 7. 用户体验

### 7.1 渐进式引导
```bash
# 首次使用提示
$ dnaspec
Welcome to DNASPEC!
💡 Stigmergy detected! Enable cross-CLI collaboration with:
   dnaspec integrate --stigmergy

# 集成后提示
$ dnaspec
Welcome to DNASPEC!
✅ Stigmergy integration active
Use natural language commands like:
   "use dnaspec context-analysis to analyze this requirement"
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

通过这种条件式集成设计，DNASPEC能够在各种环境中为用户提供最佳体验，既保持了系统的独立性，又充分利用了Stigmergy带来的跨CLI协作能力。