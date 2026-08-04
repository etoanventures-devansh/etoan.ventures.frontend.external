import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EtoanInvoiceComponent } from './etoan-invoice.component';

describe('EtoanInvoiceComponent', () => {
  let component: EtoanInvoiceComponent;
  let fixture: ComponentFixture<EtoanInvoiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EtoanInvoiceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EtoanInvoiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
