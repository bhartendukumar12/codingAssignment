import { IsArray, IsEmail, IsNotEmpty, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ItemDto } from './item.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CustomerDto {
    @ApiProperty({ example: 'Bharat' })
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'bharat@test.com' })
    @IsEmail()
    email: string;
}

export class CreateOrderDto {
    @ApiProperty({ type: CustomerDto })
    @IsNotEmpty()
    @Type(() => CustomerDto)
    customer: CustomerDto;

    @ApiProperty({ type: [ItemDto] })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => ItemDto)
    items: ItemDto[];
}
