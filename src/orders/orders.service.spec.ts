import { Test, TestingModule } from "@nestjs/testing";
import {
  BadRequestException,
  InternalServerErrorException,
} from "@nestjs/common";
import { getRepositoryToken } from "@nestjs/typeorm";
import { getMapperToken } from "@automapper/nestjs";
import { DataSource, QueryRunner, Repository } from "typeorm";

import { OrdersService } from "./orders.service";
import { OrderEntity } from "./entities/order.entity";
import { OrderItemEntity } from "./entities/order-item.entity";
import { OrderStatus } from "./enums/order-status.enum";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderDto } from "./dto/response-order.dto";

jest.mock("../common/utils", () => ({
  computeTotal: jest.fn().mockReturnValue(75000),
}));

jest.mock("../common/logger", () => ({
  LoggerHelper: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe("OrdersService.create", () => {
  let service: OrdersService;

  let orderRepo: jest.Mocked<Repository<OrderEntity>>;
  let dataSource: DataSource;
  let queryRunner: QueryRunner;
  let itemRepo: { save: jest.Mock };

  beforeEach(async () => {
    orderRepo = {
      save: jest.fn(),
    } as any;

    itemRepo = {
      save: jest.fn(),
    };

    const manager: any = {
      getRepository: jest.fn((entity: any) => {
        if (entity === OrderEntity) return orderRepo;
        if (entity === OrderItemEntity) return itemRepo;
        return {};
      }),
    };

    // QueryRunner mock
    queryRunner = {
      manager,
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
    } as any;

    // DataSource mock
    dataSource = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunner),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(OrderEntity), useValue: orderRepo },
        { provide: DataSource, useValue: dataSource },
        { provide: getMapperToken(), useValue: {} },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create order and items successfully", async () => {
    const dto: CreateOrderDto = {
      customer: {
        name: "Bharat",
        email: "bharat@test.com",
      },
      items: [
        { productId: "P1", name: "Laptop", quantity: 1, price: "75000" },
      ],
    } as any;

    const savedOrder: Partial<OrderEntity> = {
      id: "123",
      customerName: dto.customer.name,
      customerEmail: dto.customer.email,
      status: OrderStatus.PENDING,
      total: "75000.00",
      createdBy: dto.customer.email,
    };

    orderRepo.save.mockResolvedValue(savedOrder as OrderEntity);

    const expectedDto: OrderDto = {
      id: "123",
      customerName: dto.customer.name,
      customerEmail: dto.customer.email,
      status: OrderStatus.PENDING,
      total: "75000.00",
      items: [],
      createdBy: dto.customer.email,
      updatedBy: null as any,
      createdAt: undefined as any,
      updatedAt: undefined as any,
    };
    const findByIdSpy = jest
      .spyOn(service, "findById")
      .mockResolvedValue(expectedDto);

    const result = await service.create(dto);

    expect((dataSource as any).createQueryRunner).toHaveBeenCalled();
    expect(queryRunner.connect as jest.Mock).toHaveBeenCalled();
    expect(queryRunner.startTransaction as jest.Mock).toHaveBeenCalled();
    expect(queryRunner.commitTransaction as jest.Mock).toHaveBeenCalled();
    expect(queryRunner.release as jest.Mock).toHaveBeenCalled();

    expect(orderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: "Bharat",
        customerEmail: "bharat@test.com",
        createdBy: "bharat@test.com",
        status: OrderStatus.PENDING,
        total: "75000.00",
      })
    );

    expect(itemRepo.save).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          productId: "P1",
          name: "Laptop",
          quantity: 1,
          price: "75000.00",
          order: savedOrder,
        }),
      ])
    );

    expect(findByIdSpy).toHaveBeenCalledWith("123");
    expect(result).toEqual(expectedDto);
  });

  it("should throw BadRequestException if customer name/email is missing", async () => {
    const dto: CreateOrderDto = {
      customer: {
        name: "",
        email: "",
      },
      items: [],
    } as any;

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException
    );

    expect(queryRunner.rollbackTransaction as jest.Mock).toHaveBeenCalled();
    expect(queryRunner.release as jest.Mock).toHaveBeenCalled();
    expect(orderRepo.save).not.toHaveBeenCalled();
    expect(itemRepo.save).not.toHaveBeenCalled();
  });

  it("should throw BadRequestException if item validation fails", async () => {
    const dto: CreateOrderDto = {
      customer: {
        name: "Bharat",
        email: "bharat@test.com",
      },
      items: [
        { productId: "", name: "Laptop", quantity: 0, price: "abc" },
      ],
    } as any;

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      BadRequestException
    );

    expect(queryRunner.rollbackTransaction as jest.Mock).toHaveBeenCalled();
    expect(queryRunner.release as jest.Mock).toHaveBeenCalled();
    expect(orderRepo.save).not.toHaveBeenCalled();
    expect(itemRepo.save).not.toHaveBeenCalled();
  });

  it("should rollback and throw InternalServerErrorException on unknown error", async () => {
    const dto: CreateOrderDto = {
      customer: {
        name: "Bharat",
        email: "bharat@test.com",
      },
      items: [
        { productId: "P1", name: "Laptop", quantity: 1, price: "100" },
      ],
    } as any;

    orderRepo.save.mockRejectedValue(new Error("DB down"));

    await expect(service.create(dto)).rejects.toBeInstanceOf(
      InternalServerErrorException
    );

    expect(queryRunner.rollbackTransaction as jest.Mock).toHaveBeenCalled();
    expect(queryRunner.release as jest.Mock).toHaveBeenCalled();
  });
});
