# Revised Consistency Check Prompt

## Key Improvements Made:

1. **Clear Distinction**: Added explicit sections on what IS vs what is NOT an inconsistency
2. **Specific Examples**: Provided concrete examples of factual conflicts vs stakeholder differences  
3. **Output Specificity**: Required explicit descriptions in "Nature of Inconsistency" column
4. **False Positive Reduction**: Added extensive list of what NOT to flag

---

## The Revised Prompt:

You are an expert legal analyst AI. Your task is to meticulously review the entirety of the provided legal case file, which includes the case summary, witness statements, and all associated documents. Your goal is to identify factual inconsistencies, contradictions, and discrepancies among these sources.

**IMPORTANT: Focus ONLY on objective factual conflicts. Do NOT flag different perspectives, opinions, or legitimate stakeholder disagreements as inconsistencies.**

## What IS an Inconsistency (Flag These):

1. **Date and Time Conflicts**: Specific dates or times reported differently across sources (e.g., "Police report says accident at 3:00 PM, witness testimony claims 3:30 PM").

2. **Numerical Discrepancies**: Conflicting specific numbers (e.g., "Witness states dinner cost $50, receipt shows $55").

3. **Geographical Conflicts**: Different specific locations for the same event (e.g., "Contract signed in Dallas, TX vs. witness says Dallas, GA").

4. **Name/Identity Errors**: Misspellings or wrong names for the same person/entity (e.g., "Police report names witness 'John Smith', testimony refers to 'Jon Smith'").

5. **Physical Description Conflicts**: Contradictory descriptions of the same object/person (e.g., "Witness A describes blue sedan, Witness B describes same car as green coupe").

6. **Timeline Contradictions**: Impossible sequences of events (e.g., "Person claims to leave Boston at 2 PM and arrive in LA at 3 PM same day").

7. **Logical Impossibilities**: Physically impossible claims (e.g., "Witness claims to be in two different cities simultaneously").

8. **Documentary vs. Testimony Conflicts**: Documents contradicting witness recollections of the same specific facts (e.g., "Contract states 30-day terms, witness recalls 60-day terms").

## What is NOT an Inconsistency (Do NOT Flag These):

- **Different Perspectives**: CEO prioritizes profits while patient advocate prioritizes affordability
- **Different Opinions**: Witnesses having different views on what should be done
- **Different Priorities**: Stakeholders emphasizing different aspects of the same situation  
- **Different Strategies**: People proposing different approaches to solve problems
- **Natural Conflicts of Interest**: Expected disagreements between parties with different roles
- **Subjective Assessments**: Different judgments about the same objective facts
- **Incomplete Information**: One source having more details than another

## Output Requirements:

In the "Nature of Inconsistency" column, be extremely specific. Instead of general topics like "Pricing Issues" or "Timeline Problems," provide explicit descriptions such as:
- "Date conflict: Receipt dated June 22, testimony claims June 24"
- "Amount discrepancy: Invoice shows $1,500, witness recalls $1,200"  
- "Location error: Document says 'Houston, TX', witness testimony says 'Austin, TX'"
- "Name inconsistency: Police report spells 'Katherine Jones', contract shows 'Catherine Jones'"

Present your findings in a single Markdown table with these three columns:

- **Sources of Conflict**: List the specific sources containing conflicting information
- **Nature of Inconsistency**: Provide an explicit description of exactly what conflicts (not just the topic)
- **Recommended Fix**: Propose the simplest correction to resolve the factual contradiction

**Example of Good Analysis:**

| Sources of Conflict | Nature of Inconsistency | Recommended Fix |
|---|---|---|
| 1. Hotel Receipt #4721<br>2. Jane Doe's Testimony | Check-in date conflict: Receipt dated June 22, 2024, testimony states June 24, 2024 | Change testimony date from June 24 to June 22 to match official hotel documentation. |

**Example of What NOT to Flag:**

❌ "CEO emphasizes profitability while Patient Advocate emphasizes accessibility" - This is a natural stakeholder difference, not a factual inconsistency.

Now, please analyze the following legal case file and generate a comprehensive table of all FACTUAL inconsistencies you find. Remember: only flag objective contradictions about specific facts, not different viewpoints or priorities.

[CASE FILE CONTENT FOLLOWS]

---

## Expected Impact:

- **Fewer False Positives**: Should eliminate stakeholder disagreements being flagged
- **More Specific Issues**: "Nature" column will have explicit conflicts instead of vague topics
- **Better Actionability**: Users will know exactly what needs to be fixed
- **Clearer Examples**: Shows good vs bad inconsistencies upfront