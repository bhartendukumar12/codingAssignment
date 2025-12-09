import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ItemDto {
    @ApiProperty({ example: 'productId-1' })
    @IsString()
    @IsNotEmpty()
    productId: string;

    @ApiProperty({ example: 'Laptop', required: false })
    @IsString()
    name?: string;

    @ApiProperty({ example: 1 })
    @IsNumber()
    @IsPositive()
    quantity: number;

    @ApiProperty({ example: 75000 })
    @IsNumber()
    price: number;
}
