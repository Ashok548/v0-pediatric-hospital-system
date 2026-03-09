import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // API prefix for all routes: /api/auth/login, /api/auth/me etc.
  app.setGlobalPrefix("api");

  // Enable CORS — only allow requests from the Next.js frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    credentials: true, // Required to send/receive cookies cross-origin
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  // Parse incoming cookies (needed to extract the JWT from access_token cookie)
  app.use(cookieParser());

  // Validate all incoming request bodies using class-validator via LoginDto etc.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // Strip extra fields not in DTO
      forbidNonWhitelisted: true, // Reject requests with unknown fields
      transform: true,           // Auto-transform primitives (strings -> numbers)
    })
  );

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`🏥 CareNest API running on http://localhost:${port}/api`);
}

bootstrap();
