# Bloom's Taxonomy — Cognitive Altitude Assessment Framework

This document defines the cognitive altitude levels used by the Digital Aristotle to assess work artifacts. The framework is adapted from Bloom's revised taxonomy (Anderson & Krathwohl, 2001).

The Aristotle focuses on three levels relevant to senior operators: Application, Synthesis, and Evaluation. Lower levels (Remember, Understand) are assumed competent for the target user.

These levels are domain-agnostic. For domain-specific indicators and examples, see `data/domain-profile.md`.

---

## Level 1: Application

**Definition**: The practitioner applies known frameworks, models, and best practices correctly. Output is competent and recognizable as "good work" by peers in the domain.

### Detection Signals (domain-agnostic)
- Uses established frameworks, methodologies, or patterns correctly and in appropriate context
- Produces artifacts that follow recognized templates and cover expected sections
- References industry best practices with accurate attribution
- Structures arguments, analyses, or work products logically with clear chains of reasoning
- Uses domain terminology precisely (not loosely or interchangeably)

### What's Missing (Gap to Synthesis)
- The practitioner does not question whether the framework is the right one for this situation
- No novel combination of ideas — each framework is used as designed
- The work summarizes and applies existing knowledge rather than creating new knowledge
- Absence of "this is where the standard approach breaks down" moments
- The reader learns *about* a method but gains no new lens for seeing their own work differently

---

## Level 2: Synthesis

**Definition**: The practitioner combines multiple frameworks, ideas, or domains into something new. Output contains original models, novel connections, or reframed problems that did not exist before the work.

### Detection Signals (domain-agnostic)
- Combines frameworks from different sub-disciplines or domains
- Creates original models, 2x2s, taxonomies, or methods not found in existing literature
- Reframes a known problem in a way that changes which solutions are considered
- Draws non-obvious connections between ideas ("X in domain A is structurally identical to Y in domain B")
- The work produces a new lens, not just a new summary
- Names things — introduces new terminology for previously unnamed patterns

### What's Missing (Gap to Evaluation)
- The practitioner creates new combinations but does not rigorously assess their limitations
- Novel frameworks are presented as discoveries, not as hypotheses to be tested
- The work does not address: "Under what conditions does my own model fail?"
- Absence of self-directed critique — the practitioner is proud of the synthesis but has not attacked it
- The reader is impressed but is not equipped to judge when the new model should NOT be used

---

## Level 3: Evaluation

**Definition**: The practitioner judges the quality, validity, and boundaries of ideas — including their own. Output assesses frameworks (including novel ones the practitioner created) against criteria, identifies failure modes, and produces work that advances the field rather than summarizing or even synthesizing it.

### Detection Signals (domain-agnostic)
- Explicitly states the conditions under which their own argument or method fails
- Compares their framework against alternatives and explains when each is superior
- Identifies the strongest counter-argument to their position and addresses it directly
- Provides criteria for the reader to evaluate the practitioner's own claims
- Distinguishes between "this is true" and "this is useful" — and explains the difference for each claim
- The work makes the reader more capable of independent judgment, not more dependent on the practitioner
- Includes falsifiable predictions or testable claims
- Addresses second-order effects and unintended consequences

### What Would Be Missing If Not Yet Here
- Self-critique is absent or superficial ("of course, no method is perfect" without specifying HOW)
- Counter-arguments are strawmanned rather than steelmanned
- The practitioner's confidence in their own frameworks is not calibrated — everything is presented with equal conviction
- No mechanism for the reader to disagree with the practitioner using the practitioner's own criteria

---

## Assessment Protocol

When scoring an artifact's Bloom altitude:

1. **Read the full artifact** before scoring. Do not score from excerpts.
2. **Identify the highest sustained level**, not the highest momentary flash. A single Evaluation-level passage in an otherwise Application-level artifact scores as Application with an Evaluation flash.
3. **Score the reasoning, not the topic complexity.** A simple topic rendered at Evaluation level scores higher than a complex topic rendered at Application level.
4. **Tag specific passages or sections** with their level. Show the user exactly which parts operate at which altitude.
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
