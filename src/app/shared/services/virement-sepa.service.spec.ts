import { TestBed } from '@angular/core/testing';

import { VirementSepaService } from './virement-sepa.service';

describe('VirementSepaService', () => {
  let service: VirementSepaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VirementSepaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
