import { Component, input, output, signal } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import type { Weekday } from '@whiskmate/shared/model';
import { Card, WeekdayPicker } from '@whiskmate/shared/ui';

@Component({
  selector: 'wm-recipe-preview',
  imports: [Card, MatIcon, MatIconButton, RouterLink, WeekdayPicker],
  template: `<wm-card
    [pictureUri]="recipe().pictureUri"
    [pictureAlt]="recipe().name"
  >
    <span class="course">{{ recipe().course }}</span>
    <div class="recipe-header">
      <h2 data-testid="recipe-name">
        @if (link(); as link) {
          <a [routerLink]="link">{{ recipe().name }}</a>
        } @else {
          {{ recipe().name }}
        }
      </h2>
      <button
        type="button"
        mat-icon-button
        data-testid="recipe-like-button"
        [attr.aria-pressed]="favorite()"
        [attr.aria-label]="
          favorite() ? 'Remove from favorites' : 'Add to favorites'
        "
        (click)="toggleFavorite.emit()"
      >
        <mat-icon>{{ favorite() ? 'favorite' : 'favorite_border' }}</mat-icon>
      </button>
    </div>
    <div class="actions">
      <button type="button" [disabled]="!canAdd()" (click)="onAddToMealPlan()">
        Add to meal plan
      </button>
    </div>
    @if (pickerOpen()) {
      <wm-weekday-picker
        (select)="onWeekday($event)"
        (dismissed)="pickerOpen.set(false)"
      />
    }
  </wm-card>`,
  styles: `
    .course {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-medium);
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }

    .recipe-header {
      align-items: flex-start;
      display: flex;
      gap: 0.25rem;
      justify-content: space-between;
    }

    h2 {
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 2;
      display: -webkit-box;
      font: var(--mat-sys-title-medium);
      line-height: 1.3;
      margin: 0;
      min-height: 2.6em;
      overflow: hidden;
    }

    h2 a {
      color: inherit;
      text-decoration: none;

      &:hover {
        color: var(--mat-sys-primary);
      }
    }

    button[mat-icon-button] {
      flex-shrink: 0;
      margin: -0.5rem -0.5rem 0 0;
    }

    button[aria-pressed='true'] mat-icon {
      color: #c2185b;
    }

    .actions {
      margin-top: auto;
    }
  `,
})
export class RecipePreview {
  recipe = input.required<Recipe>();
  favorite = input(false);
  canAdd = input(true);
  link = input<string[] | null>(null);

  toggleFavorite = output<void>();
  addToMealPlan = output<Weekday>();

  pickerOpen = signal(false);

  onAddToMealPlan(): void {
    if (!this.canAdd()) {
      return;
    }

    this.pickerOpen.set(true);
  }

  onWeekday(weekday: Weekday): void {
    this.addToMealPlan.emit(weekday);
    this.pickerOpen.set(false);
  }
}
