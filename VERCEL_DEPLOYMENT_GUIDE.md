# Vercel 部署指南

## 概述

本指南将帮助您在 Vercel 平台上成功部署订阅管理器应用程序，并正确配置所需的环境变量。

## 🚀 快速部署步骤

### 1. 准备工作

确保您已经：
- 拥有 Vercel 账户
- 项目代码已推送到 GitHub/GitLab/Bitbucket
- 拥有 Firebase 项目和相关配置信息

### 2. 导入项目到 Vercel

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择您的 Git 仓库
4. 点击 "Import"

### 3. 配置环境变量

在项目设置中添加以下环境变量：

#### 必需的 Firebase 环境变量

```
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com/
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### 可选的环境变量

```
VITE_EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest/USD
VITE_DEFAULT_USER_ID=default-user
```

### 4. 获取 Firebase 配置信息

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择您的项目
3. 点击齿轮图标 → "项目设置"
4. 滚动到 "您的应用" 部分
5. 选择您的 Web 应用
6. 复制配置对象中的值

### 5. 在 Vercel 中添加环境变量

#### 方法一：通过 Vercel Dashboard

1. 在项目页面，点击 "Settings" 标签
2. 在左侧菜单中选择 "Environment Variables"
3. 逐个添加上述环境变量：
   - Name: 变量名（如 `VITE_FIREBASE_API_KEY`）
   - Value: 对应的值
   - Environment: 选择 "Production", "Preview", 和 "Development"
4. 点击 "Save"

#### 方法二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 在项目目录中添加环境变量
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
vercel env add VITE_FIREBASE_DATABASE_URL
vercel env add VITE_FIREBASE_PROJECT_ID
vercel env add VITE_FIREBASE_STORAGE_BUCKET
vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID
vercel env add VITE_FIREBASE_APP_ID
vercel env add VITE_FIREBASE_MEASUREMENT_ID
```

#### 方法三：批量导入 .env 文件

1. 在 Vercel Dashboard 的环境变量页面
2. 点击右上角的 "Import" 按钮
3. 选择您的 `.env` 文件
4. 确认导入的变量

### 6. 重新部署

添加环境变量后，需要重新部署：

1. 在 Vercel Dashboard 中，转到 "Deployments" 标签
2. 点击最新部署旁边的三个点
3. 选择 "Redeploy"
4. 确认重新部署

## 🔧 构建过程说明

### 自动构建流程

1. **代码推送**: 当您推送代码到 Git 仓库时
2. **Vercel 检测**: Vercel 自动检测到更改
3. **环境变量注入**: 构建时注入配置的环境变量
4. **运行构建脚本**: 执行 `node build-env.js`
5. **生成 env.js**: 从环境变量动态生成配置文件
6. **部署**: 将生成的文件部署到 CDN

### 构建配置 (vercel.json)

```json
{
  "buildCommand": "node build-env.js",
  "outputDirectory": ".",
  "framework": null
}
```

## 🐛 故障排除

### 常见问题

#### 1. Firebase 初始化失败

**错误信息**: "Missing required environment variables"

**解决方案**:
- 检查所有必需的环境变量是否已添加
- 确认变量名拼写正确（区分大小写）
- 重新部署项目

#### 2. 环境变量未生效

**解决方案**:
- 确保环境变量已保存
- 重新部署项目
- 检查浏览器控制台的错误信息

#### 3. 数据库连接失败

**解决方案**:
- 验证 Firebase 数据库 URL 格式
- 检查 Firebase 项目的数据库规则
- 确认项目 ID 正确

### 调试步骤

1. **检查构建日志**:
   - 在 Vercel Dashboard 中查看部署日志
   - 确认 `build-env.js` 成功执行

2. **检查生成的 env.js**:
   - 访问 `https://your-app.vercel.app/env.js`
   - 确认环境变量已正确注入

3. **检查浏览器控制台**:
   - 打开开发者工具
   - 查看 Console 标签的错误信息
   - 检查 Network 标签的请求状态

## 🔒 安全注意事项

1. **环境变量保护**:
   - 所有敏感信息都通过环境变量配置
   - `env.js` 文件在 `.gitignore` 中被忽略
   - 构建时动态生成，不会泄露到代码仓库

2. **Firebase 安全规则**:
   - 配置适当的数据库安全规则
   - 限制客户端访问权限

3. **API 密钥管理**:
   - 定期轮换 API 密钥
   - 监控 API 使用情况

## 📝 验证部署

部署完成后，请验证以下功能：

- [ ] 页面正常加载
- [ ] Firebase 连接成功
- [ ] 能够添加新订阅
- [ ] 能够编辑现有订阅
- [ ] 能够删除订阅
- [ ] 汇率更新功能正常
- [ ] 数据持久化正常

## 🆘 获取帮助

如果遇到问题，请：

1. 检查本指南的故障排除部分
2. 查看 Vercel 部署日志
3. 检查浏览器控制台错误
4. 参考 [Vercel 官方文档](https://vercel.com/docs)
5. 参考 [Firebase 官方文档](https://firebase.google.com/docs)

---

**注意**: 确保在生产环境中使用真实的 Firebase 配置，而不是示例值。