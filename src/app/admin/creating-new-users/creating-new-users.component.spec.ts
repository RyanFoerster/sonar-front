import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatingNewUsersComponent } from './creating-new-users.component';

describe('CreatingNewUsersComponent', () => {
  let component: CreatingNewUsersComponent;
  let fixture: ComponentFixture<CreatingNewUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatingNewUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatingNewUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
