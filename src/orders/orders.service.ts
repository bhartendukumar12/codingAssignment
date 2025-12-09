import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { OrderEntity } from "./entities/order.entity";
import { OrderItemEntity } from "./entities/order-item.entity";
import { OrderStatus } from "./enums/order-status.enum";
import { CreateOrderDto } from "./dto/create-order.dto";
import { computeTotal, nowIso } from "../common/utils";
import { Interval } from "@nestjs/schedule";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepo: Repository<OrderItemEntity>,
    private readonly dataSource: DataSource
  ) {}

  async create(dto: CreateOrderDto): Promise<OrderEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const orderRepo = queryRunner.manager.getRepository(OrderEntity);
      const itemRepo = queryRunner.manager.getRepository(OrderItemEntity);

      if (!dto.customer?.name || !dto.customer?.email) {
        throw new BadRequestException(
          "customer name and customer email is required"
        );
      }

      dto.items.forEach((it, idx) => {
        if (!it.productId)
          throw new BadRequestException(`items[${idx}].productId required`);
        if (!it.quantity || Number(it.quantity) <= 0)
          throw new BadRequestException(`items[${idx}].quantity must be > 0`);
        if (it.price == null || isNaN(Number(it.price)))
          throw new BadRequestException(`items[${idx}].price must be numeric`);
      });

      // Create the order (without items)
      const order = new OrderEntity();
      order.customerName = dto.customer.name;
      order.customerEmail = dto.customer.email;
      order.status = OrderStatus.PENDING;

      // compute total from items below
      const tempItems = dto.items.map((it) => ({
        quantity: it.quantity,
        price: Number(it.price),
      }));
      const totalNum = computeTotal(tempItems as any);
      order.total = totalNum.toFixed(2);

      // Save order first
      const savedOrder = await orderRepo.save(order);

      // Create and save items separately, assigning the order
      const items = dto.items.map((it) => {
        const item = new OrderItemEntity();
        item.productId = it.productId;
        item.name = it.name;
        item.quantity = it.quantity;
        item.price = Number(it.price).toFixed(2);
        item.order = savedOrder;
        return item;
      });

      await itemRepo.save(items);

      await queryRunner.commitTransaction();

      return this.findById(savedOrder.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findById(orderId: string): Promise<OrderEntity | null> {
    return await this.orderRepo
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.items", "item")
      .where("order.id = :id", { id: orderId })
      .getOne();
  }

  async findAll(status?: OrderStatus): Promise<OrderEntity[]> {
    const qb = this.orderRepo
      .createQueryBuilder("order")
      .leftJoinAndSelect("order.items", "item");

    if (status) {
      qb.where("order.status = :status", { status });
    }
    return qb.getMany();
  }

  async updateStatus(
    id: string,
    nextStatus: OrderStatus
  ): Promise<OrderEntity> {
    const order = await this.findById(id);
    if (!Object.values(OrderStatus).includes(nextStatus))
      throw new BadRequestException("Invalid status");
    if ([OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status)) {
      throw new BadRequestException(
        `Cannot change status from ${order.status}`
      );
    }
    order.status = nextStatus;
    order.updatedAt = new Date();
    return this.orderRepo.save(order);
  }

  async cancel(id: string): Promise<OrderEntity> {
    const order = await this.findById(id);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException("Only PENDING orders can be cancelled");
    }
    order.status = OrderStatus.CANCELLED;
    order.updatedAt = new Date();
    return this.orderRepo.save(order);
  }

  // promotion using Interval
  @Interval(Number(process.env.JOB_INTERVAL_MS || 100000))
  async promotePending() {
    console.log("running promotePending---->");
    const pending = await this.orderRepo.find({
      where: { status: OrderStatus.PENDING },
    });
    if (!pending.length) return;
    const now = new Date();
    for (const o of pending) {
      o.status = OrderStatus.PROCESSING;
      o.updatedAt = now;
    }
    await this.orderRepo.save(pending);
    console.log(`promoted ${pending.length} orders`);
  }
}
