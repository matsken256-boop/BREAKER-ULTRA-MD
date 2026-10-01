const app = require('./app');
const startBot = require('./index');
const settings = require('./settings');
const PORT = process.env.PORT || settings.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on ${PORT}`);
  startBot();
});
