# Attribution

RepoScope's Graph RAG rules are derived heuristics, not reproductions of
copyrighted text. Where a rule is grounded in a book or standard, RepoScope
stores only:

- the source title;
- the author or standards body;
- the concept name;
- a short paraphrased rationale;
- chapter/section/page only when verified.

Example:

- Rule: `graph-003`
- Grounded in: *Designing Data-Intensive Applications*.
- Concept: schema evolution.
- Note: derived operational heuristic only. No verbatim text reproduced.

## Theoretical Foundation for DevOps Pipelines

While the rules above are derived from industry literature, the architectural
vision for extending RepoScope into *generating* compliant CI/CD pipelines is
grounded in recent academic research on Model-Driven Engineering (MDE).

Specifically, the conceptual framework for transforming software architecture
models (e.g., UML) into DevOps pipelines informs the long-term roadmap of
RepoScope. The current implementation focuses on auditing existing repositories;
the theoretical model below lays the groundwork for a future feature where
RepoScope generates pipeline configurations directly from architectural
compliance rules.

- Paper: *From software architecture models to pipelines: a conceptual framework for model transformation in DevOps*
- Authors: Uldis Karlovs-Karlovskis, Oksana Nikiforova, Oscar Pastor, Anita Jansone, Kristijans Veveris
- Journal: Frontiers in Computer Science, Vol. 7, 2025.
- DOI: 10.3389/fcomp.2025.1714197
- License: Creative Commons Attribution License (CC BY).
- Note: Used as a theoretical foundation for future MDE pipeline generation; no source code from the paper is used in the current RepoScope audit engine.