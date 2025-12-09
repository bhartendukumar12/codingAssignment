export const nowIso = (): string => new Date().toISOString();

export const computeTotal = (items: { quantity?: number; price?: number | string }[] = []) => {
    return items.reduce((s, it) => {
        const q = Number(it.quantity) || 0;
        const p = Number(it.price) || 0;
        return s + q * p;
    }, 0);
};
