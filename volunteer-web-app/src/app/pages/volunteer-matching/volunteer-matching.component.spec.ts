import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VolunteerMatchingComponent } from './volunteer-matching.component';

describe('VolunteerMatchingComponent', () => {
  let component: VolunteerMatchingComponent;
  let fixture: ComponentFixture<VolunteerMatchingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerMatchingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VolunteerMatchingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
