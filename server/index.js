const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Static files (Pages and assets)
app.use(express.static(path.join(__dirname, '..')));

// Body parser (if needed later)
app.use(express.json());

// API routes
app.use('/api', require('./routes/chart.routes'));

// Fallback - serve homepage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'Pages', 'home.html'));
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
