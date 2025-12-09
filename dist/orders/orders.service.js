"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const order_status_enum_1 = require("./enums/order-status.enum");
const utils_1 = require("../common/utils");
const schedule_1 = require("@nestjs/schedule");
let OrdersService = class OrdersService {
    orders = new Map();
    create(dto) {
        if (!dto.customer || !dto.customer.name || !dto.customer.email) {
            throw new common_1.BadRequestException('customer name and customer email required');
        }
        dto.items.forEach((it, idx) => {
            if (!it.productId)
                throw new common_1.BadRequestException(`items[${idx}].productId required`);
            if (!it.quantity || Number(it.quantity) <= 0)
                throw new common_1.BadRequestException(`items[${idx}].quantity must be > 0`);
            if (it.price == null || isNaN(Number(it.price)))
                throw new common_1.BadRequestException(`items[${idx}].price must be numeric`);
        });
        const id = (0, uuid_1.v4)();
        const total = (0, utils_1.computeTotal)(dto.items);
        const now = (0, utils_1.nowIso)();
        const order = {
            id,
            customer: { name: dto.customer.name, email: dto.customer.email },
            items: dto.items,
            status: order_status_enum_1.OrderStatus.PENDING,
            total,
            createdAt: now,
            updatedAt: now,
        };
        this.orders.set(id, order);
        return order;
    }
    findById(id) {
        const o = this.orders.get(id);
        if (!o)
            throw new common_1.NotFoundException('Order not found');
        return o;
    }
    findAll(status) {
        const all = Array.from(this.orders.values());
        return status ? all.filter((o) => o.status === status) : all;
    }
    updateStatus(id, nextStatus) {
        const order = this.findById(id);
        const valid = Object.values(order_status_enum_1.OrderStatus);
        if (!valid.includes(nextStatus))
            throw new common_1.BadRequestException('Invalid status');
        if ([order_status_enum_1.OrderStatus.CANCELLED, order_status_enum_1.OrderStatus.DELIVERED].includes(order.status)) {
            throw new common_1.BadRequestException(`Cannot change status from ${order.status}`);
        }
        order.status = nextStatus;
        order.updatedAt = (0, utils_1.nowIso)();
        this.orders.set(id, order);
        return order;
    }
    cancel(id) {
        const order = this.findById(id);
        if (order.status !== order_status_enum_1.OrderStatus.PENDING) {
            throw new common_1.BadRequestException('Only PENDING orders can be cancelled');
        }
        order.status = order_status_enum_1.OrderStatus.CANCELLED;
        order.updatedAt = (0, utils_1.nowIso)();
        this.orders.set(id, order);
        return order;
    }
    promotePending() {
        const now = (0, utils_1.nowIso)();
        for (const [id, order] of this.orders.entries()) {
            if (order.status === order_status_enum_1.OrderStatus.PENDING) {
                order.status = order_status_enum_1.OrderStatus.PROCESSING;
                order.updatedAt = now;
                this.orders.set(id, order);
                console.log(`[bg-job] promoted order ${id} to PROCESSING at ${now}`);
            }
        }
    }
};
exports.OrdersService = OrdersService;
__decorate([
    (0, schedule_1.Interval)(Number(process.env.JOB_INTERVAL_MS || 300000)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OrdersService.prototype, "promotePending", null);
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)()
], OrdersService);
//# sourceMappingURL=orders.service.js.map