# Personal Memory System

The Personal Memory System is the long-term intelligence layer. It converts useful observations into
governed memory and retrieves only relevant context for prompts, agents, workflows, commands, ranking,
and personalization.

## Memory Types

- `working`: temporary current task, page, workflow, or context.
- `short-term`: recent session actions and conversation context.
- `episodic`: past events and experiences.
- `semantic`: stable facts about the user, projects, tools, and technologies.
- `procedural`: learned user behaviors and repeated workflows.
- `preference`: explicit choices such as language, style, tools, and communication preferences.

## Pipeline

Observation -> Signal Detection -> Information Extraction -> Importance Evaluation -> Privacy Check
-> Approval Gate -> Storage -> Retrieval -> Application -> Forgetting.

## Retrieval

Retrieval blends:

- keyword match.
- local embedding similarity.
- knowledge graph relationship proximity.
- recency.
- confidence.
- importance.
- permission compatibility.

## Privacy And Control

Sensitive data is blocked by default. Every memory has source, confidence, importance, permissions,
expiration, and sensitivity. Users can delete a memory, forget a type/category, expire old memory, or
delete all memory data.
