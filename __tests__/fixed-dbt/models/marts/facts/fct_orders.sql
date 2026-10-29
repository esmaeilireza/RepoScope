-- tests/fixtures/broken-dbt/models/marts/facts/fct_orders.sql

select
  o.order_id,
  c.customer_id,
  o.order_date
from {{ ref('stg_orders') }} as o
join {{ ref('stg_customers') }} as c
  on o.customer_id = c.customer_id