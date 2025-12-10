import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
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
import { LoggerHelper } from "../common/logger";

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
        if (!it.productId) {
          throw new BadRequestException(`items[${idx}].productId required`);
        }
        if (!it.quantity || Number(it.quantity) <= 0) {
          throw new BadRequestException(`items[${idx}].quantity must be > 0`);
        }
        if (it.price == null || isNaN(Number(it.price))) {
          throw new BadRequestException(`items[${idx}].price must be numeric`);
        }
      });

      // Create order
      const order = new OrderEntity();
      order.customerName = dto.customer.name;
      order.customerEmail = dto.customer.email;
      order.createdBy = dto.customer.email;
      order.status = OrderStatus.PENDING;

      const tempItems = dto.items.map((it) => ({
        quantity: it.quantity,
        price: Number(it.price),
      }));

      const totalNum = computeTotal(tempItems as any);
      order.total = totalNum.toFixed(2);

      const savedOrder = await orderRepo.save(order);

      // Create items
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

      LoggerHelper.log(
        `Order created successfully (orderId=${savedOrder.id}, items=${items.length})`,
        "OrderService.create"
      );

      return this.findById(savedOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof BadRequestException) {
        LoggerHelper.warn(error.message, "OrderService.create");
        throw error;
      }

      LoggerHelper.error(
        "Failed to create order",
        error,
        "OrderService.create"
      );

      throw new InternalServerErrorException("Unable to create order");
    } finally {
      await queryRunner.release();
    }
  }

  async findById(orderId: string): Promise<OrderEntity | null> {
    try {
      const order = await this.orderRepo
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.items", "item")
        .where("order.id = :id", { id: orderId })
        .getOne();
      LoggerHelper.log(`findById success. `, "OrderService.findById");
      return order;
    } catch (error) {
      LoggerHelper.error(
        `Failed to fetch order by id: ${orderId}`,
        error,
        "OrderService.findById"
      );

      throw new InternalServerErrorException("Unable to fetch order details");
    }
  }

  async findAll(
    status?: OrderStatus,
    page = 1,
    limit = 10
  ): Promise<{
    data: OrderEntity[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const safePage = page < 1 ? 1 : page;
      const safeLimit = Math.min(Math.max(limit, 1), 100); // 1–100

      const qb = this.orderRepo
        .createQueryBuilder("order")
        .leftJoinAndSelect("order.items", "item")
        .orderBy("order.createdAt", "DESC");

      if (status) {
        qb.where("order.status = :status", { status });
      }

      const [data, total] = await qb
        .skip((safePage - 1) * safeLimit)
        .take(safeLimit)
        .getManyAndCount();

      LoggerHelper.log(
        `findAll success. Returned ${data.length} records out of total ${total}`,
        "OrderService.findAll"
      );

      return {
        data,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit) || 1,
      };
    } catch (error) {
      LoggerHelper.error(
        `Failed to fetch orders (status=${status}, page=${page}, limit=${limit})`,
        error,
        "OrderService.findAll"
      );

      throw new InternalServerErrorException("Unable to fetch order list");
    }
  }

  async updateStatus(
    id: string,
    nextStatus: OrderStatus,
    updatedBy: string
  ): Promise<OrderEntity> {
    try {
      const order = await this.findById(id);

      if (!order) {
        throw new BadRequestException(`Order ${id} not found`);
      }

      if (!Object.values(OrderStatus).includes(nextStatus)) {
        throw new BadRequestException("Invalid status");
      }

      if (
        [OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status)
      ) {
        throw new BadRequestException(
          `Cannot change status from ${order.status}`
        );
      }

      order.status = nextStatus;
      order.updatedBy = updatedBy;
      order.updatedAt = new Date();

      const savedOrder = await this.orderRepo.save(order);

      LoggerHelper.log(
        `Order ${id} status updated to ${nextStatus} by ${updatedBy}`,
        "OrderService.updateStatus"
      );

      return savedOrder;
    } catch (error) {
      if (error instanceof BadRequestException) {
        LoggerHelper.warn(error.message, "OrderService.updateStatus");
        throw error;
      }

      LoggerHelper.error(
        `Failed to update order status (id=${id}, nextStatus=${nextStatus}, updatedBy=${updatedBy})`,
        error,
        "OrderService.updateStatus"
      );

      throw new InternalServerErrorException("Unable to update order status");
    }
  }

  async cancel(id: string): Promise<OrderEntity> {
    try {
      const order = await this.findById(id);

      if (!order) {
        throw new BadRequestException(`Order ${id} not found`);
      }

      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException("Only PENDING orders can be cancelled");
      }

      order.status = OrderStatus.CANCELLED;
      order.updatedAt = new Date();

      const savedOrder = await this.orderRepo.save(order);

      LoggerHelper.log(
        `Order ${id} cancelled successfully`,
        "OrderService.cancel"
      );

      return savedOrder;
    } catch (error) {
      if (error instanceof BadRequestException) {
        LoggerHelper.warn(error.message, "OrderService.cancel");
        throw error;
      }

      LoggerHelper.error(
        `Failed to cancel order (id=${id})`,
        error,
        "OrderService.cancel"
      );

      throw new InternalServerErrorException("Unable to cancel order");
    }
  }

  @Interval(Number(process.env.JOB_INTERVAL_MS || 500_000))
  async promotePending(): Promise<void> {
    try {
      LoggerHelper.log(
        "promotePending job started",
        "OrderJobs.promotePending"
      );

      const pending = await this.orderRepo.find({
        where: { status: OrderStatus.PENDING },
      });

      if (!pending.length) {
        LoggerHelper.log("No pending orders found", "OrderJobs.promotePending");
        return;
      }

      const now = new Date();

      for (const order of pending) {
        order.status = OrderStatus.PROCESSING;
        order.updatedAt = now;
      }

      await this.orderRepo.save(pending);

      LoggerHelper.log(
        `Promoted ${pending.length} orders to PROCESSING`,
        "OrderJobs.promotePending"
      );
    } catch (error) {
      LoggerHelper.error(
        "Failed during promotePending job",
        error,
        "OrderJobs.promotePending"
      );
    }
  }
}
