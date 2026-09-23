import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';

const MAX_STEP_COUNT = 3;

@Component({
  selector: 'wm-three-step-recipes',
  imports: [RouterLink],
  template: `
    <h2>Three steps or fewer</h2>
    @if (recipes.hasValue()) {
      @for (recipe of recipes.value(); track recipe.id) {
        <article data-testid="three-step-recipe">
          <h3>
            <a
              data-testid="recipe-name"
              [routerLink]="detailRoute(recipe.id)"
              >{{ recipe.name }}</a
            >
          </h3>
          <ol>
            @for (step of recipe.steps; track $index) {
              <li data-testid="recipe-step">{{ step }}</li>
            }
          </ol>
        </article>
      } @empty {
        <p class="empty" data-testid="no-recipes-message">
          No three-step recipes found.
        </p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    article {
      background: var(--mat-sys-surface);
      border-radius: 16px;
      box-shadow: 0 1px 2px rgb(0 0 0 / 8%);
      margin-bottom: 1rem;
      padding: 1rem 1.5rem;
    }

    h3 {
      font: var(--mat-sys-title-medium);
      margin: 0 0 0.5rem;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class ThreeStepRecipes {
  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () =>
      this._recipeRepository.search(
        createRecipeSearchParams({ maxStepCount: MAX_STEP_COUNT }),
      ),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
