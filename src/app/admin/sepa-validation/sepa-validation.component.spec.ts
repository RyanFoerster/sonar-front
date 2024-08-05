import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SepaValidationComponent } from './sepa-validation.component';

describe('SepaValidationComponent', () => {
  let component: SepaValidationComponent;
  let fixture: ComponentFixture<SepaValidationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SepaValidationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SepaValidationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
