import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { BlockUIModule } from 'primeng/blockui';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { EtoanSandboxService } from './store/sandbox/etoan-sandbox';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [
    HeaderComponent,
    BlockUIModule,
    ProgressSpinnerModule,
    AsyncPipe,
    RouterOutlet,
  ],
})
export class AppComponent {
  title = 'Etoan-Ventures-Frontend-External';

  constructor(public sandbox: EtoanSandboxService) {}
}
