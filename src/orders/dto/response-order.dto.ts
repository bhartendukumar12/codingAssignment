import { AutoMap } from "@automapper/classes";
import { OrderStatus } from "../enums/order-status.enum";

export class OrderDto {
    @AutoMap()
  id: string;

  @AutoMap()
  customerName: string;

  @AutoMap()
  customerEmail: string;

  @AutoMap()
  status: OrderStatus;

  @AutoMap()
  total: string;

  @AutoMap(() => OrderItemDto)
  items: OrderItemDto[];

  @AutoMap()
  createdBy: string;

  @AutoMap()
  updatedBy: string;

  createdAt: Date;

  updatedAt: Date;
}

export class OrderItemDto {
  @AutoMap()
  id: string;

  @AutoMap()
  productId: string;

  @AutoMap()
  name: string;

  @AutoMap()
  quantity: number;

  @AutoMap()
  price: string;

  @AutoMap()
  order: OrderDto;
}
