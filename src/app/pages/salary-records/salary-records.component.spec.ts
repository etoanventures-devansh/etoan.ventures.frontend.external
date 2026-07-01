import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryRecordsComponent } from './salary-records.component';

describe('SalaryRecordsComponent', () => {
  let component: SalaryRecordsComponent;
  let fixture: ComponentFixture<SalaryRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryRecordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalaryRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
