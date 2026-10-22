import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map, of } from 'rxjs';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { MealPlanDay } from '@whiskmate/meal-plan/ui';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { WEEKDAYS, type Weekday } from '@whiskmate/shared/model';
import { mealPlanRouterHelper } from './meal-plan.router-helper';

@Component({
  selector: 'wm-meal-plan',
  imports: [MatIcon, MealPlanDay, RouterLink],
  template: `
    <header class="page-header">
      <h2>Meal plan</h2>
      <nav class="wm-toolbar">
        <a class="wm-button" [routerLink]="routerHelper.autoFill()">
          <mat-icon>auto_awesome</mat-icon>
          Auto-fill empty days
        </a>
        <a
          class="wm-button wm-button-outlined"
          [routerLink]="routerHelper.share()"
        >
          <mat-icon>share</mat-icon>
          Share
        </a>
      </nav>
    </header>
    <div class="week">
      @for (day of days(); track day.weekday) {
        <wm-meal-plan-day
          [weekday]="day.weekday"
          [recipe]="day.recipe"
          (remove)="onRemove(day.weekday)"
        >
          @if (day.recipe) {
            <a
              class="wm-button swap"
              data-slot="actions"
              [routerLink]="routerHelper.swap(day.weekday)"
              >Swap</a
            >
          }
        </wm-meal-plan-day>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .page-header {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: space-between;
      margin-bottom: 0.5rem;

      h2,
      .wm-toolbar {
        margin: 0;
      }
    }

    .wm-toolbar mat-icon {
      font-size: 18px;
      height: 18px;
      width: 18px;
    }

    .week {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      margin-top: 1.25rem;
    }
  `,
})
export class MealPlan {
  protected readonly routerHelper = mealPlanRouterHelper;

  private readonly _store = inject(MealPlanStore);
  private readonly _recipeRepository = inject(RecipeRepository);

  private readonly _resolvedDays = rxResource({
    params: () => this._store.assignments(),
    stream: ({ params }) =>
      forkJoin(
        WEEKDAYS.map((weekday) => {
          const recipeId = params[weekday];
          if (recipeId == null) {
            return of({ weekday, recipe: null as Recipe | null });
          }

          return this._recipeRepository.findById({ id: recipeId }).pipe(
            map((recipe) => ({
              weekday,
              recipe: recipe ?? null,
            })),
          );
        }),
      ),
  });

  days = computed(() => {
    if (this._resolvedDays.hasValue()) {
      return this._resolvedDays.value();
    }

    return WEEKDAYS.map((weekday) => ({
      weekday,
      recipe: null as Recipe | null,
    }));
  });

  onRemove(weekday: Weekday): void {
    this._store.clear({ weekday });
  }
}
