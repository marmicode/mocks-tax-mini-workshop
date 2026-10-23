import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { RecipePreview } from '@whiskmate/recipe/ui';
import { Catalog } from '@whiskmate/shared/ui';

const MAX_INGREDIENT_COUNT = 5;

@Component({
  selector: 'wm-five-ingredient-recipes',
  imports: [Catalog, MatFormField, MatInput, MatLabel, RecipePreview],
  template: `
    <h2>Five ingredients or fewer</h2>
    <mat-form-field>
      <mat-label>Keywords</mat-label>
      <input
        matInput
        data-testid="keywords-input"
        [value]="keywords()"
        (input)="keywords.set($any($event.target).value)"
      />
    </mat-form-field>
    <wm-catalog>
      @if (recipes.hasValue()) {
        @for (recipe of recipes.value(); track recipe.id) {
          <wm-recipe-preview
            [recipe]="recipe"
            [link]="detailRoute(recipe.id)"
          />
        } @empty {
          <p class="empty" data-testid="no-recipes-message">
            No five-ingredient recipes found.
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
      grid-column: 1 / -1;
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class FiveIngredientRecipes {
  keywords = signal('');

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    params: () => this.keywords(),
    stream: ({ params: keywords }) =>
      this._recipeRepository.search(
        createRecipeSearchParams({
          keywords,
          maxIngredientCount: MAX_INGREDIENT_COUNT,
        }),
      ),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
