import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditVolunteerComponent } from './edit-volunteer.component';

describe('EditVolunteerComponent', () => {
  let component: EditVolunteerComponent;
  let fixture: ComponentFixture<EditVolunteerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditVolunteerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditVolunteerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
