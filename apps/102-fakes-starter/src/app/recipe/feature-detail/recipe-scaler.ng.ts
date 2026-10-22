import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Ingredient } from '@whiskmate/shared-recipe/model';
import { recipeDetailRouterHelper } from './recipe-detail.router-helper';

/**
 * Catalog recipes are written for 4 servings.
 */
const BASE_SERVINGS = 4;

@Component({
  selector: 'wm-recipe-scaler',
  imports: [MatFormField, MatInput, MatLabel, RouterLink],
  template: `
    @if (recipe.status() === 'resolved') {
      @if (recipe.value(); as recipe) {
        <div class="wm-toolbar heading">
          <h2>Scale {{ recipe.name }}</h2>
          <a class="wm-button wm-button-outlined" [routerLink]="detailLink()"
            >Back to recipe</a
          >
        </div>
        <div class="layout">
          <section class="wm-surface controls">
            <img [src]="recipe.pictureUri" [alt]="recipe.name" />
            <p class="wm-muted">
              Recipes are written for {{ baseServings }} servings.
            </p>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-label>Servings</mat-label>
              <input
                matInput
                type="number"
                min="1"
                [value]="servings()"
                (input)="onServingsChange($event)"
              />
            </mat-form-field>
          </section>
          <section class="wm-surface">
            <h3>Ingredients for {{ servings() }} servings</h3>
            <ul>
              @for (ingredient of recipe.ingredients; track $index) {
                <li data-testid="scaled-ingredient">
                  {{ formatScaledIngredient(ingredient) }}
                </li>
              }
            </ul>
          </section>
        </div>
      } @else {
        <p data-testid="recipe-not-found">This recipe does not exist.</p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .heading {
      justify-content: space-between;

      h2 {
        margin: 0;
      }
    }

    .layout {
      align-items: start;
      display: grid;
      gap: 1.5rem;
      grid-template-columns: minmax(240px, 1fr) minmax(0, 2fr);
    }

    @media (max-width: 800px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }

    .controls {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;

      img {
        aspect-ratio: 4 / 3;
        border-radius: 12px;
        object-fit: cover;
        width: 100%;
      }

      p {
        margin: 0;
      }
    }

    h3 {
      margin-top: 0.25rem;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      padding: 0.6rem 0;
    }

    li:last-child {
      border-bottom: none;
    }
  `,
})
export class RecipeScaler {
  recipeId = input.required<string>();

  readonly baseServings = BASE_SERVINGS;

  servings = signal(BASE_SERVINGS);

  private _recipeRepository = inject(RecipeRepository);

  recipe = rxResource({
    params: () => ({ id: this.recipeId() }),
    stream: ({ params }) => this._recipeRepository.findById(params),
  });

  detailLink(): string[] {
    return recipeDetailRouterHelper.detail(this.recipeId());
  }

  formatScaledIngredient({ quantity, name }: Ingredient): string {
    if (quantity == null) {
      return name;
    }

    const amount =
      Math.round(((quantity.amount * this.servings()) / BASE_SERVINGS) * 10) /
      10;
    return [amount, quantity.unit, name].filter(Boolean).join(' ');
  }

  onServingsChange(event: Event): void {
    const servings = Number((event.target as HTMLInputElement).value);
    if (servings > 0) {
      this.servings.set(servings);
    }
  }
}
