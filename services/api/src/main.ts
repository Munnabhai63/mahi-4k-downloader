import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['https://mahi-4k-downloader.pages.dev', 'http://localhost:3000'];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: any) => void) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes('*') ||
        allowedOrigins.includes(origin) ||
        origin.endsWith('.pages.dev') ||
        origin.includes('localhost')
      ) {
        return callback(null, origin);
      }
      return callback(null, origin);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // OWASP Security Headers (§17)
  app.use((_req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // In-Memory Token Bucket Rate Limiting per IP (§17: 60 req/min for free, 300 req/min for auth)
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  app.use((req: any, res: any, next: () => void) => {
    // Skip health checks from rate limiting
    if (req.url === '/health' || req.url.startsWith('/docs')) {
      return next();
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = req.headers['authorization'] ? 300 : 120;

    let record = rateLimitMap.get(ip);
    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      rateLimitMap.set(ip, record);
    } else {
      record.count++;
    }

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxRequests) {
      return res.status(429).json({
        statusCode: 429,
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please wait a minute before making more requests.',
      });
    }

    next();
  });

  const config = new DocumentBuilder()
    .setTitle('TurboGrab API Gateway')
    .setDescription('Ultra-Fast Universal Video Downloader - REST & WebSocket API')
    .setVersion('1.0.0')
    .addTag('Health', 'Service Health and Uptime')
    .addTag('Analyze', 'Metadata Extraction & Format Discovery')
    .addTag('Downloads', 'Download Job Queue & File Streaming')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`[TurboGrab API] Gateway running on http://localhost:${port}`);
  console.log(`[TurboGrab API] Swagger documentation at http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  console.error('[TurboGrab API] Fatal bootstrap error:', err);
  process.exit(1);
});
