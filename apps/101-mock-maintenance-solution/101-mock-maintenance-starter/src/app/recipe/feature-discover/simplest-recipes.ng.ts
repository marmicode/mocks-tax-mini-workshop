import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';

const SIMPLEST_COUNT = 5;

@Component({
  selector: 'wm-simplest-recipes',
  imports: [RouterLink],
  template: `
    <h2>Simplest recipes</h2>
    <p class="wm-muted">
      The ${SIMPLEST_COUNT} recipes with the fewest ingredients.
    </p>
    @if (recipes.hasValue()) {
      <ol>
        @for (recipe of recipes.value(); track recipe.id) {
          <li data-testid="simple-recipe">
            <a
              data-testid="recipe-name"
              [routerLink]="detailRoute(recipe.id)"
              >{{ recipe.name }}</a
            >
            <span data-testid="ingredient-count"
              >{{ recipe.ingredients.length }} ingredients</span
            >
          </li>
        } @empty {
          <p class="empty" data-testid="no-recipes-message">
            No recipes found.
          </p>
        }
      </ol>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    li {
      display: flex;
      gap: 1rem;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    span {
      color: var(--mat-sys-on-surface-variant);
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class SimplestRecipes {
  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () =>
      this._recipeRepository
        .search(createRecipeSearchParams())
        .pipe(map(simplest)),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}

function simplest(recipes: Recipe[]): Recipe[] {
  return [...recipes]
    .sort(
      (a, b) =>
        a.ingredients.length - b.ingredients.length ||
        a.name.localeCompare(b.name),
    )
    .slice(0, SIMPLEST_COUNT);
}
