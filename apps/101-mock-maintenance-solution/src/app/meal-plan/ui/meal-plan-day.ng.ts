import { Component, computed, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import type { Weekday } from '@whiskmate/shared/model';

@Component({
  selector: 'wm-meal-plan-day',
  imports: [MatIcon],
  template: `
    <header>
      <span class="day">{{ label() }}</span>
      @if (recipe(); as planned) {
        <span class="wm-chip">{{ planned.course }}</span>
      }
    </header>
    @if (recipe(); as planned) {
      <img class="picture" [src]="planned.pictureUri" [alt]="planned.name" />
      <p class="name">{{ planned.name }}</p>
      <div class="actions">
        <button
          type="button"
          class="wm-button-outlined"
          (click)="remove.emit()"
        >
          Remove
        </button>
        <ng-content select="[data-slot=actions]" />
      </div>
    } @else {
      <div class="empty">
        <mat-icon>restaurant</mat-icon>
        <p>No recipe is planned</p>
      </div>
    }
  `,
  styles: `
    :host {
      background: var(--mat-sys-surface);
      border-radius: var(--wm-radius, 12px);
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 2px 8px rgb(0 0 0 / 6%);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    header {
      align-items: center;
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 1rem;
    }

    .day {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-title-medium);
    }

    .picture {
      aspect-ratio: 4 / 3;
      object-fit: cover;
      width: 100%;
    }

    .name {
      font: var(--mat-sys-title-small);
      margin: 0.75rem 1rem 0;
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: auto;
      padding: 0.75rem 1rem 1rem;
    }

    .empty {
      align-items: center;
      border: 2px dashed var(--mat-sys-outline-variant);
      border-radius: 10px;
      color: var(--mat-sys-on-surface-variant);
      display: flex;
      flex: 1;
      flex-direction: column;
      justify-content: center;
      margin: 0 1rem 1rem;
      min-height: 160px;

      mat-icon {
        font-size: 32px;
        height: 32px;
        opacity: 0.6;
        width: 32px;
      }

      p {
        margin: 0.5rem 0 0;
      }
    }
  `,
})
export class MealPlanDay {
  weekday = input.required<Weekday>();
  recipe = input.required<Recipe | null>();
  remove = output<void>();

  label = computed(() => {
    const weekday = this.weekday();
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  });
}
