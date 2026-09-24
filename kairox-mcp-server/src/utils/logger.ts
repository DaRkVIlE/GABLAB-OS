const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
const currentLevel = (process.env.LOG_LEVEL as keyof typeof LOG_LEVELS) ?? "info";

function log(level: keyof typeof LOG_LEVELS, message: string, meta?: object) {
  if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

  const entry = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  });

  // SEMPRE stderr — nunca stdout
  process.stderr.write(entry + "\n");
}

export const logger = {
  debug: (msg: string, meta?: object) => log("debug", msg, meta),
  info:  (msg: string, meta?: object) => log("info",  msg, meta),
  warn:  (msg: string, meta?: object) => log("warn",  msg, meta),
  error: (msg: string, meta?: object) => log("error", msg, meta),
};
