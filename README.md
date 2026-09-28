# Calculator Backend

Node.js 24+ 原生 HTTP 服务，使用递归下降解析器处理数学表达式，使用 Node 内置 `node:sqlite` 保存计算历史。

## 启动

```bash
node src/server.js
```

可通过 `PORT=3000` 和 `DATABASE_FILE=./data/history.sqlite` 配置端口及数据库文件路径。Windows PowerShell 示例：

```powershell
$env:PORT=3000
node src/server.js
```

## 测试

```bash
node --test test/calculator.test.js
```

服务启动后会自动创建 `data/history.sqlite` 和 `calculation_history` 表，不需要手动导入 SQL。
