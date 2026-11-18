from odoo import fields, models


class ResConfigSettings(models.TransientModel):
    _inherit = "res.config.settings"

    pos_show_stock_in_pos = fields.Boolean(
        related="pos_config_id.show_stock_in_pos", readonly=False
    )
    pos_block_sale_without_stock = fields.Boolean(
        related="pos_config_id.block_sale_without_stock", readonly=False
    )
