# 来源与改动

本项目为 MIKUSCAT 维护的 DeepSeek Harness 适配层，不是原作者或 DeepSeek 官方插件。

`upstream/` 完整保留用户提供的 `apk-reverse-codeberg-mirror-main.zip` 内容，包括原始 MIT 许可证、技能正文、脚本、参考文档、测试和证据记录。上游 README 标注的原项目为 <https://github.com/newliver666/apk-reverse>。

该 ZIP 记录的提交为 `90d9bd3e5715e0fffd7a3ee1bcb0c22f51b15664`。导入依据为这份压缩包，不宣称它是当前线上最新版。`upstream-manifest.json` 记录压缩包及每个上游文件的 SHA-256；`npm run verify:upstream` 可核对是否发生改动。

适配层新增 DSH 技能提供器、插件安装清单、绝对资源路径说明、跨平台 Python 启动入口、测试及安装文档。载入时在原文前补充 DSH 路径说明，不改写上游磁盘文件。上游实验结论、覆盖范围和限制仍以其原始记录为准。

Copyright (c) 2026 MIKUSCAT — adapter code, MIT.
Copyright (c) 2026 apk-reverse contributors — upstream content, MIT.

## 上游检查器的已知误报

原快照的 `check_commands.py` 把两条 `python tests/run_tests.py -q` 命令报为参数漂移，但 `run_tests.py` 实际把参数直接交给 `pytest.main()`，`-q` 是合法参数。适配层 CI 保留原检查器，仅对这两处精确的文件、行号、命令和错误类型设置已知误报基线；新增漂移仍会失败。没有修改原始文档或脚本。
