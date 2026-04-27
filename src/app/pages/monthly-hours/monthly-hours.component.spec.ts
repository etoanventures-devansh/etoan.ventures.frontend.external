import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthlyHoursComponent } from './monthly-hours.component';

describe('MonthlyHoursComponent', () => {
  let component: MonthlyHoursComponent;
  let fixture: ComponentFixture<MonthlyHoursComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyHoursComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthlyHoursComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
