import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { UserFavorites } from '@whiskmate/recipe/domain';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { RecipePreview } from '@whiskmate/recipe/ui';
import { MealPlanStore } from '@whiskmate/shared-meal-plan/domain';
import type { Weekday } from '@whiskmate/shared/model';
import { Catalog } from '@whiskmate/shared/ui';

@Component({
  selector: 'wm-favorites',
  imports: [Catalog, RecipePreview],
  template: `
    <h2>My favorites</h2>
    <wm-catalog>
      @if (recipes.hasValue()) {
        @for (recipe of favoriteRecipes(); track recipe.id) {
          <wm-recipe-preview
            [recipe]="recipe"
            [link]="detailRoute(recipe.id)"
            [favorite]="true"
            [canAdd]="canAdd(recipe.id)"
            (toggleFavorite)="onRemoveFavorite(recipe.id)"
            (addToMealPlan)="onAddToMealPlan(recipe.id, $event)"
          />
        } @empty {
          <p class="empty" data-testid="no-favorites-message">
            You have no favorite recipes yet.
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
      --empty-icon: '💔';

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
export class Favorites {
  private _recipeRepository = inject(RecipeRepository);
  private _userFavorites = inject(UserFavorites);
  private _mealPlanStore = inject(MealPlanStore);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  favoriteRecipes = computed(() => {
    const favoriteIds = this._userFavorites.favoriteIds();
    const recipes = this.recipes.hasValue() ? this.recipes.value() : [];
    return recipes.filter((recipe) => favoriteIds.has(recipe.id));
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }

  canAdd(recipeId: string): boolean {
    return this._mealPlanStore.canAdd({ recipeId });
  }

  onRemoveFavorite(recipeId: string): void {
    this._userFavorites.removeFavorite(recipeId);
  }

  onAddToMealPlan(recipeId: string, weekday: Weekday): void {
    this._mealPlanStore.assign({ weekday, recipeId });
  }
}
