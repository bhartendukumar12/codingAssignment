import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateStatusDto {
    @ApiProperty({ enum: OrderStatus, example: OrderStatus.SHIPPED })
    @IsEnum(OrderStatus)
    status: OrderStatus;
}
