import { Test, TestingModule } from "@nestjs/testing";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";

describe("OrdersController", () => {
  let controller: OrdersController;
  let serviceMock: {
    create: jest.Mock;
  };

  beforeEach(async () => {
    serviceMock = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: serviceMock,
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
  });

  // CREATE ORDER
  it("should call service.create with DTO", async () => {
    const dto: CreateOrderDto = {
      customer: { name: "bharat", email: "bharat@gmail.com" },
      items: [{ productId: "1", quantity: 2, price: 100 }],
    };

    const fakeResponse = { id: "10", ...dto };
    serviceMock.create.mockResolvedValue(fakeResponse);

    const result = await controller.create(dto);

    expect(serviceMock.create).toHaveBeenCalledWith(dto);
    expect(result).toBe(fakeResponse);
  });
});
