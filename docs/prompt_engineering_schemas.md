# Prompt Engineering & Grounding Specifications

PodLens uses a two-stage agentic chain orchestrated via Google Cloud Vertex AI:
1. **Extraction Stage:** Identifies verifiable factual claims from raw transcripts or audio chunks.
2. **Grounding & Synthesis Stage:** Verifies claims against Google Search and formats evidence into deterministic JSON cards.

---

## Stage 1: Factual Claim Extraction Prompt

### Model Configuration
- **Model:** `gemini-1.5-flash-001`
- **Temperature:** `0.1` (deterministic extraction)
- **Response Format:** `application/json`

### System Instruction
```text
You are an expert computational fact-checker analyzing live speech transcripts.
Your task is to extract ONLY verifiable empirical statements from the input text.

A verifiable claim includes:
- Empirical statistics, metrics, and percentages (e.g., "crime fell 12%").
- Historical assertions and specific dates.
- Scientific, biomedical, or dietary assertions (e.g., "fasting doubles autophagy").
- Citations of studies, institutions, or official reports.

Do NOT extract:
- Opinions, subjective preferences, or taste (e.g., "this podcast is great").
- Clear jokes, hyperbole, or rhetorical questions.
- Unverifiable philosophical statements.

Format your output strictly according to the provided JSON schema.
```

### Output JSON Schema
```json
{
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "claim_text": { "type": "string" },
      "speaker": { "type": "string" },
      "category": { 
        "type": "string", 
        "enum": ["SCIENCE_HEALTH", "STATISTICS_DATA", "HISTORY_POLITICS", "TECH_BUSINESS"] 
      },
      "start_offset_seconds": { "type": "number" },
      "end_offset_seconds": { "type": "number" },
      "search_query": { 
        "type": "string",
        "description": "An optimized neutral search query to verify this specific assertion." 
      }
    },
    "required": ["claim_text", "category", "search_query"]
  }
}
```

---

## Stage 2: Grounding & Synthesis Prompt

### Model Configuration
- **Model:** `gemini-1.5-flash-001`
- **Temperature:** `0.2`
- **Tools Enabled:** `google_search` (Vertex AI Grounding)
- **Response Format:** `application/json`

### System Instruction
```text
You are a senior research analyst. You will receive an extracted claim along with real-time search grounding metadata from Google Search.
Your job is to produce an objective, evidence-grounded evaluation card.

Guidelines:
1. Evaluate against the authoritative consensus (peer-reviewed journals, official statistics, established history).
2. Status options:
   - "VERIFIED": Strong scientific/historical consensus supports the claim.
   - "CONTESTED": Valid studies exist on both sides, or claims observed only in animal models are falsely generalized to humans.
   - "UNSUPPORTED": No reliable evidence found, or reputable sources explicitly debunk the assertion.
3. Keep the "verdict_summary" to maximum 2 sentences written in plain language.
4. Always list primary sources with canonical URLs when available.
```

### Output JSON Schema
```json
{
  "type": "object",
  "properties": {
    "status": { 
      "type": "string", 
      "enum": ["VERIFIED", "CONTESTED", "UNSUPPORTED"] 
    },
    "badge_color": { 
      "type": "string", 
      "enum": ["green", "amber", "red"] 
    },
    "verdict_summary": { "type": "string" },
    "primary_citations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "source": { "type": "string" },
          "url": { "type": "string" }
        },
        "required": ["title", "source", "url"]
      }
    }
  },
  "required": ["status", "badge_color", "verdict_summary", "primary_citations"]
}
```