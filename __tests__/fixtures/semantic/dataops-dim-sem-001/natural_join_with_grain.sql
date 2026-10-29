-- Grain: one row per order line item
select o.order_sk, o.customer_id, o.line_amount, c.customer_name
from stg_orders o
left join dim_customers c on o.customer_id = c.customer_id
