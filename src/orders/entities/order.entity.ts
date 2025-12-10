import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { AutoMap } from "@automapper/classes";
import { OrderStatus } from "../enums/order-status.enum";
import { OrderItemEntity } from "./order-item.entity";

@Entity({ name: "orders" })
export class OrderEntity {
    @AutoMap()
  @PrimaryGeneratedColumn()
  id: string;

  @AutoMap()
  @Column()
  customerName: string;

  @AutoMap()
  @Column()
  customerEmail: string;

  @AutoMap()
  @Column({ type: "enum", enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @AutoMap()
  @Column({ type: "numeric", precision: 18, scale: 2, default: 0 })
  total: string;

  @AutoMap(() => OrderItemEntity)
  @OneToMany(() => OrderItemEntity, (item) => item.order)
  items: OrderItemEntity[];

  @AutoMap()
  @Column()
  createdBy: string;

  @AutoMap()
  @Column({ nullable: true })
  updatedBy: string;

  // @AutoMap()
  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  // @AutoMap()
  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;
}
