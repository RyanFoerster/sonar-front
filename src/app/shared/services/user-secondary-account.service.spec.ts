import { TestBed } from '@angular/core/testing';

import { UserSecondaryAccountService } from './user-secondary-account.service';

describe('UserSecondaryAccountService', () => {
  let service: UserSecondaryAccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserSecondaryAccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
