import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewCreditNoteComponent } from './new-credit-note.component';

describe('NewCreditNoteComponent', () => {
  let component: NewCreditNoteComponent;
  let fixture: ComponentFixture<NewCreditNoteComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewCreditNoteComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewCreditNoteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
