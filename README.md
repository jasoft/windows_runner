# Windows Runner API

基于 Node.js + Express 的 Windows 命令执行 API，可通过 HTTP 调用在宿主机上执行任意命令（包含 GUI 程序）。支持同步/异步执行、实时状态查询、Swagger 文档以及（实验性质的）Windows 容器镜像。

## 快速开始

```bash
# 安装依赖
yarn install # 或 npm install

# 开发模式（热加载）
npm run dev

# 生产模式
npm run build
npm start
```

默认监听 `http://localhost:3000`，可通过 `PORT` 环境变量覆盖。

### 环境变量

- `PORT`: 服务端口，默认为 `3000`。
- `ALLOWED_COMMANDS`: 逗号分隔的白名单，例如 `notepad.exe,calc.exe`，未设置则允许任意命令。
- `DEFAULT_TIMEOUT_MS`: 全局超时时间，超时后自动终止进程。
- `MAX_OUTPUT_LENGTH`: 保存到内存中的 stdout/stderr 最大长度（字符），默认 `200000`。

## API 说明

完整文档见 `http://localhost:3000/docs`（Swagger UI）。核心端点：

- `POST /api/commands`: 执行命令。请求体示例：

```json
{
  "command": "notepad.exe",
  "args": [],
  "waitForExit": false,
  "startDetached": true
}
```

- `GET /api/commands`: 查询所有任务。
- `GET /api/commands/{id}`: 查询单个任务详情。
- `POST /api/commands/{id}/kill`: 终止正在运行的任务。

`waitForExit = false` 可实现异步执行，服务端立即返回 `202` 和任务 `id`；后续通过 `GET` 查询状态。

`startDetached = true` 在 Windows 上会自动改用 `cmd /c start` 以便拉起 GUI 程序（如记事本、计算器等），即使 API 进程在后台运行也可以展示窗口。

## Docker（实验）

仓库包含基于 `mcr.microsoft.com/windows/servercore:ltsc2022` 的 Windows 容器 `Dockerfile`。构建前需执行 `npm run build` 生成 `dist`：

```powershell
npm install
npm run build

docker build -t windows-runner .
docker run -p 3000:3000 --name windows-runner windows-runner
```

⚠️ Windows 容器对 GUI 程序支持有限，启动 GUI 时需要宿主 Windows Server/Pro 开启对容器的桌面交互支持。生产环境更推荐直接在宿主系统运行 API。

## 安全提示

- 强烈建议配置 `ALLOWED_COMMANDS` 或额外在网关层增加认证，以避免任意命令执行风险。
- 根据需要限制 API 的来源 IP（如通过防火墙或反向代理）。
- 对输出内容设置了最大保存长度，避免巨量日志导致内存占用。

## 后续扩展建议

1. 将执行记录持久化（Redis/数据库）并加入鉴权。
2. 提供 WebSocket 或 SSE 推送实时输出。
3. 根据业务需求增加多租户/命令模板等高级功能。
