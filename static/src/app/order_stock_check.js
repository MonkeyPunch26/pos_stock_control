/** @odoo-module */
import { _t } from "@web/core/l10n/translation";
import { patch } from "@web/core/utils/patch";
import { Order } from "@point_of_sale/app/store/models";
import { PaymentScreen } from "@point_of_sale/app/screens/payment_screen/payment_screen";
import { ErrorPopup } from "@point_of_sale/app/errors/popups/error_popup";
import { ProductScreen } from "@point_of_sale/app/screens/product_screen/product_screen";
import { parseFloat as parseLocalFloat } from "@web/views/fields/parsers";
import { stockState, isStockTracked, getKnownStock } from "./stock_state";

/** Cantidad neta por producto (almacenable) en el pedido. */
function netQuantities(order) {
    const totals = new Map();
    for (const line of order.get_orderlines()) {
        if (!isStockTracked(line.product)) {
            continue;
        }
        const prev = totals.get(line.product.id) || { product: line.product, qty: 0 };
        prev.qty += line.get_quantity();
        totals.set(line.product.id, prev);
    }
    return totals;
}

// 1) Al agregar un producto (clic o lector de código de barras).
patch(Order.prototype, {
    async add_product(product, options) {
        const config = this.pos.config;
        const qty = options && options.quantity ? options.quantity : 1;
        if (
            config.block_sale_without_stock &&
            isStockTracked(product) &&
            qty > 0 &&
            !this._printed &&
            !this._isRefundOrder()
        ) {
            const inOrder = this.get_orderlines()
                .filter((l) => l.product.id === product.id)
                .reduce((sum, l) => sum + l.get_quantity(), 0);
            const available = getKnownStock(product);
            if (inOrder + qty > available) {
                this.pos.env.services.popup.add(ErrorPopup, {
                    title: _t("Sin stock suficiente"),
                    body: _t(
                        "%(name)s: disponible %(avail)s, en este pedido ya hay %(inOrder)s.",
                        { name: product.display_name, avail: available, inOrder }
                    ),
                });
                return;
            }
        }
        return super.add_product(...arguments);
    },
});

// 2) Al validar el pago: revisión final contra el servidor + actualizar stock mostrado.
patch(PaymentScreen.prototype, {
    async validateOrder(isForceValidate) {
        const order = this.currentOrder;
        const config = this.pos.config;
        const totals = netQuantities(order);

        if (config.block_sale_without_stock && !order._isRefundOrder() && totals.size) {
            let live = null;
            try {
                live = await this.orm.call("pos.config", "get_stock_for_products", [
                    [config.id],
                    [...totals.keys()],
                ]);
            } catch (e) {
                // Sin conexión con el servidor: nos quedamos con la revisión local ya hecha.
                live = null;
            }
            if (live) {
                const problems = [];
                for (const [id, { product, qty }] of totals) {
                    const available = live[id] ?? 0;
                    stockState.overrides[id] = available;
                    if (qty > 0 && qty > available) {
                        problems.push(
                            `${product.display_name}: pedido ${qty}, disponible ${available}`
                        );
                    }
                }
                if (problems.length) {
                    this.popup.add(ErrorPopup, {
                        title: _t("Sin stock suficiente"),
                        body: problems.join(" | "),
                    });
                    return;
                }
            }
        }

        await super.validateOrder(...arguments);

        // Si el pedido quedó finalizado, bajamos el stock mostrado de inmediato.
        // (El valor del servidor leído arriba es previo a esta venta: el servidor ya
        //  descuenta pedidos pendientes de sesiones abiertas, así que restar aquí es correcto.)
        if (order.finalized) {
            for (const [id, { product, qty }] of totals) {
                stockState.overrides[id] = getKnownStock(product) - qty;
            }
        }
    },
});

// 3) Al cambiar la cantidad con el teclado numérico (no pasa por add_product).
patch(ProductScreen.prototype, {
    _setValue(val) {
        const order = this.currentOrder;
        const line = order && order.get_selected_orderline();
        if (
            this.pos.config.block_sale_without_stock &&
            this.pos.numpadMode === "quantity" &&
            val !== "remove" &&
            line &&
            !line.comboParent &&
            isStockTracked(line.product) &&
            !order._isRefundOrder()
        ) {
            let newQty;
            try {
                newQty = typeof val === "number" ? val : parseLocalFloat("" + (val || 0));
            } catch {
                newQty = NaN;
            }
            if (newQty > 0) {
                const others = order
                    .get_orderlines()
                    .filter((l) => l !== line && l.product.id === line.product.id)
                    .reduce((sum, l) => sum + l.get_quantity(), 0);
                const available = getKnownStock(line.product);
                if (others + newQty > available) {
                    this.popup.add(ErrorPopup, {
                        title: _t("Sin stock suficiente"),
                        body: _t("%(name)s: disponible %(avail)s.", {
                            name: line.product.display_name,
                            avail: available,
                        }),
                    });
                    this.numberBuffer.reset();
                    return;
                }
            }
        }
        return super._setValue(...arguments);
    },
});
