import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PontoConnectComponent } from './ponto-connect.component';

describe('PontoConnectComponent', () => {
  let component: PontoConnectComponent;
  let fixture: ComponentFixture<PontoConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PontoConnectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PontoConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
