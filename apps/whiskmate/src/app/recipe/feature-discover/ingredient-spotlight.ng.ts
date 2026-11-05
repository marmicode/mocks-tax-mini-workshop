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
import { RandomAdapter } from '@whiskmate/shared/infra';
import { normalizeIngredientName } from './ingredient-name';

interface Spotlight {
  ingredient: string;
  recipes: Recipe[];
}

@Component({
  selector: 'wm-ingredient-spotlight',
  imports: [RouterLink],
  template: `
    <h2>Ingredient spotlight</h2>
    @if (spotlight.hasValue()) {
      @if (spotlight.value(); as current) {
        <h3 data-testid="spotlight-ingredient">{{ current.ingredient }}</h3>
        <ul>
          @for (recipe of current.recipes; track recipe.id) {
            <li>
              <a
                data-testid="recipe-name"
                [routerLink]="detailRoute(recipe.id)"
                >{{ recipe.name }}</a
              >
            </li>
          }
        </ul>
        <button type="button" (click)="spotlight.reload()">
          Another ingredient
        </button>
      } @else {
        <p class="empty" data-testid="no-recipes-message">
          No ingredient to put in the spotlight.
        </p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    h3 {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-headline-small);
      text-transform: capitalize;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class IngredientSpotlight {
  private _recipeRepository = inject(RecipeRepository);
  private _random = inject(RandomAdapter);

  spotlight = rxResource({
    stream: () =>
      this._recipeRepository
        .search(createRecipeSearchParams())
        .pipe(map((recipes) => this._pickSpotlight(recipes))),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }

  private _pickSpotlight(recipes: Recipe[]): Spotlight | null {
    const ingredients = [
      ...new Set(
        recipes.flatMap((recipe) =>
          recipe.ingredients.map((ingredient) =>
            normalizeIngredientName(ingredient.name),
          ),
        ),
      ),
    ].sort();
    if (ingredients.length === 0) {
      return null;
    }
    const ingredient = this._random.pick(ingredients);
    return {
      ingredient,
      recipes: recipes.filter((recipe) =>
        recipe.ingredients.some(
          ({ name }) => normalizeIngredientName(name) === ingredient,
        ),
      ),
    };
  }
}
