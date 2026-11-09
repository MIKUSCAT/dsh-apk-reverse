# DSH APK Reverse

把 [apk-reverse](https://github.com/newliver666/apk-reverse) 接入 **DeepSeek Harness（DSH）**。安装后，DSH 能发现 `apk-reverse` 技能，在分析 Android APK 时按需加载完整流程、参考文档和辅助脚本。

基于你提供的上游快照制作：**229 个原始文件完整保留，67 个脚本文件、67 份参考文档**。它是一套分析工作流和工具脚本，不是装上就能自动破解任意 APK 的黑盒工具。

## 安装

在运行 DSH 的那台电脑上执行：

```sh
dsh plugin --profile web add github:MIKUSCAT/dsh-apk-reverse
```

重启对应的 DSH 实例，或在插件管理里重新加载。使用其他 profile 时，把 `web` 换成实际名称。默认的标准配置应已包含技能注册服务和 `skill` 工具；精简配置需要启用 `@deepseek-ai/dsh-skill` 与 `@deepseek-ai/dsh-tool-skill`，以及文件读取和终端工具。

适配基线：DSH `0.2.1-rc.5` 的原生技能提供器接口，Node.js 22.19+。仓库直接提供可执行的 ESM 入口，安装无需编译，也没有安装后自动下载 Android 工具的脚本。

## 在 DSH 里怎么用

把 APK 放到 DSH 当前工作目录，直接说：

> 使用 apk-reverse 技能，先检查本机工具链，再分析这个 APK 的包信息、DEX、原生库和保护情况。先给我分析结果和下一步建议。

也可以明确要求加载 `apk-reverse`。技能会指导模型检查环境、选择代码层、保留对照、执行改动并验证结果。最终能做哪些操作取决于你本机的工具和设备。

| 功能 | 需要什么 |
| --- | --- |
| 查看技能和参考资料 | DSH 的技能与文件读取工具 |
| 运行 Python 辅助脚本 | Python 3.9+；部分脚本有额外依赖 |
| 设备检查、安装与启动验证 | Android platform-tools 中的 ADB、已授权连接的手机 |
| 重打包和签名 | 对应打包工具、zipalign、apksigner 等，按 doctor 报告补齐 |
| Frida 动态分析 | 匹配的 Frida 工具及设备环境 |

**Windows 可直接安装插件。** 启动器支持 `py -3`、`python` 和带空格的路径；上游部分命令依赖 Bash、Unix 工具或特定设备环境，必要时使用 WSL。安装插件不代表全部上游路线都已具备运行条件。

## 手动检查环境

在克隆或下载后的本仓库目录执行：

```sh
node bin/apk-reverse.mjs doctor --json
node bin/apk-reverse.mjs paths
node bin/apk-reverse.mjs list
node bin/apk-reverse.mjs run preflight.py --help
```

`paths` 显示实际安装位置。DSH 加载技能时也会获得这些绝对路径，不需要把 `skills/` 手动复制到每个项目。CLI 保持当前工作目录，参数原样传给 Python，不经 shell 拼接。

如需指定 Python，在 PowerShell 设置后重启 DSH，使其继承环境变量：

```powershell
$env:APKREV_PYTHON = 'C:\Program Files\Python312\python.exe'
```

`doctor` 返回退出码 **3** 代表某些能力缺少依赖；它会列出缺什么。其他脚本保留上游退出码。环境检查不会自动安装软件。

## 加载方式

插件通过 `ctx.skills.registerProvider()` 注册一个名为 `apk-reverse` 的技能。平时只提供短摘要；加载技能时才读取完整正文，具体参考资料由模型按需要读取。上游正文较长，约一万多 token，激活后确实会占用上下文，不能宣称零成本。

项目内的同名技能优先于该插件的 bundled 技能。如果你已有旧版本并发现一直加载旧内容，检查项目 `.dsh/skills`、`.agents/skills` 以及用户技能目录里的同名项。

## 来源与维护

- `index.mjs`、`src/`、`bin/`：DSH 适配和启动器。
- `upstream/`：原压缩包的完整目录，原始文件不改写。
- `upstream-manifest.json`：原始文件 SHA-256 清单，便于核对后续更新。
- [上游中文说明](upstream/README.zh-CN.md)：完整能力、限制和工具安装说明。
- [NOTICE.md](NOTICE.md)：来源、快照提交与许可。

上游内容和适配层均按 MIT 许可证提供，保留原作者版权。此仓库不是 DeepSeek 或原作者的官方插件。

## 开发验证

```sh
npm ci --ignore-scripts
npm run check
```

检查包括上游完整性、插件注册/按需加载、绝对路径、Python 启动与真实 DSH 技能注册服务的集成。CI 还运行 Linux/Windows 的适配层检查及上游 Python 测试。没有接入手机的测试不代表已完成真机验证。

首次交付的本地验证：适配层 8 项通过；上游 787 项通过、216 项跳过、27 项预期失败。跳过项和预期失败属于上游已有标记，不算作已验证能力。原命令检查器的两处误报及 CI 处理见 [NOTICE.md](NOTICE.md)。
