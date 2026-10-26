# Runbook: Data Pipeline Failure

## Detection
Check the Airflow UI — if any DAG is red, this runbook applies.
Also watch for stale data in the dashboard.

## Triage
1. Look at the failed task in the Airflow UI
2. Check the task logs for error messages
3. Common fixes: re-run the task, clear and retry, check DB connectivity

## Escalation
Page the on-call engineer if it is critical.

## Postmortem
Write a summary of what happened.
