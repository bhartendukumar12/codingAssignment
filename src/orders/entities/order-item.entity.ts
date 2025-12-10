import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { AutoMap } from "@automapper/classes";
import { OrderEntity } from "./order.entity";

@Entity({ name: "order_items" })
export class OrderItemEntity {
      @AutoMap()
  @PrimaryGeneratedColumn()
  id: string;

  @AutoMap()
  @Column()
  productId: string;

  @AutoMap()
  @Column({ nullable: true })
  name: string;

  @AutoMap()
  @Column({ type: "int" })
  quantity: number;

  @AutoMap()
  @Column({ type: "numeric", precision: 18, scale: 2 })
  price: string;

  @AutoMap()
  @ManyToOne(() => OrderEntity, (order) => order.items)
  @JoinColumn({ name: "orderId" })
  order: OrderEntity;
}
