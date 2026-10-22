import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { UserFavorites } from '@whiskmate/recipe/domain';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { RecipePreview } from '@whiskmate/recipe/ui';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Course } from '@whiskmate/shared-recipe/model';
import type { Weekday } from '@whiskmate/shared/model';
import { Catalog } from '@whiskmate/shared/ui';
import { courseLabel } from './course-label';

@Component({
  selector: 'wm-course-browser',
  imports: [Catalog, RecipePreview],
  template: `
    <h2>{{ title() }}</h2>
    <wm-catalog>
      @if (recipes.hasValue()) {
        @for (recipe of recipes.value(); track recipe.id) {
          <wm-recipe-preview
            [recipe]="recipe"
            [link]="detailRoute(recipe.id)"
            [favorite]="isFavorite(recipe.id)"
            [canAdd]="canAdd(recipe.id)"
            (toggleFavorite)="onToggleFavorite(recipe.id)"
            (addToMealPlan)="onAddToMealPlan(recipe.id, $event)"
          />
        } @empty {
          <p class="empty" data-testid="no-recipes-message">
            No recipes in this course yet.
          </p>
        }
      }
    </wm-catalog>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
      grid-column: 1 / -1;
      padding: 3rem;
      text-align: center;

      &::before {
        content: var(--empty-icon, '🍽️');
        display: block;
        font-size: 3rem;
        margin-bottom: 0.5rem;
      }
    }
  `,
})
export class CourseBrowser {
  course = input.required<Course>();

  title = computed(() => courseLabel(this.course()));

  private _recipeRepository = inject(RecipeRepository);
  private _userFavorites = inject(UserFavorites);
  private _mealPlanStore = inject(MealPlanStore);

  recipes = rxResource({
    params: () => this.course(),
    stream: ({ params: course }) =>
      this._recipeRepository.search({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: [course],
      }),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }

  isFavorite(recipeId: string): boolean {
    return this._userFavorites.favoriteIds().has(recipeId);
  }

  canAdd(recipeId: string): boolean {
    return this._mealPlanStore.canAdd({ recipeId });
  }

  onToggleFavorite(recipeId: string): void {
    if (this.isFavorite(recipeId)) {
      this._userFavorites.removeFavorite(recipeId);
    } else {
      this._userFavorites.addFavorite(recipeId);
    }
  }

  onAddToMealPlan(recipeId: string, weekday: Weekday): void {
    this._mealPlanStore.assign({ weekday, recipeId });
  }
}
