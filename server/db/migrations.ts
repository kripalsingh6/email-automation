import { getDatabase } from './connection';

export function runMigrations(): void {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS check_runs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      run_date    TEXT NOT NULL,
      run_time    TEXT NOT NULL,
      trigger     TEXT NOT NULL,
      total       INTEGER NOT NULL,
      submitted   INTEGER NOT NULL,
      missing     INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS check_results (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id           INTEGER NOT NULL REFERENCES check_runs(id) ON DELETE CASCADE,
      employee_id      TEXT NOT NULL,
      employee_name    TEXT NOT NULL,
      email            TEXT NOT NULL,
      status           TEXT NOT NULL,
      reminder_sent_at TEXT,
      subject_found    TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_check_runs_date ON check_runs(run_date);
    CREATE INDEX IF NOT EXISTS idx_check_results_run_id ON check_results(run_id);
  `);

  console.log('📦 Database migrations executed successfully.');
}
