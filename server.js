const express = require('express');
const db = require('./db/db');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.send({ message: "Server is brewing!" });
});

app.get('/api/brews', async (req, res) => {
  try {
    const brews = await db.getAllBrews();
    res.json(brews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not fetch brews" });
  }
});

app.post('/api/brews', async (req, res) => {
  const { region, coffee_amount, roast_type } = req.body;
  try {
    const newBrew = await db.createBrew(region, coffee_amount, roast_type);
    res.status(201).json(newBrew);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not save brew" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is steaming at http://localhost:${PORT}`);
});