# API Documentation

## Base URL

```
http://localhost:4000/api/v1
```

## Headers

All API endpoints require:

```
Content-Type: application/json
```

## Endpoints

### Health Check

Check API health status.

**Endpoint:** `GET /health`

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Create Note

Submit a new note for AI processing.

**Endpoint:** `POST /api/v1/notes`

**Request Body:**

```json
{
  "rawText": "Your note content here (up to 2000 words)",
  "options": {
    "tone": "original" | "formal" | "casual" | "professional",
    "formattingStrictness": "loose" | "moderate" | "strict",
    "exportMode": "all" | "markdown" | "html" | "text",
    "useCached": true | false
  }
}
```

**Response:** `201 Created`

```json
{
  "jobId": "job-abc123",
  "revisionId": "550e8400-e29b-41d4-a716-446655440000",
  "cached": false
}
```

**Errors:**

- `400` - Validation error (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `500` - Server error

---

### Get Revision Status

Check the processing status of a note revision.

**Endpoint:** `GET /api/v1/notes/:revisionId/status`

**URL Parameters:**

- `revisionId` (string, required) - UUID of the revision

**Response:** `200 OK`

```json
{
  "status": "queued" | "processing" | "done" | "failed",
  "progress": 50,
  "cached": false,
  "error": "Error message (if failed)"
}
```

**Errors:**

- `401` - Unauthorized
- `404` - Revision not found
- `500` - Server error

---

### Get Revision Result

Retrieve the processed note structure.

**Endpoint:** `GET /api/v1/notes/:revisionId/result`

**URL Parameters:**

- `revisionId` (string, required) - UUID of the revision

**Response:** `200 OK`

```json
{
  "meta": {
    "revisionId": "550e8400-e29b-41d4-a716-446655440000",
    "userProvidedTitle": "My Note Title",
    "detectedLanguage": "en",
    "topTags": ["tag1", "tag2", "tag3"],
    "dates": ["tomorrow", "next week"],
    "priorities": ["high", "medium"]
  },
  "structure": [
    {
      "id": "s1",
      "title": "Section Title",
      "content": "Section content text",
      "tasks": [
        {
          "id": "t1",
          "text": "Task description",
          "granularity": "broad" | "fine",
          "steps": ["step 1", "step 2"],
          "priority": "high" | "medium" | "low" | null,
          "dependencies": ["t2", "t3"]
        }
      ],
      "children": [
        {
          "id": "s1-1",
          "title": "Subsection Title",
          "content": "Subsection content",
          "tasks": [],
          "children": []
        }
      ]
    }
  ],
  "ambiguousSegments": [
    {
      "text": "Unclear text segment",
      "locationHint": "Section where it appears"
    }
  ],
  "contradictions": [
    {
      "segments": ["Statement 1", "Statement 2"],
      "note": "Explanation of contradiction"
    }
  ],
  "exports": {
    "markdown": "# Markdown export...",
    "html": "<h1>HTML export...</h1>",
    "plainText": "Plain text export..."
  },
  "modelUsed": "gpt-4-turbo-preview",
  "cached": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "processedAt": "2024-01-15T10:30:15.000Z"
}
```

**Errors:**

- `400` - Revision not ready (still processing)
- `401` - Unauthorized
- `404` - Revision not found
- `500` - Server error

---

### Export Revision

Download a revision in a specific format.

**Endpoint:** `GET /api/v1/notes/:revisionId/export`

**Authentication:** Required

**URL Parameters:**

- `revisionId` (string, required) - UUID of the revision

**Query Parameters:**

- `format` (string, required) - Export format: `markdown`, `html`, or `text`

**Response:** `200 OK`

```
Content-Type: text/plain

[Exported content in requested format]
```

**Example:**

```
GET /api/v1/notes/550e8400-e29b-41d4-a716-446655440000/export?format=markdown
```

**Errors:**

- `400` - Invalid format or revision not ready
- `401` - Unauthorized
- `404` - Revision not found
- `500` - Server error

---

### List User Notes

Get a list of all notes for a user.

**Endpoint:** `GET /api/v1/notes`

**Authentication:** Required

**Query Parameters:**

- `userId` (string, optional) - User ID (defaults to authenticated user)

**Response:** `200 OK`

```json
[
  {
    "revisionId": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Note Title",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "status": "done",
    "cached": false
  },
  {
    "revisionId": "660e8400-e29b-41d4-a716-446655440001",
    "title": "Another Note",
    "createdAt": "2024-01-14T15:20:00.000Z",
    "status": "processing",
    "cached": true
  }
]
```

**Errors:**

- `401` - Unauthorized
- `500` - Server error

---

### Invalidate Cache

Clear all cached AI responses (admin only).

**Endpoint:** `POST /api/v1/cache/invalidate`

**Authentication:** Required (admin)

**Response:** `200 OK`

```json
{
  "message": "Cache invalidated successfully"
}
```

**Errors:**

- `401` - Unauthorized
- `500` - Server error

---

## Error Response Format

All errors follow a consistent format:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": {
    "additionalInfo": "value"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid request data
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Missing or invalid authentication
- `INTERNAL_ERROR` - Server error

---

## Rate Limiting

Currently not implemented in POC. For production:

- Recommended: 100 requests/minute per user
- Cache results to reduce API calls
- Use webhooks for job completion (future feature)

---

## Webhooks (Future Feature)

Planned support for webhook notifications:

```json
POST <your-webhook-url>
{
  "event": "revision.completed",
  "revisionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "done",
  "timestamp": "2024-01-15T10:30:15.000Z"
}
```

---

## SDK/Client Libraries

### JavaScript/TypeScript

```typescript
import { apiClient } from '@note-automation/client';

// Create note
const { revisionId } = await apiClient.createNote({
  rawText: 'My note content',
  options: { tone: 'professional' },
});

// Poll status
const status = await apiClient.getStatus(revisionId);

// Get result
if (status.status === 'done') {
  const result = await apiClient.getResult(revisionId);
}
```

### cURL Examples

**Create Note:**

```bash
curl -X POST http://localhost:4000/api/v1/notes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "rawText": "My note content",
    "options": {
      "tone": "professional",
      "useCached": true
    }
  }'
```

**Get Status:**

```bash
curl -X GET http://localhost:4000/api/v1/notes/<revisionId>/status \
  -H "Authorization: Bearer <token>"
```

**Export:**

```bash
curl -X GET "http://localhost:4000/api/v1/notes/<revisionId>/export?format=markdown" \
  -H "Authorization: Bearer <token>" \
  -o note.md
```

---

## Performance Tips

1. **Enable Caching**: Set `useCached: true` to reuse previous results
2. **Batch Operations**: Group multiple note creations
3. **Polling Strategy**: Use exponential backoff when checking status
4. **Connection Pooling**: Reuse HTTP connections
5. **Compression**: Enable gzip compression in production

---

## Changelog

### v1.0.0 (Current)

- Initial release
- Basic CRUD operations
- AI-powered note transformation
- Caching support
- Multi-format exports

### Future Plans

- Batch operations
- Webhooks
- GraphQL API
- Real-time updates via WebSockets
- Advanced search and filtering
