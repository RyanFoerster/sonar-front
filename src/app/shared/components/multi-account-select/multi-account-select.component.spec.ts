import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiAccountSelectComponent } from './multi-account-select.component';

describe('MultiAccountSelectComponent', () => {
  let component: MultiAccountSelectComponent;
  let fixture: ComponentFixture<MultiAccountSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiAccountSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MultiAccountSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
