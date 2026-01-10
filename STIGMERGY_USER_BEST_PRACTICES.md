# DNASPEC与Stigmergy集成最佳实践指南

## 1. 概述

本文档为用户提供DNASPEC与Stigmergy集成的最佳实践指导，帮助用户充分利用两个系统的协同优势。

## 2. 部署顺序建议

### 2.1 推荐部署流程
1. **安装Stigmergy CLI工具**
   ```bash
   npm install -g stigmergy
   ```

2. **验证Stigmergy安装**
   ```bash
   stigmergy --version
   stigmergy scan
   ```

3. **安装DNASPEC**
   ```bash
   npm install -g dnaspec
   ```

4. **验证DNASPEC安装**
   ```bash
   dnaspec --version
   dnaspec list
   ```

5. **集成DNASPEC到Stigmergy**
   ```bash
   dnaspec integrate --stigmergy
   ```

6. **验证集成状态**
   ```bash
   dnaspec validate --stigmergy
   ```

## 3. 使用方法

### 3.1 自然语言调用
在任何支持的AI CLI工具中，可以使用自然语言调用DNASPEC技能：

```bash
# 上下文分析
use dnaspec context-analysis to analyze the quality of this requirement

# 上下文优化
call dnaspec context-optimization to improve this technical specification

# 认知模板应用
ask dnaspec cognitive-template to apply chain-of-thought to this problem

# 系统架构设计
invoke dnaspec architect to design a microservices architecture for e-commerce

# Git操作
use dnaspec git-operations to commit changes with conventional commit format
```

### 3.2 支持的技能
- `context-analysis` - 上下文质量分析
- `context-optimization` - 上下文优化
- `cognitive-template` - 认知模板应用
- `architect` - 系统架构设计
- `system-architect` - 复杂系统架构师
- `simple-architect` - 简易架构设计
- `git-operations` - Git操作
- `temp-workspace` - 临时工作区管理

## 4. 最佳实践

### 4.1 技能调用最佳实践
1. **明确指定技能名称**：使用准确的技能名称以确保正确路由
2. **提供详细的任务描述**：清晰的任务描述有助于技能更好地理解和执行
3. **结合上下文使用**：在对话上下文中调用技能可以获得更好的结果

### 4.2 错误处理
1. **检查日志文件**：钩子日志位于`~/.stigmergy/hooks/{cli}/dnaspec_hook.log`
2. **验证集成状态**：定期使用`dnaspec validate --stigmergy`检查集成状态
3. **重新部署**：如果遇到问题，可以使用`dnaspec integrate --stigmergy --force`重新部署

### 4.3 性能优化
1. **缓存常用结果**：对于重复的技能调用，考虑缓存结果以提高响应速度
2. **批量处理**：对于大量数据处理任务，考虑使用批处理方式
3. **监控资源使用**：注意观察技能执行时的CPU和内存使用情况

## 5. 故障排除

### 5.1 常见问题及解决方案

#### 问题1：技能未被识别
**现象**：输入"use dnaspec context-analysis"但没有任何响应
**解决方案**：
1. 检查Stigmergy是否正确安装：`stigmergy --version`
2. 验证DNASPEC集成：`dnaspec validate --stigmergy`
3. 重新部署集成：`dnaspec integrate --stigmergy --force`

#### 问题2：技能执行错误
**现象**：技能被识别但返回错误信息
**解决方案**：
1. 检查日志文件：`~/.stigmergy/hooks/{cli}/dnaspec_hook.log`
2. 验证DNASPEC安装：`dnaspec list`
3. 重新安装DNASPEC：`npm uninstall -g dnaspec && npm install -g dnaspec`

#### 问题3：权限问题
**现象**：钩子脚本无法执行
**解决方案**：
1. 检查钩子脚本权限：`ls -la ~/.stigmergy/hooks/{cli}/dnaspec_{cli}_hook.js`
2. 在Unix系统上设置执行权限：`chmod +x ~/.stigmergy/hooks/{cli}/dnaspec_{cli}_hook.js`

### 5.2 日志分析
1. **钩子日志**：`~/.stigmergy/hooks/{cli}/dnaspec_hook.log`
2. **Stigmergy日志**：`~/.stigmergy/logs/`
3. **DNASPEC日志**：根据具体实现可能在不同位置

## 6. 高级用法

### 6.1 自定义技能组合
可以将多个DNASPEC技能组合使用：
```bash
# 先分析上下文质量
use dnaspec context-analysis to analyze this requirement

# 根据分析结果优化上下文
use dnaspec context-optimization to improve the requirement based on the analysis

# 应用认知模板
use dnaspec cognitive-template to apply verification template to the optimized requirement
```

### 6.2 与其他AI工具协作
利用Stigmergy的跨CLI协作能力：
```bash
# 让Claude生成需求文档
use claude to generate a detailed requirement document for e-commerce platform

# 让DNASPEC分析文档质量
use dnaspec context-analysis to analyze the quality of the generated requirement

# 让Qwen重构代码
use qwen to refactor this python code for better performance

# 让DNASPEC优化重构后的代码上下文
use dnaspec context-optimization to improve the refactored code documentation
```

## 7. 维护和更新

### 7.1 定期维护
1. **更新Stigmergy**：`npm update -g stigmergy`
2. **更新DNASPEC**：`npm update -g dnaspec`
3. **重新集成**：每次更新后建议重新运行集成命令

### 7.2 监控集成状态
```bash
# 定期检查集成状态
dnaspec validate --stigmergy

# 检查各CLI工具的钩子状态
stigmergy status
```

## 8. 安全注意事项

1. **保护敏感信息**：避免在技能调用中传递敏感数据
2. **定期审查日志**：检查日志文件中是否有敏感信息泄露
3. **权限控制**：确保只有授权用户可以执行集成和部署操作

通过遵循这些最佳实践，用户可以充分发挥DNASPEC与Stigmergy集成的优势，实现高效的AI辅助开发工作流。