import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './enums/order-status.enum';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
    constructor(private readonly svc: OrdersService) { }

    @Post()
    @ApiOperation({ summary: 'Create an order' })
    @ApiResponse({ status: 201, description: 'Order created' })
    @ApiBody({ type: CreateOrderDto })
    async create(@Body() dto: CreateOrderDto) {
        return await this.svc.create(dto);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order by id' })
    @ApiParam({ name: 'id', required: true })
    @ApiResponse({ status: 200, description: 'Order returned' })
    async get(@Param('id') id: string) {
        return await this.svc.findById(id);
    }

    @Get()
    @ApiOperation({ summary: 'List orders (optional status filter)' })
    @ApiQuery({ name: 'status', required: false, enum: OrderStatus })
    async list(@Query('status') status?: string) {
        const parsed = status ? (OrderStatus as any)[status as keyof typeof OrderStatus] : undefined;
        return await this.svc.findAll(parsed);
    }

    @Patch(':id/status')
    @ApiOperation({ summary: 'Update order status' })
    @ApiParam({ name: 'id' })
    @ApiBody({ type: UpdateStatusDto })
    async updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
        if (!body || !body.status) {
            throw new Error('status required in body');
        }
        return await this.svc.updateStatus(id, body.status);
    }

    @Post(':id/cancel')
    @ApiOperation({ summary: 'Cancel order (only when PENDING)' })
    @ApiParam({ name: 'id' })
    async cancel(@Param('id') id: string) {
        return await this.svc.cancel(id);
    }
}
