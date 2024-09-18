import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersEventsComponent } from './users-events.component';

describe('UsersEventsComponent', () => {
  let component: UsersEventsComponent;
  let fixture: ComponentFixture<UsersEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsersEventsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UsersEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
