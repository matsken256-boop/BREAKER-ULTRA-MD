/**
 * Change the MASTER_PASSWORD to something secure
 * This password is required for:
 * - Pairing new sessions
 * - Accessing paired sessions via web
 */

module.exports = {
  // Web dashboard password - required to pair sessions and access settings
  MASTER_PASSWORD: process.env.MASTER_PASSWORD || "Breaker123",

  // PostgreSQL connection string (auto-set by Heroku Postgres add-on)
  DATABASE_URL: process.env.DATABASE_URL || null,

  // Session access code settings (don't change if you don't know what you're doing)
  ACCESS_CODE_LENGTH: 6,
  ACCESS_CODE_EXPIRY: 5 * 60 * 1000,

  // Server port (auto-set by hosting platform)
  PORT: process.env.PORT || 3000,

  // Your GitHub username (must have forked the repo)
  GITHUB_USERNAME: process.env.GITHUB_USERNAME || '',
};
