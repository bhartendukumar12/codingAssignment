"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require('util');
if (typeof util.isString !== 'function') {
    util.isString = (v) => typeof v === 'string' || v instanceof String;
}
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const dotenv = require("dotenv");
async function bootstrap() {
    dotenv.config();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Orders API')
        .setDescription('E-commerce order processing API')
        .setVersion('1.0')
        .addTag('orders')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api-docs', app, document);
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await app.listen(port);
    console.log(`Orders API listening on port ${port}`);
    console.log(`Swagger UI: http://localhost:${port}y/api-docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map