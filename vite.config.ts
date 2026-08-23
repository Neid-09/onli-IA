import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { join } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-api',
      configureServer(server) {
        server.middlewares.use('/api/pqrs', (_req, res) => {
          try {
            const data = readFileSync(join(process.cwd(), 'data', 'pqrs.json'), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } catch (error) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: "No se pudo leer pqrs.json" }));
          }
        });
      }
    }
  ],
})
