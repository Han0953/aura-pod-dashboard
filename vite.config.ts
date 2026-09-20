import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Inject env vars to process.env for serverless handlers
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  process.env.GEMINI_MODEL = env.GEMINI_MODEL || process.env.GEMINI_MODEL;
  process.env.AUTH_USERNAME = env.AUTH_USERNAME || process.env.AUTH_USERNAME;
  process.env.AUTH_PASSWORD = env.AUTH_PASSWORD || process.env.AUTH_PASSWORD;

  return {
    plugins: [
      react(),
      {
        name: 'api-serverless-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url && req.url.startsWith('/api/gemini')) {
              try {
                let body = '';
                req.on('data', (chunk) => {
                  body += chunk;
                });
                req.on('end', async () => {
                  try {
                    req.body = body ? JSON.parse(body) : {};
                  } catch {
                    req.body = {};
                  }
                  const geminiModule = await import('./api/gemini.js');
                  const geminiHandler = geminiModule.default;
                  await geminiHandler(req, res);
                });
                return;
              } catch (e) {
                console.error('[API Gemini Dev Error]', e);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: String(e) }));
                return;
              }
            }

            if (req.url && req.url.startsWith('/api/login')) {
              try {
                let body = '';
                req.on('data', (chunk) => {
                  body += chunk;
                });
                req.on('end', async () => {
                  try {
                    req.body = body ? JSON.parse(body) : {};
                  } catch {
                    req.body = {};
                  }
                  const loginModule = await import('./api/login.js');
                  const loginHandler = loginModule.default;
                  loginHandler(req, res);
                });
                return;
              } catch (e) {
                console.error('[API Login Dev Error]', e);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: String(e) }));
                return;
              }
            }

            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  };
});

