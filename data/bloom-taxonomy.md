# Bloom's Taxonomy — PM Writing Assessment Framework

This document defines the cognitive altitude levels used by the Digital Aristotle to assess writing artifacts. The framework is adapted from Bloom's revised taxonomy (Anderson & Krathwohl, 2001) with PM-writing-specific indicators.

The Aristotle focuses on three levels relevant to senior operators: Application, Synthesis, and Evaluation. Lower levels (Remember, Understand) are assumed competent for the target user.

---

## Level 1: Application

**Definition**: The writer applies known frameworks, models, and best practices correctly. Output is competent and recognizable as "good PM work" by peers.

### Detection Signals in Writing
- Uses established frameworks (Jobs-to-Be-Done, Kano, RICE) correctly and in appropriate context
- Writes PRDs that follow recognized templates and cover expected sections
- References industry best practices with accurate attribution
- Structures arguments logically with clear evidence chains
- Uses PM terminology precisely (not loosely or interchangeably)

### Example Artifacts at This Level
- A PRD that follows the Amazon Working Backwards format faithfully
- An article explaining how to run a pre-mortem, with steps drawn from standard practice
- A stakeholder alignment doc that applies RACI correctly

### What's Missing (Gap to Synthesis)
- The writer does not question whether the framework is the right one for this situation
- No novel combination of ideas — each framework is used as designed
- The writing summarizes and applies existing knowledge rather than creating new knowledge
- Absence of "this is where the standard model breaks down" moments
- The reader learns *about* a method but gains no new lens for seeing their own work differently

---

## Level 2: Synthesis

**Definition**: The writer combines multiple frameworks, ideas, or domains into something new. Output contains original models, novel connections, or reframed problems that did not exist before the writing.

### Detection Signals in Writing
- Combines frameworks from different domains (e.g., behavioral economics + product discovery)
- Creates original models, 2x2s, or taxonomies that are not found in existing literature
- Reframes a known problem in a way that changes which solutions are considered
- Draws non-obvious connections between ideas ("X in domain A is structurally identical to Y in domain B")
- The writing produces a new lens, not just a new summary
- Names things — introduces new terminology for previously unnamed patterns

### Example Artifacts at This Level
- An article that combines Cagan's product discovery with Kahneman's dual-process theory to create a new framework for evaluating PM decisions under uncertainty
- A piece that reframes the "PM career ladder" as a cognitive altitude problem rather than a skills-checklist problem
- A draft that names a previously unnamed pattern (e.g., "acceptance event" as introduced in the Digital Aristotle PRD)

### What's Missing (Gap to Evaluation)
- The writer creates new combinations but does not rigorously assess their limitations
- Novel frameworks are presented as discoveries, not as hypotheses to be tested
- The writing does not address: "Under what conditions does my own model fail?"
- Absence of self-directed critique — the writer is proud of the synthesis but has not attacked it
- The reader is impressed but is not equipped to judge when the new model should NOT be used

---

## Level 3: Evaluation

**Definition**: The writer judges the quality, validity, and boundaries of ideas — including their own. Output assesses frameworks (including novel ones the writer created) against criteria, identifies failure modes, and produces writing that advances the field rather than summarizing or even synthesizing it.

### Detection Signals in Writing
- Explicitly states the conditions under which their own argument fails
- Compares their framework against alternatives and explains when each is superior
- Identifies the strongest counter-argument to their position and addresses it directly
- Provides criteria for the reader to evaluate the writer's own claims
- Distinguishes between "this is true" and "this is useful" — and explains the difference for each claim
- The writing makes the reader more capable of independent judgment, not more dependent on the writer
- Includes falsifiable predictions or testable claims
- Addresses second-order effects and unintended consequences of their recommendations

### Example Artifacts at This Level
- An article that presents the "acceptance-detector" concept AND identifies three scenarios where it would give false positives, with mitigation strategies
- A framework piece that includes a "when NOT to use this" section that is as detailed as the "when to use this" section
- A post-mortem that evaluates not just what went wrong, but whether the evaluation framework used in the post-mortem itself has blind spots
- Writing that says "I was wrong about X in my previous article, and here's why the error was structurally predictable"

### What Would Be Missing If Not Yet Here
- Self-critique is absent or superficial ("of course, no framework is perfect" without specifying HOW it's imperfect)
- Counter-arguments are strawmanned rather than steelmanned
- The writer's confidence in their own frameworks is not calibrated — everything they produce is presented with equal conviction
- No mechanism for the reader to disagree with the writer using the writer's own criteria

---

## Assessment Protocol

When scoring an artifact's Bloom altitude:

1. **Read the full artifact** before scoring. Do not score from excerpts.
2. **Identify the highest sustained level**, not the highest momentary flash. A single Evaluation-level paragraph in an otherwise Application-level article scores as Application with an Evaluation flash.
3. **Score the reasoning, not the topic complexity.** A simple topic written at Evaluation level scores higher than a complex topic written at Application level.
4. **Tag specific passages** with their level. Show the user exactly which sentences operate at which altitude.
5. **Name the gap.** After scoring, identify the single most impactful change that would push the artifact one level higher.

### Output Format

```
## Bloom Altitude Assessment

**Artifact**: [title or description]
**Date**: [YYYY-MM-DD]
**Sustained Level**: [Application | Synthesis | Evaluation]
**Highest Flash**: [level, if different from sustained]
**Key Passages**: [2-3 tagged excerpts with level annotations]
**Gap to Next Level**: [specific, actionable observation]
**Feedback Mode**: [Cheerleader | Sparring Partner | Devil's Advocate]
```
