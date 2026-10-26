select
  o.order_sk,
  o.customer_id,
  o.product_sk,
  o.quantity,
  o.amount,
  c.customer_name
from stg_orders o
left join dim_customers c
  on o.customer_id = c.customer_id
