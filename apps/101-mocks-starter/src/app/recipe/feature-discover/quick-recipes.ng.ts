import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatCheckbox } from '@angular/material/checkbox';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { RecipePreview } from '@whiskmate/recipe/ui';
import { Catalog } from '@whiskmate/shared/ui';

const MAX_STEP_COUNT = 5;
const MAX_INGREDIENT_COUNT = 6;

@Component({
  selector: 'wm-quick-recipes',
  imports: [Catalog, MatCheckbox, RecipePreview],
  template: `
    <h2>Ready in a few steps</h2>
    <div class="wm-toolbar options">
      <p class="wm-muted">Recipes with at most ${MAX_STEP_COUNT} steps.</p>
      <mat-checkbox
        [checked]="fewIngredients()"
        (change)="fewIngredients.set($event.checked)"
      >
        At most ${MAX_INGREDIENT_COUNT} ingredients
      </mat-checkbox>
    </div>
    <wm-catalog>
      @if (recipes.hasValue()) {
        @for (recipe of recipes.value(); track recipe.id) {
          <wm-recipe-preview
            [recipe]="recipe"
            [link]="detailRoute(recipe.id)"
          />
        } @empty {
          <p class="empty" data-testid="no-recipes-message">
            No quick recipes found.
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

    .options {
      justify-content: space-between;
      margin: 0;

      p {
        margin: 0;
      }
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
export class QuickRecipes {
  fewIngredients = signal(false);

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    params: () => this.fewIngredients(),
    stream: ({ params: fewIngredients }) =>
      this._recipeRepository.search({
        keywords: '',
        maxIngredientCount: fewIngredients ? MAX_INGREDIENT_COUNT : null,
        maxStepCount: MAX_STEP_COUNT,
      }),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
