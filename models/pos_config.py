from odoo import fields, models


class PosConfig(models.Model):
    _inherit = "pos.config"

    show_stock_in_pos = fields.Boolean(
        string="Mostrar stock en el POS",
        default=True,
        help="Muestra la cantidad disponible sobre cada producto en la pantalla de venta.",
    )
    block_sale_without_stock = fields.Boolean(
        string="Bloquear venta sin stock",
        default=False,
        help="Impide agregar al pedido más unidades de las disponibles en el almacén del POS "
             "(solo productos almacenables). Las devoluciones no se bloquean.",
    )

    def _stock_warehouse(self):
        self.ensure_one()
        return self.picking_type_id.warehouse_id

    def _stock_context(self):
        """Contexto para que qty_available se calcule solo sobre el almacén de este POS."""
        warehouse = self._stock_warehouse()
        return {"warehouse": warehouse.id} if warehouse else {}

    def _pos_pending_qty(self, product_ids):
        """Unidades vendidas en sesiones abiertas que todavía no generan movimiento de stock.

        Con el modo por defecto de Odoo 17 ("al cierre de sesión") los pedidos pagados no
        descuentan inventario hasta cerrar la caja; sin esto el stock mostrado estaría inflado.
        En modo "tiempo real" cada pedido ya tiene su picking y esto devuelve ~0.
        """
        self.ensure_one()
        warehouse = self._stock_warehouse()
        if not product_ids or not warehouse:
            return {}
        groups = self.env["pos.order.line"].sudo()._read_group(
            [
                ("product_id", "in", list(product_ids)),
                ("order_id.session_id.state", "!=", "closed"),
                ("order_id.session_id.config_id.picking_type_id.warehouse_id", "=", warehouse.id),
                ("order_id.state", "in", ("paid", "done", "invoiced")),
                ("order_id.picking_ids", "=", False),
            ],
            groupby=["product_id"],
            aggregates=["qty:sum"],
        )
        return {product.id: qty for product, qty in groups}

    def _available_qty(self, products):
        """Stock del almacén del POS menos lo vendido aún no descontado."""
        self.ensure_one()
        products = products.with_context(**self._stock_context())
        pending = self._pos_pending_qty(products.ids)
        return {p.id: p.qty_available - pending.get(p.id, 0.0) for p in products}

    def get_stock_for_products(self, product_ids):
        """Stock actual (leído en vivo) de los productos pedidos. Lo usa el POS al validar."""
        self.ensure_one()
        products = self.env["product.product"].browse(product_ids).exists()
        return self._available_qty(products)
