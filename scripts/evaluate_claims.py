# Pseudo-code — this is where buildGroundedPrompt fits naturally
system, prompt = build_grounded_prompt(
    findings=[
        {"id": "dataops-kleppmann-002", "title": "...", "detail": "..."}
    ],
    profile="dataops",
    extra_context=[
        "CLAIM TO EVALUATE: 'RepoScope checks backward/forward schema compatibility.'",
        "YAML RULE: <full YAML for dataops-kleppmann-002>",
        "TS IMPLEMENTATION: <relevant snippet from lib/dataops-audit.ts>",
    ]
)