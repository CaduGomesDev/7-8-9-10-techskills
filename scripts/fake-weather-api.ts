import http from 'node:http';

const expected = process.argv[2] ?? '';
const port = Number(process.argv[3] ?? 4010);

http
  .createServer((req, res) => {
    console.log(`[fake-api] ${req.method} ${req.url}`);
    const auth = req.headers.authorization ?? '';
    if (auth !== `Bearer ${expected}`) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'invalid credentials' }));
      return;
    }
    const city = new URL(req.url ?? '/', 'http://localhost').searchParams.get('city');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ city, tempC: 24, condition: 'nublado' }));
  })
  .listen(port, () => console.log(`[fake-api] ouvindo em ${port}`));
