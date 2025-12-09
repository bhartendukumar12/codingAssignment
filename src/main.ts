// src/main.ts
// Polyfill util.isString for environments where it's missing.
// MUST run before importing AppModule which causes @Interval() to be evaluated.
const util = require('util');
if (typeof util.isString !== 'function') {
    // simple, safe polyfill that matches expected semantics
    util.isString = (v: any) => typeof v === 'string' || v instanceof String;
}

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';

async function bootstrap() {
    dotenv.config();
    const app = await NestFactory.create(AppModule);

    // validation pipe
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

    // --- Swagger setup ---
    const config = new DocumentBuilder()
        .setTitle('Orders API')
        .setDescription('E-commerce order processing API')
        .setVersion('1.0')
        .addTag('orders')
        .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document);
    // --- end swagger setup ---

    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await app.listen(port);
    console.log(`Orders API listening on port ${port}`);
    console.log(`Swagger UI: http://localhost:${port}/api-docs`);
}
bootstrap();
