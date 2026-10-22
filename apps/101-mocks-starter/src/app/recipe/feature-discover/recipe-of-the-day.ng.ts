import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { ClockAdapter } from '@whiskmate/shared/infra';

@Component({
  selector: 'wm-recipe-of-the-day',
  imports: [RouterLink],
  template: `
    <h2>Recipe of the day</h2>
    @if (recipe(); as recipe) {
      <article class="hero">
        <img [src]="recipe.pictureUri" [alt]="recipe.name" />
        <div class="info">
          <p class="eyebrow">Today's pick · {{ recipe.course }}</p>
          <h3 data-testid="recipe-name">{{ recipe.name }}</h3>
          @if (recipe.description) {
            <p class="description" data-testid="recipe-description">
              {{ recipe.description }}
            </p>
          }
          <a
            class="wm-button wm-button-primary"
            [routerLink]="detailRoute(recipe.id)"
            >See the recipe</a
          >
        </div>
      </article>
    } @else if (recipes.hasValue()) {
      <p class="empty" data-testid="no-recipes-message">No recipe today.</p>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .hero {
      background: var(--mat-sys-surface);
      border-radius: 20px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 4px 16px rgb(0 0 0 / 8%);
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      overflow: hidden;
    }

    @media (max-width: 800px) {
      .hero {
        grid-template-columns: 1fr;
      }
    }

    .hero img {
      aspect-ratio: 4 / 3;
      display: block;
      height: 100%;
      object-fit: cover;
      width: 100%;
    }

    .info {
      align-items: flex-start;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      justify-content: center;
      padding: 2rem;
    }

    .eyebrow {
      color: var(--mat-sys-primary);
      font: var(--mat-sys-label-large);
      letter-spacing: 0.08em;
      margin: 0;
      text-transform: uppercase;
    }

    h3 {
      font: var(--mat-sys-headline-medium);
      margin: 0;
    }

    .description {
      color: var(--mat-sys-on-surface-variant);
      font: var(--mat-sys-body-large);
      margin: 0;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class RecipeOfTheDay {
  private _recipeRepository = inject(RecipeRepository);
  private _clock = inject(ClockAdapter);

  recipes = rxResource({
    stream: () =>
      this._recipeRepository.search({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
      }),
  });

  recipe = computed(() => {
    const recipes = this.recipes.hasValue() ? this.recipes.value() : [];
    if (recipes.length === 0) {
      return null;
    }
    return recipes[dayOfYear(this._clock.now()) % recipes.length];
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}

function dayOfYear(date: Date): number {
  const startOfYear = Date.UTC(date.getFullYear(), 0, 1);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((today - startOfYear) / 86_400_000) + 1;
}
