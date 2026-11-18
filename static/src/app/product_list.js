/** @odoo-module */
import { patch } from "@web/core/utils/patch";
import { useState } from "@odoo/owl";
import { ProductsWidget } from "@point_of_sale/app/screens/product_screen/product_list/product_list";
import { stockState, isStockTracked, getKnownStock } from "./stock_state";

patch(ProductsWidget.prototype, {
    setup() {
        super.setup(...arguments);
        // Proxy suscrito: leer a través de él hace que la lista se repinte al cambiar el stock
        this.stockState = useState(stockState);
    },
    getStock(product) {
        if (!this.pos.config.show_stock_in_pos || !isStockTracked(product)) {
            return undefined;
        }
        return getKnownStock(product, this.stockState);
    },
});
