import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { OrderStatus } from '../enums/order-status.enum';

export class UpdateStatusDto {
    @ApiProperty({ enum: OrderStatus, example: OrderStatus.SHIPPED })
    @IsEnum(OrderStatus)
    status: OrderStatus;

    @ApiProperty({ example: "bharat.test@gmail.com", required: true })
     @IsString()
    updatedBy: string;
}
