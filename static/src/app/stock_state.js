/** @odoo-module */
import { reactive } from "@odoo/owl";

// Stock "vivo" por producto (se actualiza al vender y al validar contra el servidor).
export const stockState = reactive({ overrides: {} });

export function isStockTracked(product) {
    return Boolean(product) && product.detailed_type === "product";
}

/**
 * @param state pasar el proxy de useState(stockState) cuando se llama desde un
 *              template, para que el componente se suscriba y se repinte.
 */
export function getKnownStock(product, state = stockState) {
    const live = state.overrides[product.id];
    return live !== undefined ? live : product.qty_available || 0;
}
