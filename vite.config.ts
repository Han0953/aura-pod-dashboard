import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import geminiHandler from './api/gemini.js';
import loginHandler from './api/login.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Inject env vars to process.env for serverless handlers (only if defined)
  if (env.GEMINI_API_KEY) process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  if (env.GEMINI_MODEL) process.env.GEMINI_MODEL = env.GEMINI_MODEL;
  if (env.AUTH_USERNAME) process.env.AUTH_USERNAME = env.AUTH_USERNAME;
  if (env.AUTH_PASSWORD) process.env.AUTH_PASSWORD = env.AUTH_PASSWORD;

  return {
    plugins: [
      react(),
      {
        name: 'api-serverless-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            // Polyfill Express-like methods for Connect middleware
            const response = res as any;
            if (!response.status) {
              response.status = function (code: number) {
                response.statusCode = code;
                return response;
              };
            }
            if (!response.json) {
              response.json = function (data: any) {
                response.setHeader('Content-Type', 'application/json');
                response.end(JSON.stringify(data));
                return response;
              };
            }

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

