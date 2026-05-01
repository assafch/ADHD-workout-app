import { pool } from "./client.js";

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name VARCHAR(100),
  locale VARCHAR(5) NOT NULL DEFAULT 'he',
  units VARCHAR(5) NOT NULL DEFAULT 'kg',
  height_cm REAL,
  dob DATE,
  program_start_date DATE,
  current_program_id INTEGER,
  rack JSONB NOT NULL DEFAULT '[2,5,7,10,12,14,16,18,20,22,25,28,30,32,34,36]'::jsonb,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(80) NOT NULL UNIQUE,
  name_en VARCHAR(120) NOT NULL,
  name_he VARCHAR(120) NOT NULL,
  primary_muscles JSONB NOT NULL,
  equipment VARCHAR(40) NOT NULL,
  is_unilateral BOOLEAN NOT NULL DEFAULT FALSE,
  instruction_en TEXT,
  instruction_he TEXT
);

CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name_en VARCHAR(120) NOT NULL,
  name_he VARCHAR(120) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  phase INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS program_days (
  id SERIAL PRIMARY KEY,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  name_en VARCHAR(120) NOT NULL,
  name_he VARCHAR(120) NOT NULL,
  is_rest_day BOOLEAN NOT NULL DEFAULT FALSE,
  is_cardio_day BOOLEAN NOT NULL DEFAULT FALSE,
  notes_en TEXT,
  notes_he TEXT
);

CREATE TABLE IF NOT EXISTS program_exercises (
  id SERIAL PRIMARY KEY,
  program_day_id INTEGER NOT NULL REFERENCES program_days(id) ON DELETE CASCADE,
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  order_index INTEGER NOT NULL,
  target_sets INTEGER NOT NULL,
  target_reps_min INTEGER NOT NULL,
  target_reps_max INTEGER NOT NULL,
  rest_seconds INTEGER NOT NULL,
  start_weight_kg REAL,
  notes_en TEXT,
  notes_he TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  program_day_id INTEGER REFERENCES program_days(id),
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  rpe INTEGER,
  notes TEXT,
  is_bad_day BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  client_id VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS set_logs (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  program_exercise_id INTEGER REFERENCES program_exercises(id),
  exercise_id INTEGER NOT NULL REFERENCES exercises(id),
  set_number INTEGER NOT NULL,
  weight_kg REAL NOT NULL,
  reps INTEGER NOT NULL,
  rir INTEGER,
  is_pr BOOLEAN NOT NULL DEFAULT FALSE,
  one_rm_kg REAL,
  completed_at TIMESTAMP NOT NULL,
  client_id VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS body_metrics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  weight_kg REAL NOT NULL,
  notes TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS body_user_date_idx ON body_metrics (user_id, date);
CREATE INDEX IF NOT EXISTS sessions_user_started_idx ON sessions (user_id, started_at);
CREATE INDEX IF NOT EXISTS set_logs_session_idx ON set_logs (session_id);
CREATE INDEX IF NOT EXISTS set_logs_exercise_idx ON set_logs (exercise_id);
CREATE INDEX IF NOT EXISTS sessions_client_id_idx ON sessions (client_id);
CREATE INDEX IF NOT EXISTS set_logs_client_id_idx ON set_logs (client_id);
`;

export async function bootstrapSchema() {
  await pool.query(SQL);
  console.log("[bootstrap] Schema ensured");
}
