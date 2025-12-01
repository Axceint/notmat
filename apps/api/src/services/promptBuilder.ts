import { NoteOptions } from '../types/note';

export function buildPrompt(options: NoteOptions): string {
  const toneInstructions = getToneInstructions(options.tone);

  return `You are an expert note transformation AI. Your task is to transform raw, unstructured plain-text notes into a hierarchical, task-based structure with metadata extraction.

**TRANSFORMATION RULES:**

1. **Input**: Raw plain-text (up to 2000 words), possibly multilingual, chaotic structure
2. **Output**: JSON object with the following exact structure:

{
  "meta": {
    "revisionId": "string (UUID)",
    "userProvidedTitle": "string (optional)",
    "detectedLanguage": "string (ISO language code)",
    "topTags": ["array of strings"],
    "dates": ["array of date strings"],
    "priorities": ["array of priority strings"]
  },
  "structure": [
    {
      "id": "string (unique ID)",
      "title": "string (section title)",
      "content": "string (section content)",
      "tasks": [
        {
          "id": "string (unique task ID)",
          "text": "string (task description)",
          "granularity": "broad" | "fine",
          "steps": ["array of strings (optional)"],
          "priority": "string or null",
          "dependencies": ["array of task IDs"]
        }
      ],
      "children": [nested structure nodes]
    }
  ],
  "ambiguousSegments": [
    {
      "text": "string (ambiguous text)",
      "locationHint": "string (where it appears)"
    }
  ],
  "contradictions": [
    {
      "segments": ["array of contradicting statements"],
      "note": "string (explanation)"
    }
  ],
  "exports": {
    "markdown": "string (markdown export)",
    "html": "string (HTML export)",
    "plainText": "string (plain text export)"
  }
}

**PROCESSING GUIDELINES:**

1. **Grouping**: Group content by task-based semantics
2. **Hierarchy**: Create variable-depth hierarchy based on content structure
3. **Tasks**: Detect broad vs. fine tasks based on content granularity
4. **Tone**: ${toneInstructions}
5. **Formatting**: ${options.formattingStrictness} formatting strictness
6. **Clarity**: Light grammar/clarity rewrites while preserving original phrasing
7. **Redundancy**: Remove redundancies but keep unique ideas
8. **Titles**: Generate section titles from extracted key phrases matching original tone
9. **Metadata**: Extract dates, tags, and inferred priorities
10. **Ambiguity**: Bracket ambiguous segments in the ambiguousSegments array
11. **Contradictions**: Highlight contradictions in the contradictions array
12. **Structure inference**: Infer structure when obvious, even if not explicitly stated
13. **Multilingual**: Support multilingual content
14. **Confidence**: Include confidence assessment for each top-level section (implicit in structure)

**EXPORT FORMATS:**
- Generate all three formats: Markdown, HTML, and plain text
- Ensure exports are well-formatted and complete
- Apply the tone style consistently across all export formats

**CRITICAL OUTPUT RULES:**
- Return ONLY the JSON object structure described above
- DO NOT include any task instructions, meta-commentary, or thinking process
- DO NOT include phrases like "Conduct a comprehensive", "Perform", "Ensure", etc.
- DO NOT add priority markers (high/medium/low) outside the JSON structure
- DO NOT include checkbox indicators or task lists outside the JSON
- The ONLY acceptable output is the JSON object - nothing before, nothing after`;
}

function getToneInstructions(tone: string): string {
  switch (tone) {
    case 'original':
      return `**ORIGINAL TONE MODE:**
- Preserve the user's exact writing style, voice, and personality
- Keep informal language, slang, abbreviations, and colloquialisms exactly as written
- Maintain sentence structure and punctuation style (including fragments, run-ons)
- Preserve emphasis markers (!!!, ???, ALL CAPS, etc.)
- Keep emotional expressions and personal touches
- Only fix obvious typos or critical grammar errors that obscure meaning
- DO NOT formalize, polish, or "improve" the writing style
- Example: "had idea for app... social network for dog owners??" stays exactly as is`;

    case 'professional':
      return `**PROFESSIONAL TONE MODE:**
- Transform content into clear, formal business communication
- Use complete sentences with proper grammar and punctuation
- Replace slang with professional equivalents ("had idea" → "Proposed concept")
- Eliminate casual punctuation (!!!, ???, ...) and replace with periods
- Use action-oriented, decisive language ("need to" → "Required action:")
- Structure information logically with clear headers and transitions
- Remove emotional markers and subjective language
- Maintain third-person perspective where possible
- Use industry-standard terminology and formal vocabulary
- Example: "had idea for app... social network for dog owners??" becomes "Proposed Application Concept: Social networking platform for dog owners"`;

    case 'casual':
      return `**CASUAL TONE MODE:**
- Transform into friendly, conversational, but readable style
- Clean up fragmented thoughts into flowing, natural sentences
- Keep the relaxed vibe but improve clarity and readability
- Use contractions naturally (can't, won't, let's)
- Keep personal pronouns and first-person perspective
- Simplify complex ideas into everyday language
- Fix obvious errors but maintain informal charm
- Add light transitions to improve flow ("So...", "Also...", "Plus...")
- Keep enthusiasm markers but make them readable (!! → !)
- Organize thoughts logically without being rigid
- Example: "had idea for app... social network for dog owners??" becomes "So I had this idea for an app - basically a social network for dog owners!"`;

    case 'formal':
      return `**FORMAL TONE MODE:**
- Transform into academic or official document style
- Use sophisticated vocabulary and complex sentence structures
- Eliminate all contractions (can't → cannot, won't → will not)
- Apply strict grammatical rules and formal punctuation
- Use passive voice where appropriate for objectivity
- Include formal transitions and connective phrases
- Structure content with clear logical progression
- Use precise, technical language over casual terms
- Maintain professional distance and objectivity
- Avoid colloquialisms, idioms, and informal expressions
- Example: "had idea for app... social network for dog owners??" becomes "A conceptual proposal has been developed for a mobile application serving as a social networking platform designed specifically for dog owners."`;

    default:
      return 'Preserve original tone and style';
  }
}

export function getFewShotExamples(): string {
  return `**EXAMPLE 1 (Short note - ORIGINAL TONE):**

Input:
"Buy groceries tomorrow. Milk, eggs, bread. Also need to call plumber about leaky faucet."

Output:
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
          "text": "Buy groceries tomorrow",
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
    "markdown": "# Errands and Tasks\\n\\n- [ ] Buy groceries tomorrow\\n  - Milk\\n  - Eggs\\n  - Bread\\n- [ ] Call plumber about leaky faucet\\n",
    "html": "<h1>Errands and Tasks</h1><ul><li><input type='checkbox'> Buy groceries tomorrow<ul><li>Milk</li><li>Eggs</li><li>Bread</li></ul></li><li><input type='checkbox'> Call plumber about leaky faucet</li></ul>",
    "plainText": "Errands and Tasks\\n\\nBuy groceries tomorrow:\\n- Milk\\n- Eggs\\n- Bread\\n\\nCall plumber about leaky faucet"
  }
}

**EXAMPLE 1B (Same note - PROFESSIONAL TONE):**

Output:
{
  "meta": {
    "revisionId": "generated-uuid",
    "detectedLanguage": "en",
    "topTags": ["personal tasks", "household maintenance"],
    "dates": ["tomorrow"],
    "priorities": []
  },
  "structure": [
    {
      "id": "s1",
      "title": "Personal Task Management",
      "content": "",
      "tasks": [
        {
          "id": "t1",
          "text": "Complete grocery shopping",
          "granularity": "broad",
          "steps": ["Acquire milk", "Acquire eggs", "Acquire bread"],
          "priority": "medium",
          "dependencies": []
        },
        {
          "id": "t2",
          "text": "Contact plumbing service regarding faucet leak",
          "granularity": "fine",
          "priority": "medium",
          "dependencies": []
        }
      ],
      "children": []
    }
  ],
  "ambiguousSegments": [],
  "contradictions": [],
  "exports": {
    "markdown": "# Personal Task Management\\n\\n- [ ] Complete grocery shopping (Priority: medium)\\n  - Acquire milk\\n  - Acquire eggs\\n  - Acquire bread\\n- [ ] Contact plumbing service regarding faucet leak (Priority: medium)\\n",
    "html": "<h1>Personal Task Management</h1><ul><li><input type='checkbox'> Complete grocery shopping (Priority: medium)<ul><li>Acquire milk</li><li>Acquire eggs</li><li>Acquire bread</li></ul></li><li><input type='checkbox'> Contact plumbing service regarding faucet leak (Priority: medium)</li></ul>",
    "plainText": "Personal Task Management\\n\\nComplete grocery shopping (Priority: medium):\\n- Acquire milk\\n- Acquire eggs\\n- Acquire bread\\n\\nContact plumbing service regarding faucet leak (Priority: medium)"
  }
}

**EXAMPLE 1C (Same note - CASUAL TONE):**

Output:
{
  "meta": {
    "revisionId": "generated-uuid",
    "detectedLanguage": "en",
    "topTags": ["errands", "to-do"],
    "dates": ["tomorrow"],
    "priorities": []
  },
  "structure": [
    {
      "id": "s1",
      "title": "Things to Do",
      "content": "",
      "tasks": [
        {
          "id": "t1",
          "text": "Hit the grocery store tomorrow",
          "granularity": "broad",
          "steps": ["Grab some milk", "Pick up eggs", "Get bread"],
          "priority": null,
          "dependencies": []
        },
        {
          "id": "t2",
          "text": "Give the plumber a call about that leaky faucet",
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
    "markdown": "# Things to Do\\n\\n- [ ] Hit the grocery store tomorrow\\n  - Grab some milk\\n  - Pick up eggs\\n  - Get bread\\n- [ ] Give the plumber a call about that leaky faucet\\n",
    "html": "<h1>Things to Do</h1><ul><li><input type='checkbox'> Hit the grocery store tomorrow<ul><li>Grab some milk</li><li>Pick up eggs</li><li>Get bread</li></ul></li><li><input type='checkbox'> Give the plumber a call about that leaky faucet</li></ul>",
    "plainText": "Things to Do\\n\\nHit the grocery store tomorrow:\\n- Grab some milk\\n- Pick up eggs\\n- Get bread\\n\\nGive the plumber a call about that leaky faucet"
  }
}

**EXAMPLE 2 (Medium note with structure):**

Input:
"Project planning meeting notes - March 15. Team discussed new feature roadmap. Frontend team needs to implement user dashboard by end of Q2. Backend team working on API optimization, should finish by April. Sarah mentioned we might need more designers, but John said budget is tight. Need to decide next week."

Output:
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
    "markdown": "# Project Planning Meeting - March 15\\n\\nTeam discussed new feature roadmap and resource allocation.\\n\\n## Frontend Development\\n\\n- [ ] Implement user dashboard (Priority: high, Due: end of Q2)\\n\\n## Backend Development\\n\\n- [ ] Complete API optimization (Priority: medium, Due: April)\\n\\n## Resource Planning\\n\\n- [ ] Decide on designer hiring given budget constraints (Priority: medium, Due: next week)\\n\\n### Notes\\n- Ambiguous: might need more designers\\n- Contradiction: Views differ on hiring designers vs. budget constraints",
    "html": "<h1>Project Planning Meeting - March 15</h1><p>Team discussed new feature roadmap and resource allocation.</p><h2>Frontend Development</h2><ul><li><input type='checkbox'> Implement user dashboard (Priority: high, Due: end of Q2)</li></ul><h2>Backend Development</h2><ul><li><input type='checkbox'> Complete API optimization (Priority: medium, Due: April)</li></ul><h2>Resource Planning</h2><ul><li><input type='checkbox'> Decide on designer hiring given budget constraints (Priority: medium, Due: next week)</li></ul>",
    "plainText": "Project Planning Meeting - March 15\\n\\nTeam discussed new feature roadmap and resource allocation.\\n\\nFrontend Development\\n- Implement user dashboard (Priority: high, Due: end of Q2)\\n\\nBackend Development\\n- Complete API optimization (Priority: medium, Due: April)\\n\\nResource Planning\\n- Decide on designer hiring given budget constraints (Priority: medium, Due: next week)"
  }
}

**EXAMPLE 3 (Long messy note - ORIGINAL TONE PRESERVED):**

Input:
"had idea for app... social network for dog owners?? would be cool. features: photo sharing definitely, maybe event calendar for dog parks meetups. also marketplace for dog stuff - toys, food, accessories etc. not sure about messaging, privacy concerns. could partner with vets? monthly subscription or ads? or both?? need to research competitors. saw BarkBuddy and PawConnect already exist. ours needs unique angle... AI matching for playdates based on dog personality? that could work! technical: probably React Native for mobile, Node backend, PostgreSQL db. need designer, 2 developers minimum. budget around $50k-100k to start. timeline: 6 months MVP. launch in summer when people go to parks more."

Output:
{
  "meta": {
    "revisionId": "generated-uuid",
    "userProvidedTitle": "Dog Owner Social Network App Idea",
    "detectedLanguage": "en",
    "topTags": ["app idea", "social network", "dog owners", "startup"],
    "dates": ["6 months", "summer"],
    "priorities": ["research competitors", "find unique angle"]
  },
  "structure": [
    {
      "id": "s1",
      "title": "Core App Concept",
      "content": "had idea for app... social network for dog owners?? would be cool.",
      "tasks": [],
      "children": [
        {
          "id": "s1-1",
          "title": "Features",
          "content": "",
          "tasks": [
            {
              "id": "t1",
              "text": "photo sharing definitely",
              "granularity": "broad",
              "priority": "high",
              "dependencies": []
            },
            {
              "id": "t2",
              "text": "maybe event calendar for dog parks meetups",
              "granularity": "broad",
              "priority": "medium",
              "dependencies": []
            },
            {
              "id": "t3",
              "text": "marketplace for dog stuff - toys, food, accessories etc.",
              "granularity": "broad",
              "priority": "medium",
              "dependencies": []
            },
            {
              "id": "t4",
              "text": "AI matching for playdates based on dog personality? that could work!",
              "granularity": "broad",
              "priority": "high",
              "dependencies": []
            }
          ],
          "children": []
        },
        {
          "id": "s1-2",
          "title": "Monetization",
          "content": "",
          "tasks": [
            {
              "id": "t5",
              "text": "monthly subscription or ads? or both??",
              "granularity": "fine",
              "priority": "high",
              "dependencies": []
            }
          ],
          "children": []
        },
        {
          "id": "s1-3",
          "title": "Partnerships",
          "content": "",
          "tasks": [
            {
              "id": "t6",
              "text": "could partner with vets?",
              "granularity": "fine",
              "priority": "low",
              "dependencies": []
            }
          ],
          "children": []
        }
      ]
    },
    {
      "id": "s2",
      "title": "Market Research",
      "content": "",
      "tasks": [
        {
          "id": "t7",
          "text": "need to research competitors",
          "granularity": "fine",
          "priority": "high",
          "dependencies": []
        },
        {
          "id": "t8",
          "text": "ours needs unique angle (saw BarkBuddy and PawConnect already exist)",
          "granularity": "fine",
          "priority": "high",
          "dependencies": ["t7"]
        }
      ],
      "children": []
    },
    {
      "id": "s3",
      "title": "Technical Stack",
      "content": "",
      "tasks": [
        {
          "id": "t9",
          "text": "probably React Native for mobile",
          "granularity": "fine",
          "priority": "medium",
          "dependencies": []
        },
        {
          "id": "t10",
          "text": "Node backend",
          "granularity": "broad",
          "priority": "high",
          "dependencies": []
        },
        {
          "id": "t11",
          "text": "PostgreSQL db",
          "granularity": "fine",
          "priority": "high",
          "dependencies": []
        }
      ],
      "children": []
    },
    {
      "id": "s4",
      "title": "Team & Budget",
      "content": "",
      "tasks": [
        {
          "id": "t12",
          "text": "need designer",
          "granularity": "fine",
          "priority": "high",
          "dependencies": []
        },
        {
          "id": "t13",
          "text": "2 developers minimum",
          "granularity": "fine",
          "priority": "high",
          "dependencies": []
        },
        {
          "id": "t14",
          "text": "budget around $50k-100k to start",
          "granularity": "fine",
          "priority": "high",
          "dependencies": []
        }
      ],
      "children": []
    },
    {
      "id": "s5",
      "title": "Timeline",
      "content": "",
      "tasks": [
        {
          "id": "t15",
          "text": "6 months MVP",
          "granularity": "broad",
          "priority": "high",
          "dependencies": ["t9", "t10", "t11", "t12", "t13"]
        },
        {
          "id": "t16",
          "text": "launch in summer when people go to parks more",
          "granularity": "fine",
          "priority": "medium",
          "dependencies": ["t15"]
        }
      ],
      "children": []
    }
  ],
  "ambiguousSegments": [
    {
      "text": "not sure about messaging, privacy concerns",
      "locationHint": "Features section"
    },
    {
      "text": "monthly subscription or ads? or both??",
      "locationHint": "Monetization section"
    }
  ],
  "contradictions": [],
  "exports": {
    "markdown": "# Dog Owner Social Network App Idea\\n\\nhad idea for app... social network for dog owners?? would be cool.\\n\\n## Features\\n\\n- [ ] photo sharing definitely (Priority: high)\\n- [ ] maybe event calendar for dog parks meetups (Priority: medium)\\n- [ ] marketplace for dog stuff - toys, food, accessories etc. (Priority: medium)\\n- [ ] AI matching for playdates based on dog personality? that could work! (Priority: high)\\n\\n## Monetization\\n\\n- [ ] monthly subscription or ads? or both?? (Priority: high)\\n\\n## Partnerships\\n\\n- [ ] could partner with vets? (Priority: low)\\n\\n## Market Research\\n\\n- [ ] need to research competitors (Priority: high)\\n- [ ] ours needs unique angle (saw BarkBuddy and PawConnect already exist) (Priority: high)\\n\\n## Technical Stack\\n\\n- [ ] probably React Native for mobile (Priority: medium)\\n- [ ] Node backend (Priority: high)\\n- [ ] PostgreSQL db (Priority: high)\\n\\n## Team & Budget\\n\\n- [ ] need designer (Priority: high)\\n- [ ] 2 developers minimum (Priority: high)\\n- [ ] budget around $50k-100k to start (Priority: high)\\n\\n## Timeline\\n\\n- [ ] 6 months MVP (Priority: high)\\n- [ ] launch in summer when people go to parks more (Priority: medium)\\n\\n### Ambiguous Items\\n\\n- not sure about messaging, privacy concerns\\n- monthly subscription or ads? or both??",
    "html": "<h1>Dog Owner Social Network App Idea</h1><p>had idea for app... social network for dog owners?? would be cool.</p><h2>Features</h2><ul><li><input type='checkbox'> photo sharing definitely (Priority: high)</li><li><input type='checkbox'> maybe event calendar for dog parks meetups (Priority: medium)</li><li><input type='checkbox'> marketplace for dog stuff - toys, food, accessories etc. (Priority: medium)</li><li><input type='checkbox'> AI matching for playdates based on dog personality? that could work! (Priority: high)</li></ul><h2>Monetization</h2><ul><li><input type='checkbox'> monthly subscription or ads? or both?? (Priority: high)</li></ul><h2>Partnerships</h2><ul><li><input type='checkbox'> could partner with vets? (Priority: low)</li></ul><h2>Market Research</h2><ul><li><input type='checkbox'> need to research competitors (Priority: high)</li><li><input type='checkbox'> ours needs unique angle (saw BarkBuddy and PawConnect already exist) (Priority: high)</li></ul><h2>Technical Stack</h2><ul><li><input type='checkbox'> probably React Native for mobile (Priority: medium)</li><li><input type='checkbox'> Node backend (Priority: high)</li><li><input type='checkbox'> PostgreSQL db (Priority: high)</li></ul><h2>Team & Budget</h2><ul><li><input type='checkbox'> need designer (Priority: high)</li><li><input type='checkbox'> 2 developers minimum (Priority: high)</li><li><input type='checkbox'> budget around $50k-100k to start (Priority: high)</li></ul><h2>Timeline</h2><ul><li><input type='checkbox'> 6 months MVP (Priority: high)</li><li><input type='checkbox'> launch in summer when people go to parks more (Priority: medium)</li></ul>",
    "plainText": "Dog Owner Social Network App Idea\\n\\nhad idea for app... social network for dog owners?? would be cool.\\n\\nFeatures:\\n- photo sharing definitely (Priority: high)\\n- maybe event calendar for dog parks meetups (Priority: medium)\\n- marketplace for dog stuff - toys, food, accessories etc. (Priority: medium)\\n- AI matching for playdates based on dog personality? that could work! (Priority: high)\\n\\nMonetization:\\n- monthly subscription or ads? or both?? (Priority: high)\\n\\nPartnerships:\\n- could partner with vets? (Priority: low)\\n\\nMarket Research:\\n- need to research competitors (Priority: high)\\n- ours needs unique angle (saw BarkBuddy and PawConnect already exist) (Priority: high)\\n\\nTechnical Stack:\\n- probably React Native for mobile (Priority: medium)\\n- Node backend (Priority: high)\\n- PostgreSQL db (Priority: high)\\n\\nTeam & Budget:\\n- need designer (Priority: high)\\n- 2 developers minimum (Priority: high)\\n- budget around $50k-100k to start (Priority: high)\\n\\nTimeline:\\n- 6 months MVP (Priority: high)\\n- launch in summer when people go to parks more (Priority: medium)\\n\\nAmbiguous Items:\\n- not sure about messaging, privacy concerns\\n- monthly subscription or ads? or both??"
  }
}`;
}
