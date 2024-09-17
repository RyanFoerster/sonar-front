import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuoteDecisionComponent } from './quote-decision.component';

describe('QuoteDecisionComponent', () => {
  let component: QuoteDecisionComponent;
  let fixture: ComponentFixture<QuoteDecisionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuoteDecisionComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuoteDecisionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
