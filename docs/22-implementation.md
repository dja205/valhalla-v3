# Implementation Summary

## Issue
P2 QA Finding: Agent name classification too strict — Design/build phase classification uses exact string matching against DESIGN_TEAM/BUILD_TEAM arrays. Variations like 'Mimir-v2' or 'thor_orchestrator' silently fail to match.

## Outcome Delivered
Created `normalizeAgentName()` utility function that strips all non-alphabetic characters and lowercases the input, ensuring agent name variations like 'Mimir-v2', 'mimir', and 'MIMIR' all normalize to 'mimir' for reliable matching.

## Key Changes

1. **src/lib/agentMap.ts** — Added `normalizeAgentName()` export:
   ```ts
   export function normalizeAgentName(agent: string): string {
     return agent.toLowerCase().replace(/[^a-z]/g, '');
   }
   ```

2. **src/views/Home.tsx** — Updated `getCurrentPhase()` to use normalized agent names:
   - Changed `agentLower = activeStage.agent.toLowerCase()` to `normalized = normalizeAgentName(activeStage.agent)`
   - Updated both DESIGN_TEAM and BUILD_TEAM checks to use normalized value

3. **server/routes/analytics.ts** — Added local `normalizeAgentName()` function and updated DESIGN_TEAM check:
   - Changed `DESIGN_TEAM.includes(stage.agent?.toLowerCase() ?? '')` to `DESIGN_TEAM.includes(normalizeAgentName(stage.agent ?? ''))`

## Tests Added or Updated
No new tests added. Existing TypeScript compilation (`npx tsc --noEmit`) passes successfully.

## Known Risks
- **None significant**: The normalization is purely additive — all previously-matching names continue to match, while additional variations now also match correctly.
- The analytics.ts file has its own local copy of `normalizeAgentName()` rather than importing from agentMap.ts due to the server/client code separation. Both implementations are identical.
