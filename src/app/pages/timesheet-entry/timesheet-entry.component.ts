import { Component } from '@angular/core';
import {
  GeminiService,
  TimesheetDay,
} from '../../services/google-gemini.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-timesheet-entry',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  templateUrl: './timesheet-entry.component.html',
  styleUrl: './timesheet-entry.component.scss',
})
export class TimesheetEntryComponent {
  selectedFile: File | null = null;
  isProcessing = false;

  timesheetEntries: TimesheetDay[] = [];

  constructor(private geminiService: GeminiService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files?.length) {
      return;
    }

    this.selectedFile = input.files[0];
  }

  async extractTimesheet(): Promise<void> {
    if (!this.selectedFile) {
      return;
    }

    try {
      this.isProcessing = true;

      const result = await this.geminiService.extractTimesheet(
        this.selectedFile,
        'Sathish',
        'Project AO',
        6,
        2026,
      );

      console.log('Gemini result:', result);

      this.timesheetEntries = result.entries;
    } catch (error) {
      console.error('Gemini extraction failed', error);
      return;
    } finally {
      this.isProcessing = false;
    }
  }
}
