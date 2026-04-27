import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimecardEntryComponent } from './timecard-entry.component';

describe('TimecardEntryComponent', () => {
  let component: TimecardEntryComponent;
  let fixture: ComponentFixture<TimecardEntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimecardEntryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimecardEntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
