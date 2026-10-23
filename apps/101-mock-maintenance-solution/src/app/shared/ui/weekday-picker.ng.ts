import { Component, output } from '@angular/core';
import { WEEKDAYS, type Weekday } from '@whiskmate/shared/model';

@Component({
  selector: 'wm-weekday-picker',
  template: `
    @for (weekday of weekdays; track weekday) {
      <button type="button" (click)="select.emit(weekday)">
        {{ label(weekday) }}
      </button>
    }
    <button type="button" class="dismiss" (click)="dismissed.emit()">
      Dismiss
    </button>
  `,
  styles: `
    :host {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      padding-top: 0.5rem;
    }

    button {
      font-size: 0.8rem;
      height: 30px;
      padding: 0 0.7rem;
    }

    .dismiss {
      background: transparent;
      box-shadow: inset 0 0 0 1px var(--mat-sys-outline-variant);
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class WeekdayPicker {
  select = output<Weekday>();
  dismissed = output<void>();

  readonly weekdays = WEEKDAYS;

  label(weekday: Weekday): string {
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  }
}
