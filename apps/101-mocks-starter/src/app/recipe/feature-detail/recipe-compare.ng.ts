import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeDetailRouterHelper } from './recipe-detail.router-helper';

@Component({
  selector: 'wm-recipe-compare',
  template: `
    <h2>Compare recipes</h2>
    <div class="pickers wm-surface">
      <label>
        Left recipe
        <select (change)="onPick('left', $event)">
          <option value="" [selected]="!left()">Pick a recipe</option>
          @for (recipe of recipes(); track recipe.id) {
            <option [value]="recipe.id" [selected]="recipe.id === left()">
              {{ recipe.name }}
            </option>
          }
        </select>
      </label>
      <label>
        Right recipe
        <select (change)="onPick('right', $event)">
          <option value="" [selected]="!right()">Pick a recipe</option>
          @for (recipe of recipes(); track recipe.id) {
            <option [value]="recipe.id" [selected]="recipe.id === right()">
              {{ recipe.name }}
            </option>
          }
        </select>
      </label>
    </div>
    @if (leftRecipe(); as leftRecipe) {
      @if (rightRecipe(); as rightRecipe) {
        <table>
          <thead>
            <tr>
              <th></th>
              <th data-testid="left-name">
                <img [src]="leftRecipe.pictureUri" alt="" />
                {{ leftRecipe.name }}
              </th>
              <th data-testid="right-name">
                <img [src]="rightRecipe.pictureUri" alt="" />
                {{ rightRecipe.name }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr data-testid="course-row">
              <th>Course</th>
              <td>{{ leftRecipe.course }}</td>
              <td>{{ rightRecipe.course }}</td>
            </tr>
            <tr data-testid="ingredient-count-row">
              <th>Ingredients</th>
              <td>{{ leftRecipe.ingredients.length }}</td>
              <td>{{ rightRecipe.ingredients.length }}</td>
            </tr>
            <tr data-testid="step-count-row">
              <th>Steps</th>
              <td>{{ leftRecipe.steps.length }}</td>
              <td>{{ rightRecipe.steps.length }}</td>
            </tr>
          </tbody>
        </table>
        <h3>Shared ingredients</h3>
        @if (sharedIngredients().length === 0) {
          <p class="wm-muted" data-testid="no-shared-ingredients">
            No shared ingredients.
          </p>
        } @else {
          <ul class="shared">
            @for (ingredient of sharedIngredients(); track ingredient) {
              <li class="wm-chip" data-testid="shared-ingredient">
                {{ ingredient }}
              </li>
            }
          </ul>
        }
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .pickers {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      margin-bottom: 1.5rem;
    }

    label {
      color: var(--mat-sys-on-surface-variant);
      display: flex;
      flex-direction: column;
      font: var(--mat-sys-label-large);
      gap: 0.4rem;
    }

    table {
      table-layout: fixed;
    }

    thead th {
      background: var(--mat-sys-surface);
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-title-medium);
      vertical-align: top;

      img {
        aspect-ratio: 16 / 9;
        border-radius: 12px;
        display: block;
        margin-bottom: 0.5rem;
        max-height: 180px;
        object-fit: cover;
        width: 100%;
      }
    }

    thead th:first-child {
      width: 140px;
    }

    td {
      font: var(--mat-sys-title-medium);
      text-transform: capitalize;
    }

    .shared {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      list-style: none;
      padding: 0;
    }
  `,
})
export class RecipeCompare {
  left = input<string>();
  right = input<string>();

  private _recipeRepository = inject(RecipeRepository);
  private _router = inject(Router);

  private _recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  private _leftRecipe = rxResource({
    params: () => this.left(),
    stream: ({ params }) => this._findRecipe(params),
  });

  private _rightRecipe = rxResource({
    params: () => this.right(),
    stream: ({ params }) => this._findRecipe(params),
  });

  recipes = computed(() =>
    this._recipes.hasValue() ? this._recipes.value() : [],
  );

  leftRecipe = computed(() =>
    this._leftRecipe.hasValue() ? this._leftRecipe.value() : undefined,
  );

  rightRecipe = computed(() =>
    this._rightRecipe.hasValue() ? this._rightRecipe.value() : undefined,
  );

  sharedIngredients = computed(() => {
    const leftRecipe = this.leftRecipe();
    const rightRecipe = this.rightRecipe();
    if (leftRecipe == null || rightRecipe == null) {
      return [];
    }

    const rightNames = new Set(ingredientNames(rightRecipe));
    return ingredientNames(leftRecipe).filter((name) => rightNames.has(name));
  });

  onPick(side: 'left' | 'right', event: Event): void {
    const recipeId = (event.target as HTMLSelectElement).value || null;
    this._router.navigate(recipeDetailRouterHelper.compare(), {
      queryParams: { [side]: recipeId },
      queryParamsHandling: 'merge',
    });
  }

  private _findRecipe(id: string | undefined) {
    return id ? this._recipeRepository.findById({ id }) : of(undefined);
  }
}

function ingredientNames(recipe: Recipe): string[] {
  return [
    ...new Set(
      recipe.ingredients.map((ingredient) => ingredient.name.toLowerCase()),
    ),
  ];
}
