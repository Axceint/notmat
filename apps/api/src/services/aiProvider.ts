import { GoogleGenerativeAI } from '@google/generative-ai';
import { NoteResult, NoteOptions, Task, StructureNode } from '../types/note';
import { logger } from '../utils/logger';
import { buildPrompt, getFewShotExamples } from './promptBuilder';

export interface AIProvider {
  generateNoteStructure(rawText: string, options: NoteOptions): Promise<NoteResult>;
}

class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set');
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.model = process.env.MODEL_NAME || 'gemini-2.5-flash';
    this.temperature = parseFloat(process.env.AI_TEMPERATURE || '0.7');
    this.maxTokens = parseInt(process.env.AI_MAX_TOKENS || '4000');
  }

  private sanitizeAIOutput(result: NoteResult): NoteResult {
    // Sanitize exports to remove AI thinking process markers
    const sanitizeText = (text: string): string => {
      if (!text) return text;

      const lines = text.split('\n');
      const filtered: string[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim().toLowerCase();

        // Skip empty lines for now, we'll add them back if needed
        if (!trimmed) {
          filtered.push(line);
          continue;
        }

        // Pattern 1: Lines that start with instruction verbs (EXPANDED LIST)
        if (
          /^(describe|explain|outline|illustrate|enumerate|identify|summarize|conduct|perform|ensure|complete|analyze|review|assess|evaluate|verify|validate|check|update|modify|add|remove|delete|create|generate|build|implement|fix|resolve|address|handle|discuss|clarify|detail|specify|state|list|define|compare|contrast|examine)\s/i.test(
            trimmed
          )
        ) {
          console.log('[SANITIZE] Removing instruction line:', line);
          continue;
        }

        // Pattern 2: Standalone priority markers
        if (/^(high|medium|low|critical|urgent|priority:\s*(high|medium|low))$/i.test(trimmed)) {
          console.log('[SANITIZE] Removing priority marker:', line);
          continue;
        }

        // Pattern 3: Lines ending with priority markers (any ending)
        if (/(high|medium|low|critical|urgent)$/i.test(trimmed)) {
          console.log('[SANITIZE] Removing line ending with priority:', line);
          continue;
        }

        // Pattern 4: Action instruction lines (Develop and..., Implement and...)
        if (
          /^(develop|execute|implement|establish|maintain|monitor|coordinate|facilitate|design|plan|create|build)\s+(and|or)\s+/i.test(
            trimmed
          )
        ) {
          console.log('[SANITIZE] Removing action instruction line:', line);
          continue;
        }

        // Pattern 5: Task markers
        if (/^(task:|todo:|action:|step:|note:)/i.test(trimmed)) {
          console.log('[SANITIZE] Removing task marker:', line);
          continue;
        }

        filtered.push(line);
      }

      // Clean up excessive blank lines
      let result = filtered.join('\n');
      result = result.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive newlines
      return result.trim();
    };

    // Sanitize all export formats
    if (result.exports) {
      result.exports.markdown = sanitizeText(result.exports.markdown);
      result.exports.html = sanitizeText(result.exports.html);
      result.exports.plainText = sanitizeText(result.exports.plainText);
    }

    // Sanitize structure content and tasks
    if (result.structure) {
      result.structure = result.structure.map((section) => ({
        ...section,
        content: sanitizeText(section.content || ''),
        tasks: section.tasks?.map((task) => ({
          ...task,
          text: sanitizeText(task.text || ''),
          steps: task.steps?.map((step) => sanitizeText(step)),
        })),
        children: section.children?.map((child) => this.sanitizeSectionRecursive(child)),
      }));
    }

    return result;
  }

  private sanitizeSectionRecursive(section: StructureNode): StructureNode {
    const sanitizeText = (text: string): string => {
      if (!text) return text;
      const lines = text.split('\n');
      const filtered = lines.filter((line) => {
        const trimmed = line.trim().toLowerCase();

        // Remove instruction lines (expanded list)
        if (
          /^(describe|explain|outline|illustrate|enumerate|identify|summarize|conduct|perform|ensure|complete|analyze|review|assess|evaluate|verify|validate|check|update|modify|add|remove|delete|create|generate|build|implement|fix|resolve|address|handle|discuss|clarify|detail|specify|state|list|define|compare|contrast|examine)\s/i.test(
            trimmed
          )
        )
          return false;

        // Remove priority markers (any line ending with priority word)
        if (/(high|medium|low|critical|urgent)$/i.test(trimmed)) return false;

        // Remove action instruction lines
        if (
          /^(develop|execute|implement|establish|maintain|monitor|coordinate|facilitate|design|plan|create|build)\s+(and|or)\s+/i.test(
            trimmed
          )
        )
          return false;

        return true;
      });
      return filtered.join('\n').trim();
    };

    return {
      ...section,
      content: sanitizeText(section.content || ''),
      tasks: section.tasks?.map((task: Task) => ({
        ...task,
        text: sanitizeText(task.text || ''),
        steps: task.steps?.map((step: string) => sanitizeText(step)),
      })),
      children: section.children?.map((child: StructureNode) =>
        this.sanitizeSectionRecursive(child)
      ),
    };
  }

  async generateNoteStructure(rawText: string, options: NoteOptions): Promise<NoteResult> {
    try {
      console.log('\n=== [AI PROVIDER] generateNoteStructure START ===');
      console.log('[AI PROVIDER] Input text length:', rawText.length);
      console.log('[AI PROVIDER] Options:', JSON.stringify(options));

      const systemPrompt = buildPrompt(options);
      const fewShot = getFewShotExamples();

      logger.info('Calling Google Gemini API', {
        model: this.model,
        temperature: this.temperature,
        maxTokens: this.maxTokens,
      });

      console.log('[AI PROVIDER] Calling Gemini with model:', this.model);

      const model = this.client.getGenerativeModel({
        model: this.model,
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
          responseMimeType: 'application/json',
        },
      });

      const prompt = `${systemPrompt}\n\n${fewShot}\n\nNow process this note:\n\n${rawText}\n\nRespond with valid JSON only.`;

      const result = await model.generateContent(prompt);
      console.log('[AI PROVIDER] Gemini response received');

      const response = result.response;
      console.log('[AI PROVIDER] Response object:', {
        candidates: response.candidates?.length || 0,
        promptFeedback: response.promptFeedback,
      });

      // Check for safety blocks or other issues
      if (response.promptFeedback?.blockReason) {
        console.log('[AI PROVIDER] ERROR: Content blocked by safety filters');
        console.log('[AI PROVIDER] Block reason:', response.promptFeedback.blockReason);
        throw new Error(`Content blocked: ${response.promptFeedback.blockReason}`);
      }

      const content = response.text();

      if (!content || content.trim() === '') {
        console.log('[AI PROVIDER] ERROR: No response text from Google Gemini');
        console.log('[AI PROVIDER] Full response object:', JSON.stringify(response, null, 2));
        throw new Error('No response from Google Gemini');
      }

      console.log('[AI PROVIDER] Raw response length:', content.length);
      console.log('[AI PROVIDER] Raw response preview:', content.substring(0, 200));

      // Try to parse JSON, with better error handling
      let parsedResult: NoteResult;
      try {
        parsedResult = JSON.parse(content) as NoteResult;
      } catch (parseError) {
        console.log(
          '[AI PROVIDER] ERROR: JSON Parse error:',
          parseError instanceof Error ? parseError.message : parseError
        );
        console.log('[AI PROVIDER] Content length:', content.length);
        console.log('[AI PROVIDER] Content start:', content.substring(0, 500));
        console.log('[AI PROVIDER] Content end:', content.substring(content.length - 500));

        // Check if the response was truncated
        if (!content.trim().endsWith('}')) {
          throw new Error(
            `AI response was truncated. Response length: ${content.length}. Try increasing AI_MAX_TOKENS in .env (current: ${this.maxTokens})`
          );
        }

        throw new Error(
          `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`
        );
      }

      console.log('[AI PROVIDER] Successfully parsed JSON response');
      console.log('[AI PROVIDER] Parsed result structure:', {
        hasMeta: !!parsedResult.meta,
        hasExports: !!parsedResult.exports,
        hasStructure: !!parsedResult.structure,
        structureCount: parsedResult.structure?.length || 0,
        metaKeys: parsedResult.meta ? Object.keys(parsedResult.meta) : [],
        exportKeys: parsedResult.exports ? Object.keys(parsedResult.exports) : [],
        firstStructureNodePreview: parsedResult.structure?.[0]
          ? {
              hasTitle: !!parsedResult.structure[0].title,
              hasTasks: !!parsedResult.structure[0].tasks,
              tasksCount: parsedResult.structure[0].tasks?.length || 0,
            }
          : null,
      });

      // Sanitize the result to remove any AI thinking process that leaked through
      const sanitizedResult = this.sanitizeAIOutput(parsedResult);

      logger.info('Google Gemini response parsed successfully');
      console.log('=== [AI PROVIDER] generateNoteStructure END ===\n');

      return sanitizedResult;
    } catch (error) {
      console.log('[AI PROVIDER] ERROR:', error instanceof Error ? error.message : error);
      logger.error('Google Gemini API error', { error });
      throw error;
    }
  }
}

export function createAIProvider(): AIProvider {
  const apiKey = process.env.GOOGLE_API_KEY;

  // Debug logging
  if (!apiKey) {
    console.error('[AI Provider] GOOGLE_API_KEY is missing!');
    console.error(
      '[AI Provider] Available env keys:',
      Object.keys(process.env).filter((k) => k.includes('GOOGLE') || k.includes('API'))
    );
  } else {
    console.log('[AI Provider] GOOGLE_API_KEY found:', apiKey.substring(0, 10) + '...');
  }

  if (!apiKey || apiKey === '') {
    const errorMsg =
      'GOOGLE_API_KEY is required. Get your free API key at: https://makersuite.google.com/app/apikey';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  logger.info('Using Google Gemini AI provider', {
    model: process.env.MODEL_NAME || 'gemini-2.5-flash',
  });
  return new GeminiProvider();
}
