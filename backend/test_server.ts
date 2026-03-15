import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('OK'));
app.listen(5001, () => console.log('Test server running on 5001'));
