module.exports = {
  MASTER_PASSWORD: process.env.MASTER_PASSWORD || "123456",
  DATABASE_URL: process.env.DATABASE_URL || null,
  ACCESS_CODE_LENGTH: 6,
  ACCESS_CODE_EXPIRY: 5 * 60 * 1000,
  PORT: process.env.PORT || 3000,

  // Your GitHub username (must have forked the repo)
  GITHUB_USERNAME: process.env.GITHUB_USERNAME || '',

};