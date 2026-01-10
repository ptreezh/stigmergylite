# DNASPEC + Stigmergy Integration Guide

## 🤖 Overview

DNASPEC integrates seamlessly with **Stigmergy**, a multi-agent cross-AI CLI tools collaboration system. This combination enables powerful distributed AI development workflows.

## 📋 Prerequisites

```bash
# Install both tools
npm install -g dnaspec
npm install -g stigmergy

# Verify installation
stigmergy --version
dnaspec --version
```

## 🚀 Quick Integration

```bash
# 1. Scan for AI tools
stigmergy scan

# 2. Setup Stigmergy hooks
stigmergy setup

# 3. Integrate DNASPEC with Stigmergy
dnaspec integrate --stigmergy

# 4. Verify integration
stigmergy status
```

## ⚡ Usage Examples

### Tool Detection and Status
```bash
# Check which AI tools are available
stigmergy status

# Scan for newly installed tools
stigmergy scan

# Deploy hooks and configurations
stigmergy setup
```

### Integration with DNASPEC
```bash
# First, ensure both tools are installed
npm install -g dnaspec stigmergy

# Setup Stigmergy environment
stigmergy setup

# Integrate DNASPEC skills with detected AI tools
dnaspec integrate --stigmergy

# Use DNASPEC directly with any installed AI tool
claude "Use dnaspec context-analysis to examine this code"
gemini "Apply dnaspec cognitive-template for this problem"
```

## 🔧 Integration Features

### 1. **Automatic Detection**
- Stigmergy detects 8+ AI CLI tools automatically
- DNASPEC registers its skills with Stigmergy
- Dynamic skill routing based on task requirements

### 2. **Hook System**
```javascript
// Generated Stigmergy hook for DNASPEC
{
  "name": "dnaspec",
  "skills": [
    "context-analysis",
    "context-optimization",
    "cognitive-template",
    "architect",
    "system-design"
  ],
  "routing": "auto",
  "fallback": true
}
```

### 3. **Skill Mapping**
- DNASPEC skills mapped to Stigmergy commands
- Automatic CLI selection based on tool availability
- Fallback mechanisms for reliable operation

## 📊 Supported AI Tools

| Tool | Stigmergy Support | DNASPEC Integration |
|------|-------------------|-------------------|
| Claude | ✅ | ✅ |
| Gemini | ✅ | ✅ |
| Qwen | ✅ | ✅ |
| Cursor | ✅ | ✅ |
| Copilot | ✅ | ✅ |
| CodeBuddy | ✅ | ✅ |
| iFlow | ✅ | ✅ |
| QoderCLI | ✅ | ✅ |

## 🎯 Benefits

### For Developers
- **Unified Interface**: Single command for multiple AI tools
- **Optimal Routing**: Tasks automatically sent to best-suited AI
- **Skill Composition**: Chain multiple AI tools for complex workflows
- **Consistency**: Same DNASPEC skills across all platforms

### For Workflows
- **Parallel Processing**: Multiple AIs work on different aspects
- **Cross-Validation**: Results verified by different AI models
- **Specialization**: Each tool handles its strongest capabilities
- **Redundancy**: Multiple tools ensure reliability

## 🔍 Troubleshooting

### Integration Issues
```bash
# Check Stigmergy status
stigmergy status

# Verify DNASPEC integration
dnaspec validate

# Re-run integration if needed
dnaspec integrate --stigmergy --force
```

### Common Issues
1. **PATH Problems**: Ensure npm global bin is in PATH
2. **Permission Issues**: Use administrator rights for global installs
3. **Version Conflicts**: Keep both tools updated

## 📚 Advanced Usage

### Custom Workflows
```bash
# Use specific AI tools with DNASPEC skills
claude "dnaspec.context-analyze this requirement"
gemini "dnaspec.architect design system for: X"
qwen "dnaspec.cognitive-template apply verification template"

# Direct tool usage after integration
dnaspec list                    # See all available skills
dnaspec validate                 # Verify integration status
stigmergy status                # Check AI tool availability
```

### Configuration
```yaml
# ~/.stigmergy/config.yaml
integrations:
  dnaspec:
    enabled: true
    auto_route: true
    skills:
      - context-analysis
      - architect
      - cognitive-template
```

## 🔗 Resources

- **Stigmergy Documentation**: https://github.com/ptreezh/stigmergy-CLI-Multi-Agents
- **DNASPEC Repository**: https://github.com/ptreezh/dnaSpec
- **Integration Examples**: See `/examples/stigmergy-workflows/`

## 🤝 Contributing

Both projects welcome contributions:
- Report integration issues on GitHub
- Submit workflow examples
- Suggest new skill combinations
- Improve cross-tool compatibility