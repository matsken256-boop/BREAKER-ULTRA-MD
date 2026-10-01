const app = require('./app');
const startBot = require('./index');
const PORT = process.env.PORT || require('./settings').PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server on ${PORT}`);
  startBot();
});
