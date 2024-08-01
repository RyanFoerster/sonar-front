import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectAccountComponent } from './project-account.component';

describe('ProjectAccountComponent', () => {
  let component: ProjectAccountComponent;
  let fixture: ComponentFixture<ProjectAccountComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectAccountComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
