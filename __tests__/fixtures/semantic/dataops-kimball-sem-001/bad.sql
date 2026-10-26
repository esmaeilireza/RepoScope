select
  o.order_id,
  o.customer_id,
  o.product_id,
  o.quantity,
  o.amount / o.quantity as avg_price,
  c.customer_name
from stg_orders o
left join dim_customers c
  on o.customer_id = c.customer_id
