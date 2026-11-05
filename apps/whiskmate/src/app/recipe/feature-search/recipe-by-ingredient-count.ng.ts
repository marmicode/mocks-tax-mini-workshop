import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { RecipePreview } from '@whiskmate/recipe/ui';
import { Catalog } from '@whiskmate/shared/ui';

const INGREDIENT_COUNT_OPTIONS = [3, 5, 8] as const;

@Component({
  selector: 'wm-recipe-by-ingredient-count',
  imports: [Catalog, RecipePreview],
  template: `
    <h2>Search by ingredient count</h2>
    <div class="wm-toolbar" role="group" aria-label="Maximum ingredients">
      @for (count of options; track count) {
        <button
          type="button"
          class="wm-button-outlined"
          [attr.aria-pressed]="count === maxIngredientCount()"
          (click)="maxIngredientCount.set(count)"
        >
          At most {{ count }} ingredients
        </button>
      }
    </div>
    @if (recipes.hasValue()) {
      <p class="wm-muted" data-testid="recipe-count">
        {{ recipes.value().length }} recipes with at most
        {{ maxIngredientCount() }} ingredients
      </p>
      <wm-catalog>
        @for (recipe of recipes.value(); track recipe.id) {
          <wm-recipe-preview
            [recipe]="recipe"
            [link]="detailRoute(recipe.id)"
          />
        }
      </wm-catalog>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    button[aria-pressed='true'] {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
    }
  `,
})
export class RecipeByIngredientCount {
  protected readonly options = INGREDIENT_COUNT_OPTIONS;

  maxIngredientCount = signal<number>(5);

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    params: () => this.maxIngredientCount(),
    stream: ({ params: maxIngredientCount }) =>
      this._recipeRepository.search(
        createRecipeSearchParams({ maxIngredientCount }),
      ),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
