import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryEntryComponent } from './salary-entry.component';

describe('SalaryEntryComponent', () => {
  let component: SalaryEntryComponent;
  let fixture: ComponentFixture<SalaryEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalaryEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
