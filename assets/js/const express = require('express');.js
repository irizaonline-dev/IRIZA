const express = require('express');
const cors = require('cors');
const collaborators = require('./routes/collaborators');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/collaborators', collaborators);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
