SELECT
  o.order_id,
  c.customer_id,
  o.amount
FROM orders o
JOIN customers c ON c.customer_id = o.customer_id