import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { RecipeCatalog } from '@whiskmate/recipe/domain';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import type { Weekday } from '@whiskmate/shared/model';
import { mealPlanRouterHelper } from './meal-plan.router-helper';

@Component({
  selector: 'wm-meal-plan-day-picker',
  imports: [RouterLink],
  template: `
    <header class="page-header">
      <h2>Pick a main for {{ label() }}</h2>
      <a
        class="wm-button wm-button-outlined"
        [routerLink]="routerHelper.mealPlan()"
        >Back to meal plan</a
      >
    </header>
    @if (candidates.hasValue()) {
      @if (candidates.value().length === 0) {
        <p data-testid="no-candidates" class="wm-muted">
          Every main is already planned.
        </p>
      } @else {
        <ul class="candidates">
          @for (recipe of candidates.value(); track recipe.id) {
            <li>
              <img [src]="recipe.pictureUri" [alt]="recipe.name" />
              <span data-testid="candidate-name">{{ recipe.name }}</span>
              <button
                type="button"
                class="wm-button-primary"
                (click)="onPick(recipe)"
              >
                Pick {{ recipe.name }}
              </button>
            </li>
          }
        </ul>
      }
    }
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

      h2 {
        margin: 0;
      }
    }

    .candidates {
      list-style: none;
      margin: 1rem 0;
      max-width: 640px;
      padding: 0;
    }

    li {
      align-items: center;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      display: flex;
      gap: 1rem;
      padding: 0.5rem 0;

      img {
        border-radius: 8px;
        height: 48px;
        object-fit: cover;
        width: 64px;
      }

      span {
        flex: 1;
      }
    }
  `,
})
export class MealPlanDayPicker {
  weekday = input.required<Weekday>();

  protected readonly routerHelper = mealPlanRouterHelper;

  private readonly _store = inject(MealPlanStore);
  private readonly _catalog = inject(RecipeCatalog);
  private readonly _router = inject(Router);

  label = computed(() => {
    const weekday = this.weekday();
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  });

  candidates = rxResource({
    params: () => this._store.assignments(),
    stream: ({ params: assignments }) => {
      const plannedIds = new Set(Object.values(assignments));
      return this._catalog
        .listByCourse('main')
        .pipe(
          map((recipes) =>
            recipes.filter((recipe) => !plannedIds.has(recipe.id)),
          ),
        );
    },
  });

  async onPick(recipe: Recipe): Promise<void> {
    this._store.assign({ weekday: this.weekday(), recipeId: recipe.id });
    await this._router.navigate(mealPlanRouterHelper.mealPlan());
  }
}
