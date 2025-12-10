// src/app.module.ts
import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AutomapperModule } from "@automapper/nestjs";
import { classes } from "@automapper/classes";
import { OrdersModule } from "./orders/orders.module";
import * as dotenv from "dotenv";
import { OrderEntity } from "./orders/entities/order.entity";
import { OrderItemEntity } from "./orders/entities/order-item.entity";

dotenv.config();

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: parseInt(process.env.DB_PORT || "5432", 10),
      username: process.env.DB_USERNAME || "postgres",
      password: process.env.DB_PASSWORD || "postgres",
      database: process.env.DB_DATABASE || "postgres",
      entities: [OrderEntity, OrderItemEntity],
      synchronize: true, // 👈 DEV ONLY: auto create/update tables
      logging: false,
    }),
    OrdersModule,
  ],
})
export class AppModule {}
