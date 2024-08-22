import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeNewUsersComponent } from './home-new-users.component';

describe('HomeNewUsersComponent', () => {
  let component: HomeNewUsersComponent;
  let fixture: ComponentFixture<HomeNewUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeNewUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeNewUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
