import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimecardRecordsComponent } from './timecard-records.component';

describe('TimecardRecordsComponent', () => {
  let component: TimecardRecordsComponent;
  let fixture: ComponentFixture<TimecardRecordsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimecardRecordsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimecardRecordsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
