import { Injectable } from '@angular/core';
import { GoogleGenAI } from '@google/genai';
import { environment } from '../../environments/environment';

export interface TimesheetDay {
  day: number;
  startTime: string | null;
  endTime: string | null;
  basicHours: number;
  overtimeHours: number;
  totalHours: number;
  confidence: number;
  remarks: string | null;
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
  private ai = new GoogleGenAI({
    apiKey: environment.GEMINI_API_KEY,
  });

  async extractTimesheet(
    file: File,
    workerName?: string,
    projectSite?: string,
    month?: number,
    year?: number,
  ): Promise<ExtractedTimesheet> {
    const base64 = await this.fileToBase64(file);

    const prompt = `
You are extracting working hours from a handwritten construction worker timecard.

IMPORTANT:
Ignore the printed column headings such as "Qty", "Site No.", and "Amount".
For this application, the handwritten values in each date row represent working-time information.

For each visible date row, interpret handwritten values from left to right as:

1. Day of month
2. Start time
3. End time
4. Overtime hours, if a fourth handwritten numeric value is present

Example:

16 | 8 | 9 | 4

means:

day = 16
startTime = 08:00
endTime = 21:00
overtimeHours = 4

TIME INTERPRETATION RULES:

- A start time such as 8 normally means 08:00.
- A handwritten end time such as 9 normally means 21:00, NOT 09:00,
  when the row represents a normal full working shift.
- A handwritten end time such as 7 normally means 19:00.
- "1pm" means 13:00.
- Use normal construction-shift context when determining AM/PM.
- Prefer an interpretation that produces a plausible working shift,
  normally around 8 to 14 elapsed hours.
- Do not interpret 8 -> 9 as a 1 hour shift unless the image clearly shows that.

TOTAL HOURS CALCULATION:

Calculate totalHours from startTime and endTime.

For a normal working day:

totalHours = elapsedHours - 1 hour lunch break

Example:

08:00 -> 21:00
elapsedHours = 13
lunchBreak = 1
totalHours = 12

OVERTIME RULES:

Normal basic working hours = 8 hours.

If overtime is handwritten in the fourth position:
- extract the handwritten value as overtimeHours
- also calculate totalHours independently from startTime and endTime
- use the overtime value as a consistency check

Example:

8 | 9 | 4

means:

08:00 -> 21:00
elapsed = 13 hours
minus 1 hour lunch
totalHours = 12
basicHours = 8
overtimeHours = 4

If overtime is NOT handwritten:
calculate it yourself as:

overtimeHours = max(totalHours - 8, 0)

Example:

16 | 8 | 9

should become:

day = 16
startTime = 08:00
endTime = 21:00
totalHours = 12
overtimeHours = 4

OFF DAY RULES:

If the row contains:
- off
- OFF
- a dash together with "off"
- or clearly indicates the worker did not work

then return:

startTime = null
endTime = null
totalHours = 0
overtimeHours = 0
remarks = "OFF"

Do not interpret "off" as a time.

IMAGE LAYOUT RULES:

- Read values only from the same horizontal date row.
- Do not confuse inspector signatures with times.
- Do not confuse names or vertically written notes with times.
- Do not use values from neighbouring rows.
- The timecard may have dates split into two sections,
  for example 16-25 on the left and 26-31 on the right.
- Treat both sections as one continuous set of daily records.

ACCURACY RULES:

- Do not invent unreadable values.
- If a value is unclear but reasonably identifiable, return the most likely value
  and lower confidence.
- If the value cannot be determined reliably, use null where allowed.
- Explain meaningful uncertainty briefly in remarks.

Confidence guide:

0.98 = very clear
0.85 = readable with minor ambiguity
0.60 = uncertain
0.30 = highly uncertain

Return only structured JSON matching the supplied schema.
`;

    const interaction = await this.ai.interactions.create({
      model: 'gemini-3.6-flash',

      input: [
        {
          type: 'text',
          text: prompt,
        },
        {
          type: 'image',
          data: base64,
          mime_type: 'image/jpeg',
        },
      ],

      response_format: {
        type: 'text',
        mime_type: 'application/json',

        schema: {
          type: 'object',

          properties: {
            entries: {
              type: 'array',

              items: {
                type: 'object',

                properties: {
                  day: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 31,
                  },

                  totalHours: {
                    type: 'number',
                    minimum: 0,
                  },

                  confidence: {
                    type: 'number',
                    minimum: 0,
                    maximum: 1,
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
        max_output_tokens: 2048,
      },
    });
    return JSON.parse(interaction.output_text) as ExtractedTimesheet;
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;

        // result looks like:
        // data:image/jpeg;base64,/9j/4AAQ...

        const base64 = result.split(',')[1];

        resolve(base64);
      };

      reader.onerror = (error) => reject(error);

      reader.readAsDataURL(file);
    });
  }
}
