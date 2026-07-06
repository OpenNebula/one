const express = require('express');
const path = require('path');
const configRoutes = require('./routes/config');

const app = express();
const PORT = 3000; // or configuration

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// API routes
app.use(configRoutes);

app.listen(PORT, () => {
  console.log(`Sunstone server listening on port ${PORT}`);
});
