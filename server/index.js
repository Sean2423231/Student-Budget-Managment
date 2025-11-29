require('dotenv').config(); // Loads environment variables from .env file

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');


app.use(cors());

//Initialize database connection
require('./db.js');
app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

// API routes
app.use('/api', require('./routes/chart.routes'));
app.use('/api', require('./routes/test.routes')); 
app.use('/api', require('./routes/user.routes'));
app.use('/api', require('./routes/notifications.routes'));


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Pages', 'home.html'));
});


app.get('/:page.html', (req, res, next) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, '..', 'Pages', `${page}.html`);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  return next(); 
});

app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  const filePath = path.join(__dirname, '..', 'Pages', `${page}.html`);
  if (fs.existsSync(filePath)) {
    return res.redirect(`/${page}.html`);
  }
  return next();
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Backend is talking to frontend!',
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});