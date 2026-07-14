const cron = require("node-cron");
const config = require("./config");
const logger = require("./utils/logger");
const store = require("./state/store");
const { syncArticles } = require("./services/articleSync");
const { syncDocuments } = require("./services/documentSync");

let running = false;

async function runSyncOnce() {
  if (running) {
    logger.warn("Lan chay truoc chua xong, bo qua lan nay.");
    return;
  }
  running = true;
  const state = store.load();
  try {
    await syncArticles(state);
    await syncDocuments(state);
  } catch (err) {
    logger.error("Loi khi dong bo:", err.message);
  } finally {
    running = false;
  }
}

async function main() {
  const runOnceOnly = process.argv.includes("--once");

  if (!config.zalo.sendEnabled) {
    logger.warn(
      "ZALO_SEND_ENABLED=false -> dang chay che do DRY-RUN, se khong gui tin that toi Zalo OA."
    );
  }

  if (runOnceOnly) {
    logger.info("Chay dong bo 1 lan (--once)...");
    await runSyncOnce();
    process.exit(0);
  }

  logger.info(`Khoi dong scheduler, cron: "${config.sync.cronExpression}"`);
  await runSyncOnce();
  cron.schedule(config.sync.cronExpression, runSyncOnce);
}

main().catch((err) => {
  logger.error("Loi khong the phuc hoi, dung ung dung:", err);
  process.exit(1);
});
