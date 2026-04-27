import { TestBed } from '@angular/core/testing';

import { EtoanHttpServiceService } from './etoan-http-service.service';

describe('EtoanHttpServiceService', () => {
  let service: EtoanHttpServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EtoanHttpServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
