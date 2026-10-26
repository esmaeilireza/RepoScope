# Runbook: Data Pipeline Failure

If the pipeline fails, check the logs first. Common issues include network
problems, database timeouts, or schema changes.

Try restarting the service. If that doesn't work, look at the Airflow UI
to see which task failed.

You can also try re-running the DAG. Sometimes transient errors fix
themselves.

If the problem persists, reach out to the team.
