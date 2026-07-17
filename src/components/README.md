# Components

Shared reusable UI primitives live here once the product needs real interface elements.

Keep this folder presentation-only:

- No Chrome API calls.
- No content-script DOM observation.
- No AI provider calls.
- Accept data and callbacks through props.
- Put feature-specific UI under `src/features/<feature>/components` when it is not broadly reusable.
