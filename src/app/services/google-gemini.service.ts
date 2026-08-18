import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { environment } from '../../environments/environment';

export type TimesheetPeriodHint =
  | 'AUTO'
  | 'FULL_MONTH'
  | 'FIRST_HALF'
  | 'SECOND_HALF';

export type TimesheetDayStatus = 'WORK' | 'OFF' | 'MC' | 'UNKNOWN';

export interface TimesheetDay {
  day: number;
  startTime: string | null;
  endTime: string | null;
  basicHours: number;
  overtimeHours: number;
  totalHours: number;
  confidence: number;
  remarks: string | null;
  status: TimesheetDayStatus;
}

export interface ExtractedTimesheet {
  workerName: string | null;
  projectSite: string | null;
  month: number | null;
  year: number | null;
  entries: TimesheetDay[];
}

@Injectable({
  providedIn: 'root',
})
export class GeminiService {
  readonly modelName = 'gemini-3.6-flash';

  private readonly apiKey = (environment as Record<string, string>)['GEMINI_API_KEY'];

  private readonly ai = new GoogleGenAI({
    apiKey: this.apiKey,
  });

  async extractTimesheet(
    file: File,
    workerName?: string,
    projectSite?: string,
    month?: number,
    year?: number,
    periodHint: TimesheetPeriodHint = 'AUTO',
  ): Promise<ExtractedTimesheet> {
    if (!this.apiKey) {
      throw new Error(
        'GEMINI_API_KEY is missing from the active Angular environment configuration.',
      );
    }

    const base64 = await this.fileToBase64(file);

    const periodInstruction = this.periodInstruction(periodHint, month, year);

    const prompt = `
You are extracting working hours from a handwritten construction worker timecard.

KNOWN CONTEXT
- Worker: ${workerName || 'Unknown'}
- Project site: ${projectSite || 'Unknown'}
- Month: ${month || 'Unknown'}
- Year: ${year || 'Unknown'}
- Card period: ${periodInstruction}

IMPORTANT
Ignore printed headings such as "Qty", "Site No.", "Amount", signatures and unrelated notes.
The handwritten values in each date row represent working-time information.

For every visible date row in the requested card period, return:
- day: day of month
- startTime: 24-hour HH:mm string when readable, otherwise omit it
- endTime: 24-hour HH:mm string when readable, otherwise omit it
- basicHours: normal hours for the day
- overtimeHours: overtime hours for the day
- totalHours: total paid/chargeable hours for the day
- confidence: number from 0 to 1
- remarks: short note only when useful
- status: WORK, OFF, MC, or UNKNOWN

TIME INTERPRETATION
- A start value such as 8 normally means 08:00.
- An end value such as 9 normally means 21:00 when it represents a full construction shift.
- An end value such as 7 normally means 19:00.
- "1pm" means 13:00.
- Prefer the interpretation that creates a plausible shift, usually 8 to 14 elapsed hours.
- Do not interpret 8 -> 9 as a one-hour shift unless the card clearly indicates that.

TOTAL HOURS
For a normal working day, deduct one hour for lunch/break unless the card clearly indicates otherwise.

Example:
08:00 -> 21:00 = 13 elapsed hours - 1 hour break = 12 total hours.

NORMAL / OVERTIME
Normal basic working hours = 8 hours.
- basicHours = min(totalHours, 8)
- overtimeHours = max(totalHours - 8, 0)

If a fourth handwritten numeric value is present after start/end, treat it as written overtime and use it as a consistency check.
Example: 16 | 8 | 9 | 4 means day 16, 08:00 -> 21:00, 12 total hours, 8 basic, 4 overtime.

OFF / MC
If the row says OFF, off, MC, a dash with off, or clearly indicates no work:
- status = OFF or MC
- totalHours = 0
- basicHours = 0
- overtimeHours = 0
- omit startTime/endTime if there is no time.

ACCURACY
- Read values only from the same horizontal date row.
- Do not borrow values from neighbouring rows.
- Do not invent unreadable values.
- If unclear, use status UNKNOWN or omit the unclear field and lower confidence.
- Confidence guide: 0.98 very clear, 0.85 readable, 0.60 uncertain, 0.30 highly uncertain.
- Return each day at most once.
- ${periodInstruction}

Return only JSON matching the supplied schema.
`;

    const interaction = await this.ai.interactions.create({
      model: this.modelName,
      input: [
        {
          type: 'text',
          text: prompt,
        },
        {
          type: 'image',
          data: base64,
          mime_type: file.type || 'image/jpeg',
        },
      ],
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema: {
          type: 'object',
          properties: {
            workerName: { type: 'string' },
            projectSite: { type: 'string' },
            month: { type: 'integer' },
            year: { type: 'integer' },
            entries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  day: { type: 'integer', minimum: 1, maximum: 31 },
                  startTime: { type: 'string' },
                  endTime: { type: 'string' },
                  basicHours: { type: 'number', minimum: 0 },
                  overtimeHours: { type: 'number', minimum: 0 },
                  totalHours: { type: 'number', minimum: 0 },
                  confidence: { type: 'number', minimum: 0, maximum: 1 },
                  remarks: { type: 'string' },
                  status: {
                    type: 'string',
                    enum: ['WORK', 'OFF', 'MC', 'UNKNOWN'],
                  },
                },
                required: ['day', 'totalHours', 'confidence'],
              },
            },
          },
          required: ['entries'],
        },
      },
      generation_config: {
        thinking_level: 'minimal',
        max_output_tokens: 4096,
      },
    });

    const parsed = JSON.parse(interaction.output_text || '{"entries":[]}') as Partial<ExtractedTimesheet>;

    return {
      workerName: parsed.workerName ?? workerName ?? null,
      projectSite: parsed.projectSite ?? projectSite ?? null,
      month: this.toNullableNumber(parsed.month) ?? month ?? null,
      year: this.toNullableNumber(parsed.year) ?? year ?? null,
      entries: Array.isArray(parsed.entries)
        ? parsed.entries
            .map((entry) => this.normalizeEntry(entry))
            .filter((entry): entry is TimesheetDay => entry !== null)
        : [],
    };
  }

  private normalizeEntry(entry: Partial<TimesheetDay>): TimesheetDay | null {
    const day = Number(entry.day);
    if (!Number.isInteger(day) || day < 1 || day > 31) return null;

    const totalHours = this.roundHours(Math.max(0, Number(entry.totalHours || 0)));
    const basicHours = this.roundHours(
      Number.isFinite(Number(entry.basicHours))
        ? Math.max(0, Number(entry.basicHours))
        : Math.min(8, totalHours),
    );
    const overtimeHours = this.roundHours(
      Number.isFinite(Number(entry.overtimeHours))
        ? Math.max(0, Number(entry.overtimeHours))
        : Math.max(0, totalHours - basicHours),
    );

    const remarks = entry.remarks?.trim() || null;
    let status: TimesheetDayStatus =
      entry.status === 'WORK' ||
      entry.status === 'OFF' ||
      entry.status === 'MC' ||
      entry.status === 'UNKNOWN'
        ? entry.status
        : totalHours > 0
          ? 'WORK'
          : remarks?.toUpperCase().includes('MC')
            ? 'MC'
            : remarks?.toUpperCase().includes('OFF')
              ? 'OFF'
              : 'UNKNOWN';

    if ((status === 'OFF' || status === 'MC') && totalHours > 0) {
      status = 'UNKNOWN';
    }

    return {
      day,
      startTime: this.normalizeTime(entry.startTime),
      endTime: this.normalizeTime(entry.endTime),
      basicHours,
      overtimeHours,
      totalHours,
      confidence: Math.max(0, Math.min(1, Number(entry.confidence ?? 0))),
      remarks,
      status,
    };
  }

  private periodInstruction(
    hint: TimesheetPeriodHint,
    month?: number,
    year?: number,
  ): string {
    if (hint === 'FIRST_HALF') {
      return 'This image is the FIRST HALF. Extract only days 1 through 15.';
    }
    if (hint === 'SECOND_HALF') {
      return `This image is the SECOND HALF. Extract only days 16 through the end of ${
        month && year ? `${month}/${year}` : 'the month'
      }.`;
    }
    if (hint === 'FULL_MONTH') {
      return 'This image contains the FULL MONTH. Extract all visible days for the month.';
    }
    return 'Auto-detect whether the image is a full-month card or one half of the month from the visible dates.';
  }

  private normalizeTime(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;

    const match = trimmed.match(/^(\d{1,2})(?::(\d{1,2}))?$/);
    if (!match) return trimmed;

    let hour = Number(match[1]);
    const minute = Number(match[2] ?? 0);
    if (!Number.isFinite(hour) || !Number.isFinite(minute) || minute > 59) return trimmed;

    hour = Math.max(0, Math.min(23, hour));
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }

  private toNullableNumber(value: unknown): number | null {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private roundHours(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };

      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }
}
