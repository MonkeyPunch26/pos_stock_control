{
    "name": "POS: stock visible y bloqueo de venta sin stock",
    "summary": "Muestra el stock disponible en el punto de venta y, opcionalmente, "
               "impide vender más unidades de las que hay.",
    "version": "17.0.1.0.0",
    "category": "Point of Sale",
    "author": "Dros",
    "license": "LGPL-3",
    "depends": ["point_of_sale", "stock"],
    "data": [
        "views/res_config_settings_views.xml",
    ],
    "assets": {
        "point_of_sale._assets_pos": [
            "pos_stock_control/static/src/app/stock_state.js",
            "pos_stock_control/static/src/app/product_card.js",
            "pos_stock_control/static/src/app/product_card.xml",
            "pos_stock_control/static/src/app/product_list.js",
            "pos_stock_control/static/src/app/product_list.xml",
            "pos_stock_control/static/src/app/order_stock_check.js",
        ],
    },
    "installable": True,
    "application": False,
}
