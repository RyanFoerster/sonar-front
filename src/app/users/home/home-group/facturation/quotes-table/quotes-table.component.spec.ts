import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuotesTableComponent } from './quotes-table.component';

describe('QuotesTableComponent', () => {
  let component: QuotesTableComponent;
  let fixture: ComponentFixture<QuotesTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuotesTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuotesTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
