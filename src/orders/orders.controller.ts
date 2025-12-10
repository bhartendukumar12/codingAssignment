import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrderStatus } from "./enums/order-status.enum";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { UpdateStatusDto } from "./dto/update-status.dto";

@ApiTags("orders")
@Controller("orders")
export class OrdersController {
  constructor(private readonly svc: OrdersService) {}

  // Create order
  @Post()
  @ApiOperation({ summary: "Create an order" })
  @ApiResponse({ status: 201, description: "Order created" })
  @ApiBody({ type: CreateOrderDto })
  async create(@Body() dto: CreateOrderDto) {
    return await this.svc.create(dto);
  }

  // Get order by id
  @Get(":id")
  @ApiOperation({ summary: "Get order by id" })
  @ApiParam({ name: "id", required: true })
  @ApiResponse({ status: 200, description: "Order returned" })
  async get(@Param("id") id: string) {
    return await this.svc.findById(id);
  }

  // List orders
  @Get()
  @ApiOperation({ summary: "List orders (optional status filter, paginated)" })
  @ApiQuery({ name: "status", required: false, enum: OrderStatus })
  @ApiQuery({ name: "page", required: false, type: Number, example: 1 })
  @ApiQuery({ name: "limit", required: false, type: Number, example: 10 })
  async list(
    @Query("status") status?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query("limit", new DefaultValuePipe(10), ParseIntPipe) limit = 10
  ) {
    const parsedStatus = status
      ? (OrderStatus as any)[status as keyof typeof OrderStatus]
      : undefined;

    return this.svc.findAll(parsedStatus, page, limit);
  }

  // Update order status
  @Patch(":id/status")
  @ApiOperation({ summary: "Update order status" })
  @ApiParam({ name: "id" })
  @ApiBody({ type: UpdateStatusDto })
  async updateStatus(@Param("id") id: string, @Body() body: UpdateStatusDto) {
    if (!body || !body.status) {
      throw new Error("status required in body");
    }
    return await this.svc.updateStatus(id, body.status, body.updatedBy);
  }

  // Cancel order
  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel order (only when PENDING)" })
  @ApiParam({ name: "id" })
  async cancel(@Param("id") id: string) {
    return await this.svc.cancel(id);
  }
}
