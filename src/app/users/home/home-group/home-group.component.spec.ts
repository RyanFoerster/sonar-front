import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomeGroupComponent } from './home-group.component';

describe('HomeGroupComponent', () => {
  let component: HomeGroupComponent;
  let fixture: ComponentFixture<HomeGroupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeGroupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomeGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
