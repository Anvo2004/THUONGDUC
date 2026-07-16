const fs = require("fs");
const path = require("path");
const axios = require("axios");
const config = require("../config");
const logger = require("../utils/logger");

const REDIS_KEY = "zalo:oa:token";

const useRedis = Boolean(config.redis.url && config.redis.token);

async function redisCommand(command) {
  const { data } = await axios.post(config.redis.url, command, {
    headers: { Authorization: `Bearer ${config.redis.token}` },
    timeout: 10000,
  });
  return data.result;
}

async function loadFromRedis() {
  const raw = await redisCommand(["GET", REDIS_KEY]);
  return raw ? JSON.parse(raw) : null;
}

async function saveToRedis(token) {
  await redisCommand(["SET", REDIS_KEY, JSON.stringify(token)]);
}

function loadFromDisk() {
  const filePath = config.paths.zaloTokenFile;
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    logger.warn("Khong doc duoc zalo-token.json:", err.message);
    return null;
  }
}

function saveToDisk(token) {
  const filePath = config.paths.zaloTokenFile;
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(token, null, 2), "utf-8");
}

async function loadToken() {
  return useRedis ? loadFromRedis() : loadFromDisk();
}

async function saveToken(token) {
  return useRedis ? saveToRedis(token) : saveToDisk(token);
}

module.exports = { loadToken, saveToken, useRedis };
