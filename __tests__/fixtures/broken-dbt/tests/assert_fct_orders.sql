-- tests/fixtures/broken-dbt/tests/assert_fct_orders.sql

select count(*)
from {{ ref('fct_orders') }}
where order_id is null
having count(*) > 0