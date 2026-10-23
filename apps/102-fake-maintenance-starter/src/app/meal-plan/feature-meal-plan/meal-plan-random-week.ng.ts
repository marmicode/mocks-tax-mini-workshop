import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { Router, RouterLink } from '@angular/router';
import { RandomWeekFiller } from '@whiskmate/meal-plan/domain';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import { WEEKDAYS } from '@whiskmate/shared/model';
import { mealPlanRouterHelper } from './meal-plan.router-helper';

@Component({
  selector: 'wm-meal-plan-random-week',
  imports: [MatCheckbox, RouterLink],
  template: `
    <h2>Random week</h2>
    <div class="wm-surface">
      <mat-checkbox
        [checked]="quickOnly()"
        (change)="quickOnly.set($event.checked)"
      >
        Quick recipes only
      </mat-checkbox>
      @if (picks().length === 0) {
        <p data-testid="no-picks" class="wm-muted">
          Nothing to pick: every day is planned or no main is left.
        </p>
      } @else {
        <ul>
          @for (pick of picks(); track pick.weekday) {
            <li data-testid="random-pick">
              <strong>{{ pick.label }}</strong
              ><span class="separator">: </span
              ><span>{{ pick.recipe.name }}</span>
            </li>
          }
        </ul>
      }
      <div class="wm-toolbar">
        <button
          type="button"
          class="wm-button-outlined"
          (click)="randomWeek.reload()"
        >
          Shuffle
        </button>
        @if (picks().length > 0) {
          <button type="button" class="wm-button-primary" (click)="onApply()">
            Apply
          </button>
        }
        <a
          class="wm-button wm-button-outlined"
          [routerLink]="routerHelper.mealPlan()"
          >Back to meal plan</a
        >
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .wm-surface {
      max-width: 640px;
    }

    ul {
      list-style: none;
      margin: 1rem 0;
      padding: 0;
    }

    li {
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 0;
    }

    strong {
      color: var(--mat-sys-primary);
      min-width: 6rem;
    }

    .separator {
      display: none;
    }
  `,
})
export class MealPlanRandomWeek {
  protected readonly routerHelper = mealPlanRouterHelper;

  quickOnly = signal(false);

  private readonly _store = inject(MealPlanStore);
  private readonly _filler = inject(RandomWeekFiller);
  private readonly _router = inject(Router);

  randomWeek = rxResource({
    params: () => ({
      assignments: this._store.assignments(),
      quickOnly: this.quickOnly(),
    }),
    stream: ({ params: { assignments, quickOnly } }) =>
      this._filler.fill(assignments, { quickOnly }),
  });

  picks = computed(() => {
    const suggestions = this.randomWeek.hasValue()
      ? this.randomWeek.value()
      : {};

    return WEEKDAYS.flatMap((weekday) => {
      const recipe = suggestions[weekday];
      return recipe
        ? [
            {
              weekday,
              label: weekday.charAt(0).toUpperCase() + weekday.slice(1),
              recipe,
            },
          ]
        : [];
    });
  });

  async onApply(): Promise<void> {
    for (const { weekday, recipe } of this.picks()) {
      this._store.assign({ weekday, recipeId: recipe.id });
    }
    await this._router.navigate(mealPlanRouterHelper.mealPlan());
  }
}
