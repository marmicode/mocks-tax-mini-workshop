import { Component, effect, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { RecentlyViewed, UserFavorites } from '@whiskmate/recipe/domain';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Ingredient } from '@whiskmate/shared-recipe/model';
import { recipeDetailRouterHelper } from './recipe-detail.router-helper';
import { SimilarRecipes } from './similar-recipes.ng';

@Component({
  selector: 'wm-recipe-detail',
  imports: [MatIcon, MatIconButton, RouterLink, SimilarRecipes],
  template: `
    @if (recipe.status() === 'resolved') {
      @if (recipe.value(); as recipe) {
        <article>
          <section class="hero">
            <img
              class="picture"
              [src]="recipe.pictureUri"
              [alt]="recipe.name"
            />
            <div class="summary">
              <p class="course wm-chip" data-testid="recipe-course">
                {{ recipe.course }}
              </p>
              <header>
                <h2 data-testid="recipe-name">{{ recipe.name }}</h2>
                <button
                  type="button"
                  mat-icon-button
                  [attr.aria-pressed]="isFavorite()"
                  [attr.aria-label]="
                    isFavorite() ? 'Remove from favorites' : 'Add to favorites'
                  "
                  (click)="onToggleFavorite()"
                >
                  <mat-icon>{{
                    isFavorite() ? 'favorite' : 'favorite_border'
                  }}</mat-icon>
                </button>
              </header>
              @if (recipe.description) {
                <p class="description" data-testid="recipe-description">
                  {{ recipe.description }}
                </p>
              }
              <dl class="facts">
                <div>
                  <dt>Ingredients</dt>
                  <dd>{{ recipe.ingredients.length }}</dd>
                </div>
                <div>
                  <dt>Steps</dt>
                  <dd>{{ recipe.steps.length }}</dd>
                </div>
              </dl>
              <nav class="wm-toolbar">
                <a
                  class="wm-button wm-button-primary cook"
                  [routerLink]="cookLink()"
                  >Start cooking</a
                >
                <a
                  class="wm-button wm-button-outlined scale"
                  [routerLink]="scaleLink()"
                  >Scale servings</a
                >
              </nav>
            </div>
          </section>
          <div class="details">
            <section class="wm-surface">
              <h3>Ingredients</h3>
              <ul class="ingredients">
                @for (ingredient of recipe.ingredients; track $index) {
                  <li data-testid="ingredient">
                    {{ formatIngredient(ingredient) }}
                  </li>
                }
              </ul>
            </section>
            <section class="wm-surface">
              <h3>Steps</h3>
              <ol class="steps">
                @for (step of recipe.steps; track $index) {
                  <li data-testid="step">{{ step }}</li>
                }
              </ol>
            </section>
          </div>
          <wm-similar-recipes [recipe]="recipe" />
        </article>
      } @else {
        <div class="not-found">
          <mat-icon>search_off</mat-icon>
          <p data-testid="recipe-not-found">This recipe does not exist.</p>
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    article {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .hero {
      display: grid;
      gap: 2rem;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }

    @media (max-width: 800px) {
      .hero {
        grid-template-columns: 1fr;
      }
    }

    .picture {
      aspect-ratio: 4 / 3;
      border-radius: 20px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 4px 16px rgb(0 0 0 / 10%);
      object-fit: cover;
      width: 100%;
    }

    .summary {
      align-items: flex-start;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      justify-content: center;
    }

    .course {
      margin: 0;
      text-transform: capitalize;
    }

    header {
      align-items: center;
      display: flex;
      gap: 0.5rem;
    }

    h2 {
      font: var(--mat-sys-display-small);
      margin: 0;
    }

    .description {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
      margin: 0;
    }

    .facts {
      display: flex;
      gap: 2rem;
      margin: 0.5rem 0;

      div {
        display: flex;
        flex-direction: column-reverse;
      }

      dt {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-label-medium);
        text-transform: uppercase;
      }

      dd {
        font: var(--mat-sys-headline-medium);
        margin: 0;
      }
    }

    .cook::before,
    .scale::before {
      font-family: 'Material Icons';
      font-size: 18px;
      margin-right: 0.25rem;
    }

    .cook::before {
      content: 'play_arrow';
    }

    .scale::before {
      content: 'tune';
    }

    .details {
      align-items: start;
      display: grid;
      gap: 1.5rem;
      grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
    }

    @media (max-width: 800px) {
      .details {
        grid-template-columns: 1fr;
      }
    }

    h3 {
      margin-top: 0.25rem;
    }

    .ingredients {
      list-style: none;
      margin: 0;
      padding: 0;

      li {
        border-bottom: 1px solid var(--mat-sys-outline-variant);
        padding: 0.6rem 0;
      }

      li:last-child {
        border-bottom: none;
      }
    }

    .steps {
      counter-reset: step;
      list-style: none;
      margin: 0;
      padding: 0;

      li {
        counter-increment: step;
        display: flex;
        gap: 1rem;
        line-height: 1.5;
        padding: 0.6rem 0;
      }

      li::before {
        align-items: center;
        background: var(--mat-sys-primary-container);
        border-radius: 50%;
        color: var(--mat-sys-on-primary-container);
        content: counter(step);
        display: flex;
        flex-shrink: 0;
        font: var(--mat-sys-label-large);
        height: 28px;
        justify-content: center;
        width: 28px;
      }
    }

    button[aria-pressed='true'] mat-icon {
      color: #c2185b;
    }

    .not-found {
      align-items: center;
      color: var(--mat-sys-on-surface-variant);
      display: flex;
      flex-direction: column;
      padding: 3rem;

      mat-icon {
        font-size: 48px;
        height: 48px;
        width: 48px;
      }
    }
  `,
})
export class RecipeDetail {
  recipeId = input.required<string>();

  private _recipeRepository = inject(RecipeRepository);
  private _userFavorites = inject(UserFavorites);
  private _recentlyViewed = inject(RecentlyViewed);

  recipe = rxResource({
    params: () => ({ id: this.recipeId() }),
    stream: ({ params }) => this._recipeRepository.findById(params),
  });

  constructor() {
    effect(() => {
      const recipe = this.recipe.value();
      if (recipe != null) {
        this._recentlyViewed.track(recipe.id);
      }
    });
  }

  isFavorite(): boolean {
    return this._userFavorites.favoriteIds().has(this.recipeId());
  }

  cookLink(): string[] {
    return recipeDetailRouterHelper.cook(this.recipeId());
  }

  scaleLink(): string[] {
    return recipeDetailRouterHelper.scale(this.recipeId());
  }

  formatIngredient({ quantity, name }: Ingredient): string {
    if (quantity == null) {
      return name;
    }

    return [quantity.amount, quantity.unit, name].filter(Boolean).join(' ');
  }

  onToggleFavorite(): void {
    if (this.isFavorite()) {
      this._userFavorites.removeFavorite(this.recipeId());
    } else {
      this._userFavorites.addFavorite(this.recipeId());
    }
  }
}
