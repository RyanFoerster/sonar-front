import { TestBed } from '@angular/core/testing';

import { ComptePrincipalService } from './compte-principal.service';

describe('ComptePrincipalService', () => {
  let service: ComptePrincipalService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ComptePrincipalService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
