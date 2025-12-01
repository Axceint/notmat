# AI Prompt Examples

This document contains the three example note transformations that are included in the AI prompt to teach the model the expected output format.

## Example 1: Short Note (Simple Todo List)

### Input
```
Buy groceries tomorrow. Milk, eggs, bread. Also need to call plumber about leaky faucet.
```

### Expected Output
```json
{
  "meta": {
    "revisionId": "generated-uuid",
    "detectedLanguage": "en",
    "topTags": ["errands", "shopping", "home maintenance"],
    "dates": ["tomorrow"],
    "priorities": []
  },
  "structure": [
    {
      "id": "s1",
      "title": "Errands and Tasks",
      "content": "",
      "tasks": [
        {
          "id": "t1",
          "text": "Buy groceries",
          "granularity": "broad",
          "steps": ["Milk", "Eggs", "Bread"],
          "priority": null,
          "dependencies": []
        },
        {
          "id": "t2",
          "text": "Call plumber about leaky faucet",
          "granularity": "fine",
          "priority": null,
          "dependencies": []
        }
      ],
      "children": []
    }
  ],
  "ambiguousSegments": [],
  "contradictions": [],
  "exports": {
    "markdown": "# Errands and Tasks\n\n- [ ] Buy groceries\n  - Milk\n  - Eggs\n  - Bread\n- [ ] Call plumber about leaky faucet\n",
    "html": "<h1>Errands and Tasks</h1><ul><li><input type='checkbox'> Buy groceries<ul><li>Milk</li><li>Eggs</li><li>Bread</li></ul></li><li><input type='checkbox'> Call plumber about leaky faucet</li></ul>",
    "plainText": "Errands and Tasks\n\nBuy groceries:\n- Milk\n- Eggs\n- Bread\n\nCall plumber about leaky faucet"
  }
}
```

## Example 2: Medium Note (Project Meeting)

### Input
```
Project planning meeting notes - March 15. Team discussed new feature roadmap. Frontend team needs to implement user dashboard by end of Q2. Backend team working on API optimization, should finish by April. Sarah mentioned we might need more designers, but John said budget is tight. Need to decide next week.
```

### Expected Output
```json
{
  "meta": {
    "revisionId": "generated-uuid",
    "detectedLanguage": "en",
    "topTags": ["project planning", "team meeting", "roadmap"],
    "dates": ["March 15", "end of Q2", "April", "next week"],
    "priorities": ["budget constraints"]
  },
  "structure": [
    {
      "id": "s1",
      "title": "Project Planning Meeting - March 15",
      "content": "Team discussed new feature roadmap and resource allocation.",
      "tasks": [],
      "children": [
        {
          "id": "s1-1",
          "title": "Frontend Development",
          "content": "",
          "tasks": [
            {
              "id": "t1",
              "text": "Implement user dashboard",
              "granularity": "broad",
              "priority": "high",
              "dependencies": []
            }
          ],
          "children": []
        },
        {
          "id": "s1-2",
          "title": "Backend Development",
          "content": "",
          "tasks": [
            {
              "id": "t2",
              "text": "Complete API optimization",
              "granularity": "broad",
              "priority": "medium",
              "dependencies": []
            }
          ],
          "children": []
        },
        {
          "id": "s1-3",
          "title": "Resource Planning",
          "content": "",
          "tasks": [
            {
              "id": "t3",
              "text": "Decide on designer hiring given budget constraints",
              "granularity": "fine",
              "priority": "medium",
              "dependencies": []
            }
          ],
          "children": []
        }
      ]
    }
  ],
  "ambiguousSegments": [
    {
      "text": "might need more designers",
      "locationHint": "Resource Planning section"
    }
  ],
  "contradictions": [
    {
      "segments": [
        "Sarah mentioned we might need more designers",
        "John said budget is tight"
      ],
      "note": "Conflicting views on hiring additional designers due to budget constraints"
    }
  ],
  "exports": {
    "markdown": "...",
    "html": "...",
    "plainText": "..."
  }
}
```

## Example 3: Long Messy Note (Brainstorming)

### Input
```
had idea for app... social network for dog owners?? would be cool. features: photo sharing definitely, maybe event calendar for dog parks meetups. also marketplace for dog stuff - toys, food, accessories etc. not sure about messaging, privacy concerns. could partner with vets? monthly subscription or ads? or both?? need to research competitors. saw BarkBuddy and PawConnect already exist. ours needs unique angle... AI matching for playdates based on dog personality? that could work! technical: probably React Native for mobile, Node backend, PostgreSQL db. need designer, 2 developers minimum. budget around $50k-100k to start. timeline: 6 months MVP. launch in summer when people go to parks more.
```

### Expected Output Structure

The output includes:
- Core App Concept section with subsections for Features, Monetization, Partnerships
- Market Research section with competitor analysis tasks
- Technical Implementation section with technology stack tasks
- Team & Budget section with hiring requirements
- Timeline & Launch section with milestones

Key aspects:
- Ambiguous segments marked: "not sure about messaging, privacy concerns" and "monthly subscription or ads? or both??"
- All technical details captured as specific tasks
- Budget range preserved
- Dependencies mapped (e.g., launch depends on MVP completion)
- Priority inference based on importance signals in text

See `apps/api/src/services/promptBuilder.ts` for the complete example with full JSON output.

## Using These Examples

These examples are embedded in the AI prompt through the `getFewShotExamples()` function. They teach the model:

1. **Format consistency**: Exact JSON structure to follow
2. **Hierarchy building**: How to create nested sections
3. **Task extraction**: Identifying actionable items
4. **Metadata detection**: Finding dates, tags, priorities
5. **Ambiguity handling**: Marking unclear segments
6. **Contradiction detection**: Identifying conflicting statements
7. **Export generation**: Creating Markdown, HTML, and plain text versions

The model learns to apply these patterns to any input note, regardless of length or structure.
