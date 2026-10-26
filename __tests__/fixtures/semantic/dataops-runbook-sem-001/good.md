# Runbook: Data Pipeline Failure

## 1. Detection

The following alerts indicate this incident:
- `DataPipelineStale` — last successful run > 30 min ago
- `AirflowTaskFailed` — any `ingest.*` DAG task in `failed` state
- `DLQDepthCritical` — `kafka.dead_letter.queue_depth > 1000`

## 2. Triage

1. Check current DAG state:

       airflow dags list-runs -d ingest_events --state failed --limit 5

2. Identify the failing task:

       airflow tasks states-for-dag-run ingest_events <run_id>

3. Inspect the task log:

       airflow tasks logs ingest_events <task_id> <run_id>

4. If `kafka.dead_letter.queue_depth > 1000`:
   - Pause the DAG: `airflow dags pause ingest_events`
   - Capture DLQ sample:

         kafka-console-consumer --topic dead_letter --max-messages 10 > /tmp/dlq.json

## 3. Escalation

| Trigger | Contact | Method | Response SLA |
|---------|---------|--------|--------------|
| Failure > 15 min | Data Platform on-call | PagerDuty `data-platform` | 5 min |
| Data loss suspected | Data Eng Lead | Page + #data-incidents | 15 min |
| Downstream consumers affected | Notify #analytics-users | Slack broadcast | 10 min |

## 4. Postmortem Template

Every incident > 15 min requires a postmortem with:
- **Timeline** — UTC timestamps of detection, triage, mitigation, resolution
- **Root cause** — the specific failure mode
- **Impact** — data affected, consumers affected, duration
- **Action items** — owner + due date
- **Lessons** — what we would do differently

## 5. Runbook-Specific Commands

All commands assume `AWS_PROFILE=data-prod` and `kubectl -n airflow`.

- Rollback a bad deploy: `kubectl -n airflow rollout undo deploy/airflow-scheduler`
- Force a retry: `airflow tasks clear --only-failed ingest_events`
- Backfill: `airflow dags backfill ingest_events -s <date> -e <date>`
