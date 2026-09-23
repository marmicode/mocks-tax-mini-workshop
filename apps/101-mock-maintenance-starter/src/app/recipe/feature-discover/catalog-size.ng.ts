import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { normalizeIngredientName } from './ingredient-name';

interface CatalogStats {
  recipeCount: number;
  ingredientCount: number;
}

@Component({
  selector: 'wm-catalog-size',
  template: `
    <h2>Our catalog</h2>
    @if (stats.hasValue()) {
      @if (stats.value(); as stats) {
        <p class="banner" data-testid="catalog-size">
          {{ plural(stats.recipeCount, 'recipe') }}
        </p>
        <p class="wm-muted" data-testid="ingredient-count">
          Using {{ plural(stats.ingredientCount, 'distinct ingredient') }}.
        </p>
      } @else {
        <p class="empty" data-testid="no-recipes-message">
          The catalog is empty.
        </p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .banner {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-display-medium);
      margin: 1rem 0;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class CatalogSize {
  private _recipeRepository = inject(RecipeRepository);

  stats = rxResource({
    stream: () =>
      this._recipeRepository
        .search(createRecipeSearchParams())
        .pipe(map(computeStats)),
  });

  plural(count: number, noun: string): string {
    return `${count} ${noun}${count === 1 ? '' : 's'}`;
  }
}

function computeStats(recipes: Recipe[]): CatalogStats | null {
  if (recipes.length === 0) {
    return null;
  }
  const ingredients = new Set(
    recipes.flatMap((recipe) =>
      recipe.ingredients.map(({ name }) => normalizeIngredientName(name)),
    ),
  );
  return { recipeCount: recipes.length, ingredientCount: ingredients.size };
}
