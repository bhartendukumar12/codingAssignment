import {
  BadRequestException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { OrderEntity } from './entities/order.entity';
import { OrderItemEntity } from './entities/order-item.entity';
import { OrderStatus } from './enums/order-status.enum';
import { CreateOrderDto } from './dto/create-order.dto';
import { computeTotal } from '../common/utils';

// Mock external helpers
jest.mock('../common/utils', () => ({
  computeTotal: jest.fn(),
}));

jest.mock('../common/logger', () => ({
  LoggerHelper: {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('OrdersService', () => {
  let service: OrdersService;

  // Mocks
  let orderRepoMock: any;
  let orderItemRepoMock: any;
  let dataSourceMock: any;
  let queryRunnerMock: any;

  beforeEach(() => {
    orderRepoMock = {
      createQueryBuilder: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
    };

    orderItemRepoMock = {
      save: jest.fn(),
    };

    queryRunnerMock = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: {
        getRepository: jest.fn(),
      },
    };

    dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
    } as unknown as DataSource;

    service = new OrdersService(
      orderRepoMock,
      orderItemRepoMock,
      dataSourceMock,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // test create
  describe('create', () => {
    it('should create order and items successfully', async () => {
      const dto: CreateOrderDto = {
        customer: {
          name: 'Bharat',
          email: 'bharat@gmail.com',
        },
        items: [
          { productId: 'p1', name: 'Prod 1', quantity: 2, price: '10.50' },
          { productId: 'p2', name: 'Prod 2', quantity: 1, price: '5.00' },
        ],
      } as any;

      const orderRepoInTx = {
        save: jest.fn().mockResolvedValue({ id: '1' }),
      };
      const itemRepoInTx = {
        save: jest.fn().mockResolvedValue(undefined),
      };

      queryRunnerMock.manager.getRepository.mockImplementation((entity) => {
        if (entity === OrderEntity) return orderRepoInTx;
        if (entity === OrderItemEntity) return itemRepoInTx;
        return null;
      });

      (computeTotal as jest.Mock).mockReturnValue(26.0);

      const finalOrder = {
        id: '1',
        status: OrderStatus.PENDING,
      } as OrderEntity;

      const findByIdSpy = jest
        .spyOn(service, 'findById')
        .mockResolvedValue(finalOrder);

      const result = await service.create(dto);

      expect(dataSourceMock.createQueryRunner).toHaveBeenCalled();
      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();

      expect(orderRepoInTx.save).toHaveBeenCalledWith(
        expect.objectContaining({
          customerName: 'Bharat',
          customerEmail: 'bharat@gmail.com',
          status: OrderStatus.PENDING,
          total: '26.00',
        }),
      );

      expect(itemRepoInTx.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            productId: 'p1',
            quantity: 2,
            price: '10.50',
          }),
          expect.objectContaining({
            productId: 'p2',
            quantity: 1,
            price: '5.00',
          }),
        ]),
      );

      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
      expect(findByIdSpy).toHaveBeenCalledWith('1');
      expect(result).toBe(finalOrder);
    });

    it('should throw BadRequestException when customer data is invalid', async () => {
      const dto: CreateOrderDto = {
        customer: {
          name: '',
          email: '',
        },
        items: [],
      } as any;

      await expect(service.create(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });
  });

});
