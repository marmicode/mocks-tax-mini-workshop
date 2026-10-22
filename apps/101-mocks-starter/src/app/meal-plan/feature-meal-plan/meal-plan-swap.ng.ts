import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import type { Weekday } from '@whiskmate/shared/model';
import { mealPlanRouterHelper } from './meal-plan.router-helper';

@Component({
  selector: 'wm-meal-plan-swap',
  imports: [RouterLink],
  template: `
    <header class="page-header">
      <h2>Swap {{ label() }}'s recipe</h2>
      <a
        class="wm-button wm-button-outlined"
        [routerLink]="routerHelper.mealPlan()"
        >Back to meal plan</a
      >
    </header>
    @if (swap.hasValue()) {
      @if (swap.value(); as value) {
        <p class="current">
          Currently planned:
          <strong data-testid="current-recipe">{{ value.current.name }}</strong>
          <span class="wm-chip">{{ value.current.course }}</span>
        </p>
        @if (value.alternatives.length === 0) {
          <p data-testid="no-alternatives" class="wm-muted">
            No other {{ value.current.course }} to swap with.
          </p>
        } @else {
          <div class="alternatives">
            @for (recipe of value.alternatives; track recipe.id) {
              <article class="alternative">
                <img [src]="recipe.pictureUri" [alt]="recipe.name" />
                <h3 data-testid="alternative-name">{{ recipe.name }}</h3>
                <button
                  type="button"
                  class="wm-button-primary"
                  (click)="onPick(recipe)"
                >
                  Pick {{ recipe.name }}
                </button>
              </article>
            }
          </div>
        }
      } @else {
        <p data-testid="nothing-planned" class="wm-muted">
          Nothing is planned on {{ label() }}.
        </p>
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

    .current {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0 1.5rem;
    }

    .alternatives {
      display: grid;
      gap: 1.25rem;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    }

    .alternative {
      background: var(--mat-sys-surface);
      border-radius: var(--wm-radius, 12px);
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 2px 8px rgb(0 0 0 / 6%);
      display: flex;
      flex-direction: column;
      overflow: hidden;

      img {
        aspect-ratio: 4 / 3;
        object-fit: cover;
        width: 100%;
      }

      h3 {
        font: var(--mat-sys-title-small);
        margin: 0.75rem 1rem;
      }

      button {
        margin: auto 1rem 1rem;
        max-width: calc(100% - 2rem);
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `,
})
export class MealPlanSwap {
  weekday = input.required<Weekday>();

  protected readonly routerHelper = mealPlanRouterHelper;

  private readonly _store = inject(MealPlanStore);
  private readonly _recipeRepository = inject(RecipeRepository);
  private readonly _router = inject(Router);

  label = computed(() => {
    const weekday = this.weekday();
    return weekday.charAt(0).toUpperCase() + weekday.slice(1);
  });

  swap = rxResource({
    params: () => ({
      weekday: this.weekday(),
      assignments: this._store.assignments(),
    }),
    stream: ({ params: { weekday, assignments } }) => {
      const recipeId = assignments[weekday];
      if (recipeId == null) {
        return of(null);
      }

      const plannedIds = new Set(Object.values(assignments));

      return this._recipeRepository.findById({ id: recipeId }).pipe(
        switchMap((current) => {
          if (current == null) {
            return of(null);
          }

          return this._recipeRepository
            .search(createRecipeSearchParams({ courses: [current.course] }))
            .pipe(
              map((recipes) => ({
                current,
                alternatives: recipes.filter(
                  (recipe) => !plannedIds.has(recipe.id),
                ),
              })),
            );
        }),
      );
    },
  });

  async onPick(recipe: Recipe): Promise<void> {
    this._store.assign({ weekday: this.weekday(), recipeId: recipe.id });
    await this._router.navigate(mealPlanRouterHelper.mealPlan());
  }
}
