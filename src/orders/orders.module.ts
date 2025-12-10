// src/orders/orders.module.ts
import { Module } from "@nestjs/common";
import { AutomapperModule } from "@automapper/nestjs";
import { classes } from "@automapper/classes";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrderEntity } from "./entities/order.entity";
import { OrderItemEntity } from "./entities/order-item.entity";
import { OrderProfile } from "./profile/order.profile";

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity, OrderItemEntity]),
    AutomapperModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderProfile],
})
export class OrdersModule {}
