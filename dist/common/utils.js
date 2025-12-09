"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeTotal = exports.nowIso = void 0;
const nowIso = () => new Date().toISOString();
exports.nowIso = nowIso;
const computeTotal = (items = []) => {
    return items.reduce((s, it) => {
        const q = Number(it.quantity) || 0;
        const p = Number(it.price) || 0;
        return s + q * p;
    }, 0);
};
exports.computeTotal = computeTotal;
//# sourceMappingURL=utils.js.map