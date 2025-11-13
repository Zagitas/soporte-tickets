import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TicketKanbanComponent } from './ticket-kanban.component';

describe('TicketKanbanComponent', () => {
  let component: TicketKanbanComponent;
  let fixture: ComponentFixture<TicketKanbanComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TicketKanbanComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TicketKanbanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
