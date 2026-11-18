from odoo import models


class PosSession(models.Model):
    _inherit = "pos.session"

    def _loader_params_product_product(self):
        params = super()._loader_params_product_product()
        params["search_params"]["fields"] += ["qty_available", "detailed_type"]
        # qty_available se calcula solo para el almacén de este POS
        params["context"] = {**params.get("context", {}), **self.config_id._stock_context()}
        return params

    def _process_pos_ui_product_product(self, products):
        super()._process_pos_ui_product_product(products)
        # Descontar lo vendido en sesiones abiertas aún sin movimiento de stock
        ids = [p["id"] for p in products if p.get("detailed_type") == "product"]
        if ids:
            pending = self.config_id._pos_pending_qty(ids)
            for p in products:
                if p["id"] in pending:
                    p["qty_available"] = (p.get("qty_available") or 0.0) - pending[p["id"]]
