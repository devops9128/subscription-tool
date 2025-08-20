# 订阅管理器配置文档

本文档详细说明了订阅管理器应用程序的所有配置要求和设置步骤。

## 📋 目录

1. [环境变量配置](#环境变量配置)
2. [本地开发环境设置](#本地开发环境设置)
3. [Vercel部署配置](#vercel部署配置)
4. [安全注意事项](#安全注意事项)
5. [故障排除指南](#故障排除指南)
6. [配置验证方法](#配置验证方法)

## 🔧 环境变量配置

### 必需的环境变量

应用程序需要以下环境变量才能正常运行：

#### Firebase 配置

```bash
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.region.firebasedatabase.app/
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### 汇率API配置

```bash
VITE_EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest/MYR
```

#### 应用配置

```bash
VITE_DEFAULT_USER_ID=default-user
```

### 获取Firebase配置信息

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 创建新项目或选择现有项目
3. 进入项目设置 → 常规 → 您的应用
4. 选择Web应用，复制配置信息
5. 启用Realtime Database服务

### 汇率API配置

应用使用免费的汇率API服务：
- **服务商**: ExchangeRate-API
- **免费额度**: 每月1500次请求
- **无需注册**: 可直接使用
- **API地址**: `https://api.exchangerate-api.com/v4/latest/MYR`

如需更高额度，可注册获取API密钥并修改URL。

## 💻 本地开发环境设置

### 前置要求

- Node.js 18.0+ 
- npm 或 yarn
- 现代浏览器（Chrome, Firefox, Safari, Edge）

### 设置步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd subscription-manager
   ```

2. **创建环境变量文件**
   ```bash
   cp .env.example .env
   ```

3. **编辑 .env 文件**
   ```bash
   # 使用文本编辑器打开 .env 文件
   notepad .env  # Windows
   nano .env     # Linux/Mac
   ```
   
   填入您的Firebase配置信息。

4. **生成 env.js 文件**
   
   运行以下命令生成环境变量配置文件：
   ```bash
   node -e "const fs=require('fs');const env=require('dotenv').config().parsed||{};const config={VITE_FIREBASE_API_KEY:env.VITE_FIREBASE_API_KEY||'',VITE_FIREBASE_AUTH_DOMAIN:env.VITE_FIREBASE_AUTH_DOMAIN||'',VITE_FIREBASE_DATABASE_URL:env.VITE_FIREBASE_DATABASE_URL||'',VITE_FIREBASE_PROJECT_ID:env.VITE_FIREBASE_PROJECT_ID||'',VITE_FIREBASE_STORAGE_BUCKET:env.VITE_FIREBASE_STORAGE_BUCKET||'',VITE_FIREBASE_MESSAGING_SENDER_ID:env.VITE_FIREBASE_MESSAGING_SENDER_ID||'',VITE_FIREBASE_APP_ID:env.VITE_FIREBASE_APP_ID||'',VITE_FIREBASE_MEASUREMENT_ID:env.VITE_FIREBASE_MEASUREMENT_ID||'',VITE_EXCHANGE_RATE_API_URL:env.VITE_EXCHANGE_RATE_API_URL||'https://api.exchangerate-api.com/v4/latest/MYR',VITE_DEFAULT_USER_ID:env.VITE_DEFAULT_USER_ID||'default-user'};fs.writeFileSync('env.js',\`window.ENV=${JSON.stringify(config,null,2)};\`);"
   ```

5. **启动开发服务器**
   ```bash
   # 使用Python内置服务器
   python -m http.server 8000
   
   # 或使用Node.js服务器
   npx serve .
   ```

6. **访问应用**
   
   打开浏览器访问 `http://localhost:8000`

## 🚀 Vercel部署配置

### 方法一：通过Vercel CLI

1. **安装Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **登录Vercel**
   ```bash
   vercel login
   ```

3. **配置环境变量**
   ```bash
   vercel env add VITE_FIREBASE_API_KEY
   vercel env add VITE_FIREBASE_AUTH_DOMAIN
   vercel env add VITE_FIREBASE_DATABASE_URL
   vercel env add VITE_FIREBASE_PROJECT_ID
   vercel env add VITE_FIREBASE_STORAGE_BUCKET
   vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
   vercel env add VITE_FIREBASE_APP_ID
   vercel env add VITE_FIREBASE_MEASUREMENT_ID
   vercel env add VITE_EXCHANGE_RATE_API_URL
   vercel env add VITE_DEFAULT_USER_ID
   ```

4. **部署项目**
   ```bash
   vercel --prod
   ```

### 方法二：通过GitHub集成

1. **推送代码到GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **连接Vercel**
   - 访问 [Vercel Dashboard](https://vercel.com/dashboard)
   - 点击 "New Project"
   - 选择GitHub仓库
   - 导入项目

3. **配置环境变量**
   
   在Vercel项目设置中添加所有必需的环境变量。

### Vercel配置文件

项目包含 `vercel.json` 配置文件，确保正确的静态文件服务和缓存策略。该配置文件包含：

- **构建命令**: 自动执行 `node build-env.js` 生成环境配置
- **静态文件服务**: 正确处理HTML、CSS、JS文件
- **缓存策略**: 优化资源加载性能

### 自动化构建流程

项目使用自动化构建脚本 `build-env.js` 来处理环境变量配置：

1. **构建时执行**: Vercel部署时自动运行
2. **环境变量读取**: 从Vercel环境变量中读取配置
3. **配置文件生成**: 自动生成 `env.js` 文件
4. **错误检查**: 验证必需的环境变量是否存在

这确保了部署时环境变量能够正确加载，解决了 `.env` 文件在生产环境中不可用的问题。

## 🔒 安全注意事项

### 环境变量安全

- ✅ **永远不要**将 `.env` 文件提交到版本控制
- ✅ **永远不要**在代码中硬编码敏感信息
- ✅ **确保** `.gitignore` 包含所有敏感文件
- ✅ **定期轮换** API密钥和配置信息

### Firebase安全规则

建议为Firebase Realtime Database配置适当的安全规则：

```json
{
  "rules": {
    "subscriptions": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

### 文件权限

确保以下文件被正确忽略：
- `.env*` - 环境变量文件
- `env.js` - 生成的配置文件
- `node_modules/` - 依赖包
- `.vercel/` - Vercel配置

## 🔍 故障排除指南

### 常见问题

#### 1. Firebase连接失败

**症状**: 控制台显示Firebase初始化错误

**解决方案**:
- 检查Firebase配置信息是否正确
- 确认Firebase项目已启用Realtime Database
- 验证API密钥是否有效

#### 2. 汇率更新失败

**症状**: 汇率信息显示"更新失败"

**解决方案**:
- 检查网络连接
- 验证汇率API URL是否正确
- 确认API服务是否可用

#### 3. 环境变量未加载

**症状**: 应用使用默认配置而非环境变量

**解决方案**:
- 确认 `env.js` 文件存在且格式正确
- 检查环境变量名称是否正确
- 重新生成 `env.js` 文件
- 在Vercel中验证所有环境变量已正确配置
- 检查构建日志确认 `build-env.js` 脚本正常执行

#### 4. Vercel部署失败

**症状**: 部署过程中出现错误

**解决方案**:
- 检查 `vercel.json` 文件语法
- 确认所有环境变量已在Vercel中配置
- 查看Vercel部署日志获取详细错误信息
- 验证 `build-env.js` 脚本是否正常执行
- 检查构建过程中是否成功生成 `env.js` 文件

#### 5. Firebase初始化超时

**症状**: 控制台显示"Firebase initialization timeout"错误

**解决方案**:
- 检查网络连接是否稳定
- 验证Firebase配置信息是否完整和正确
- 确认Firebase项目状态是否正常
- 检查浏览器是否阻止了Firebase相关请求

### 调试步骤

1. **检查浏览器控制台**
   - 打开开发者工具 (F12)
   - 查看Console标签页的错误信息

2. **验证网络请求**
   - 检查Network标签页
   - 确认API请求是否成功

3. **检查本地存储**
   - 查看Application → Local Storage
   - 确认数据是否正确保存

## ✅ 配置验证方法

### 本地验证

1. **环境变量检查**
   ```bash
   # 检查 .env 文件
   cat .env
   
   # 检查 env.js 文件
   cat env.js
   ```

2. **Firebase连接测试**
   - 打开应用
   - 查看控制台是否显示"Firebase initialization completed"
   - 尝试添加一个测试订阅

3. **汇率API测试**
   - 点击"Update Exchange Rates"按钮
   - 检查汇率信息是否更新

### 生产环境验证

1. **部署状态检查**
   - 访问Vercel部署URL
   - 确认应用正常加载

2. **功能测试**
   - 添加/编辑/删除订阅
   - 测试搜索和过滤功能
   - 验证汇率更新功能

3. **性能检查**
   - 使用浏览器开发者工具检查加载时间
   - 确认没有控制台错误

### 配置检查清单

- [ ] `.env` 文件已创建并包含所有必需变量
- [ ] `env.js` 文件已生成
- [ ] Firebase项目已配置并启用Realtime Database
- [ ] 汇率API可正常访问
- [ ] 本地开发服务器可正常启动
- [ ] 应用功能测试通过
- [ ] Vercel环境变量已配置
- [ ] 生产部署成功
- [ ] 生产环境功能测试通过

## 📞 技术支持

如果遇到配置问题，请检查：

1. 本文档的故障排除部分
2. 项目的 `README.md` 文件
3. Firebase和Vercel的官方文档
4. 浏览器开发者工具的错误信息

---

**注意**: 请确保在配置过程中保护好您的API密钥和敏感信息，不要在公共场所或不安全的网络环境中进行配置操作。