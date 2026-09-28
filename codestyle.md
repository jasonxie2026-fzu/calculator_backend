# Backend Code Style

参考：Node.js 官方 JavaScript 风格建议与 Google JavaScript Style Guide（https://google.github.io/styleguide/jsguide.html）。

- 使用 ES Modules 和 2 个空格缩进。
- 使用 camelCase 命名变量和函数，常量使用全大写或语义清晰的普通常量名。
- API 层负责 HTTP 输入输出，计算模块不依赖 HTTP。
- 数据库语句使用参数绑定，不拼接用户输入。
- 不使用 `eval`、`exec` 或其他任意代码执行方式处理表达式。
- 异常使用明确的错误消息和合适的 HTTP 状态码返回。
