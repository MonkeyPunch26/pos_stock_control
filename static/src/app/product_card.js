/** @odoo-module */
import { ProductCard } from "@point_of_sale/app/generic_components/product_card/product_card";

// Nueva prop opcional: cantidad a mostrar como insignia.
ProductCard.props = {
    ...ProductCard.props,
    stock: { type: Number, optional: true },
};
