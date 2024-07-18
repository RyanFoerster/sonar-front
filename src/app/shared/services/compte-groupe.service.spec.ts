import { TestBed } from '@angular/core/testing';

import { CompteGroupeService } from './compte-groupe.service';

describe('CompteGroupeService', () => {
  let service: CompteGroupeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompteGroupeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
