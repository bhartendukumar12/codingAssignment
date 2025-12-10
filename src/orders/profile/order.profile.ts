import {
  createMap,
  forMember,
  mapFrom,
  Mapper,
} from "@automapper/core";
import { AutomapperProfile, InjectMapper } from "@automapper/nestjs";
import { Injectable } from "@nestjs/common";

import { OrderEntity } from "../entities/order.entity";
import { OrderItemEntity } from "../entities/order-item.entity";
import { OrderDto, OrderItemDto } from "../dto/response-order.dto";

@Injectable()
export class OrderProfile extends AutomapperProfile {
  constructor(@InjectMapper() mapper: Mapper) {
    super(mapper);
  }

  override get profile() {
    return (mapper: Mapper) => {
      createMap<OrderItemEntity, OrderItemDto>(mapper, OrderItemEntity, OrderItemDto);

      createMap<OrderEntity, OrderDto>(
        mapper,
        OrderEntity,
        OrderDto,
        forMember(
          (dest) => dest.status,
          mapFrom((src) => src.status)
        )
      );
    };
  }
}
