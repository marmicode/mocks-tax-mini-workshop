import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { normalizeIngredientName } from './ingredient-name';

interface PantryMatch {
  recipe: Recipe;
  matchCount: number;
  missingIngredients: string[];
}

@Component({
  selector: 'wm-pantry',
  imports: [MatFormField, MatIcon, MatInput, MatLabel, RouterLink],
  template: `
    <h2>What can I cook?</h2>
    <p class="wm-muted intro">
      Type the ingredients you have and press Enter: we'll find the recipes
      you're closest to cooking.
    </p>
    <mat-form-field appearance="outline" subscriptSizing="dynamic">
      <mat-label>Add an ingredient I have</mat-label>
      <input
        #ingredientInput
        matInput
        (keydown.enter)="
          addItem(ingredientInput.value); ingredientInput.value = ''
        "
      />
    </mat-form-field>
    <div class="items">
      @for (item of items(); track item) {
        <button
          type="button"
          class="item"
          [attr.aria-label]="'Remove ' + item"
          (click)="removeItem(item)"
        >
          {{ item }} <mat-icon inline>close</mat-icon>
        </button>
      }
    </div>
    @if (items().length === 0) {
      <p class="empty" data-testid="pantry-hint">
        Add the ingredients you have to find matching recipes.
      </p>
    } @else if (recipes.hasValue()) {
      <ol class="matches">
        @for (match of matches(); track match.recipe.id) {
          <li data-testid="pantry-match">
            <img [src]="match.recipe.pictureUri" alt="" />
            <div class="match">
              <div class="match-header">
                <a [routerLink]="detailRoute(match.recipe.id)">{{
                  match.recipe.name
                }}</a>
                <span data-testid="match-count">
                  {{ match.matchCount }}/{{ match.recipe.ingredients.length }}
                  ingredients
                </span>
              </div>
              <div
                class="meter"
                [style.--ratio]="
                  match.matchCount / match.recipe.ingredients.length
                "
              ></div>
              @if (match.missingIngredients.length > 0) {
                <p class="missing" data-testid="missing-ingredients">
                  Missing: {{ match.missingIngredients.join(', ') }}
                </p>
              }
            </div>
          </li>
        } @empty {
          <p data-testid="no-match-message">
            No recipe uses these ingredients.
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

    .intro {
      margin-top: -0.5rem;
    }

    mat-form-field {
      max-width: 400px;
      width: 100%;
    }

    .items {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin: 1rem 0 1.5rem;
    }

    .item {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      height: 32px;
      padding: 0 0.6rem 0 0.9rem;

      mat-icon {
        font-size: 16px;
        height: 16px;
        width: 16px;
      }
    }

    .matches {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      align-items: center;
      background: var(--mat-sys-surface);
      border-radius: 16px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 2px 8px rgb(0 0 0 / 6%);
      display: flex;
      gap: 1rem;
      padding: 0.75rem;
    }

    img {
      border-radius: 12px;
      flex-shrink: 0;
      height: 80px;
      object-fit: cover;
      width: 112px;
    }

    .match {
      display: flex;
      flex: 1;
      flex-direction: column;
      gap: 0.4rem;
      min-width: 0;
    }

    .match-header {
      align-items: baseline;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      justify-content: space-between;
    }

    .match-header a {
      color: var(--mat-sys-on-surface);
      font: var(--mat-sys-title-medium);
    }

    [data-testid='match-count'] {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-label-large);
    }

    .meter {
      background: var(--mat-sys-surface-container-high);
      border-radius: 999px;
      height: 6px;
      overflow: hidden;
      position: relative;

      &::after {
        background: var(--mat-sys-primary);
        content: '';
        inset: 0;
        position: absolute;
        transform: scaleX(var(--ratio));
        transform-origin: left;
      }
    }

    .missing {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-small);
      margin: 0;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 2rem;
      text-align: center;
    }
  `,
})
export class Pantry {
  items = signal<string[]>([]);

  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () =>
      this._recipeRepository.search({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
      }),
  });

  matches = computed<PantryMatch[]>(() => {
    const recipes = this.recipes.hasValue() ? this.recipes.value() : [];
    const items = this.items();

    return recipes
      .map((recipe) => {
        const ingredientNames = recipe.ingredients.map((ingredient) =>
          normalizeIngredientName(ingredient.name),
        );
        const missingIngredients = ingredientNames.filter(
          (name) => !items.some((item) => name.includes(item)),
        );
        return {
          recipe,
          matchCount: ingredientNames.length - missingIngredients.length,
          missingIngredients,
        };
      })
      .filter(({ matchCount }) => matchCount > 0)
      .sort(
        (a, b) =>
          b.matchCount - a.matchCount ||
          a.missingIngredients.length - b.missingIngredients.length,
      );
  });

  addItem(value: string): void {
    const item = value.trim().toLowerCase();
    if (item === '' || this.items().includes(item)) {
      return;
    }
    this.items.update((items) => [...items, item]);
  }

  removeItem(item: string): void {
    this.items.update((items) => items.filter((other) => other !== item));
  }

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
