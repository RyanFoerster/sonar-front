import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventInvitationComponent } from './event-invitation.component';

describe('EventInvitationComponent', () => {
  let component: EventInvitationComponent;
  let fixture: ComponentFixture<EventInvitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventInvitationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventInvitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
