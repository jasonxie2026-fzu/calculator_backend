import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function createDatabase(filename) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  const database = new DatabaseSync(filename);
  database.exec(`
    CREATE TABLE IF NOT EXISTS calculation_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expression TEXT NOT NULL,
      result REAL NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const insert = database.prepare(
    'INSERT INTO calculation_history (expression, result) VALUES (?, ?)'
  );
  const list = database.prepare(
    'SELECT id, expression, result, created_at FROM calculation_history ORDER BY id DESC'
  );
  const remove = database.prepare('DELETE FROM calculation_history WHERE id = ?');
  const removeAll = database.prepare('DELETE FROM calculation_history');

  return {
    addHistory(expression, result) {
      const response = insert.run(expression, result);
      return { id: Number(response.lastInsertRowid), expression, result };
    },
    listHistory() {
      return list.all().map((row) => ({
        id: Number(row.id),
        expression: row.expression,
        result: Number(row.result),
        created_at: row.created_at,
      }));
    },
    deleteHistory(id) {
      return Number(remove.run(id).changes) > 0;
    },
    deleteAll() {
      return Number(removeAll.run().changes);
    },
    close() {
      database.close();
    },
  };
}
