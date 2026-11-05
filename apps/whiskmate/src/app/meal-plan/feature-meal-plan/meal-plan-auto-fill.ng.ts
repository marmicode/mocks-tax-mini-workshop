import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { MealPlanSuggester } from '@whiskmate/meal-plan/domain';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import { WEEKDAYS } from '@whiskmate/shared/model';
import { mealPlanRouterHelper } from './meal-plan.router-helper';

@Component({
  selector: 'wm-meal-plan-auto-fill',
  imports: [RouterLink],
  template: `
    <h2>Auto-fill empty days</h2>
    <div class="wm-surface">
      @if (suggestions().length === 0) {
        <p data-testid="no-suggestions" class="wm-muted">
          Nothing to suggest: every day is planned or no main is left.
        </p>
      } @else {
        <p class="wm-muted">
          We picked a main for every empty day. Apply them to your meal plan?
        </p>
        <ul>
          @for (suggestion of suggestions(); track suggestion.weekday) {
            <li data-testid="suggestion">
              <strong>{{ suggestion.label }}</strong
              ><span class="separator">: </span
              ><span class="recipe">{{ suggestion.recipe.name }}</span>
            </li>
          }
        </ul>
      }
      <div class="wm-toolbar">
        @if (suggestions().length > 0) {
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
      align-items: baseline;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 0;

      &:last-child {
        border-bottom: none;
      }
    }

    strong {
      color: var(--mat-sys-primary);
      min-width: 6rem;
    }

    .separator {
      display: none;
    }

    .wm-toolbar {
      margin: 1rem 0 0;
    }
  `,
})
export class MealPlanAutoFill {
  protected readonly routerHelper = mealPlanRouterHelper;

  private readonly _store = inject(MealPlanStore);
  private readonly _suggester = inject(MealPlanSuggester);
  private readonly _router = inject(Router);

  private readonly _suggestions = rxResource({
    params: () => this._store.assignments(),
    stream: ({ params }) => this._suggester.suggest(params),
  });

  suggestions = computed(() => {
    const suggestions = this._suggestions.hasValue()
      ? this._suggestions.value()
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
    for (const { weekday, recipe } of this.suggestions()) {
      this._store.assign({ weekday, recipeId: recipe.id });
    }
    await this._router.navigate(mealPlanRouterHelper.mealPlan());
  }
}
