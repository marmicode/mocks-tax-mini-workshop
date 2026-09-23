import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import {
  createRecipeSearchParams,
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import {
  createDefaultRecipeFilterCriteria,
  type RecipeFilterCriteria,
} from '@whiskmate/recipe/model';
import { RecipePreview } from '@whiskmate/recipe/ui';
import { NoRecipes, RecipeFilter } from '@whiskmate/recipe/ui-search';
import { Catalog } from '@whiskmate/shared/ui';

@Component({
  selector: 'wm-recipe-search',
  imports: [Catalog, NoRecipes, RecipeFilter, RecipePreview],
  template: `
    <wm-recipe-filter (filterChange)="filter.set($event)" />
    <wm-catalog>
      @if (recipes.hasValue()) {
        @if (recipes.value().length === 0) {
          <wm-no-recipes />
        } @else {
          @for (recipe of recipes.value(); track recipe.id) {
            <wm-recipe-preview [recipe]="recipe" />
          }
        }
      }
    </wm-catalog>
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }
  `,
})
export class RecipeSearch {
  filter = signal<RecipeFilterCriteria>(createDefaultRecipeFilterCriteria());

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    params: () => toRecipeSearchParams(this.filter()),
    stream: ({ params }) => this._recipeRepository.search(params),
  });
}

function toRecipeSearchParams({
  keywords,
  maxIngredientCount,
  maxStepCount,
  courses,
}: RecipeFilterCriteria): RecipeSearchParams {
  return createRecipeSearchParams({
    keywords,
    maxIngredientCount,
    maxStepCount,
    ...(courses != null ? { courses } : {}),
  });
}
