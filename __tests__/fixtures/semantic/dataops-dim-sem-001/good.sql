-- Grain: one row per order line item
with orders as (
  select
    order_sk,
    customer_sk,
    product_sk,
    order_date_sk,
    quantity,
    unit_price,
    line_amount
  from {{ ref('stg_orders') }}
),
customers as (
  select customer_sk, customer_name
  from {{ ref('dim_customers') }}
)
select
  o.order_sk,
  o.customer_sk,
  o.product_sk,
  o.order_date_sk,
  o.quantity,
  o.unit_price,
  o.line_amount,
  c.customer_name
from orders o
left join customers c
  on o.customer_sk = c.customer_sk
