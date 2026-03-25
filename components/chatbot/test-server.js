console.log('Starting server...');

const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ message: 'Server is working!' }));
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
