# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records (ADRs) for the smartem-frontend project.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows this structure:

- **Title**: Brief, descriptive title prefixed with a sequential number (e.g., `0001-commit-generated-route-tree.md`)
- **Status**: Accepted, Proposed, Deprecated, or Superseded
- **Context**: What is the issue that motivates this decision?
- **Decision**: What is the change that we're proposing and/or doing?
- **Consequences**: What becomes easier or more difficult to do because of this change?
- **Alternatives Considered**: What other options were evaluated?
- **References**: Links to relevant documentation or discussions

## Index

| Number                                        | Title                                          | Status   | Date       |
| --------------------------------------------- | ---------------------------------------------- | -------- | ---------- |
| [0001](./0001-commit-generated-route-tree.md) | Commit Generated Route Tree to Version Control | Accepted | 2025-01-12 |

## Creating a New ADR

1. Copy an existing ADR as a template
2. Increment the number (e.g., next would be `0002`)
3. Use lowercase with hyphens for the filename: `####-brief-description.md`
4. Update this README's index table
5. Submit as part of your pull request
