import { Component, computed, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeDetailRouterHelper } from './recipe-detail.router-helper';

const MAX_SIMILAR_RECIPES = 3;

@Component({
  selector: 'wm-similar-recipes',
  imports: [RouterLink],
  template: `
    @if (similarRecipes().length > 0) {
      <h3>More {{ recipe().course }}s you might like</h3>
      <ul>
        @for (similar of similarRecipes(); track similar.id) {
          <li>
            <img [src]="similar.pictureUri" [alt]="similar.name" />
            <a
              data-testid="similar-recipe"
              [routerLink]="detailLink(similar.id)"
              >{{ similar.name }}</a
            >
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    ul {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      background: var(--mat-sys-surface);
      border-radius: 16px;
      box-shadow:
        0 1px 2px rgb(0 0 0 / 8%),
        0 2px 8px rgb(0 0 0 / 6%);
      overflow: hidden;
      position: relative;
    }

    img {
      aspect-ratio: 16 / 9;
      display: block;
      object-fit: cover;
      width: 100%;
    }

    a {
      color: var(--mat-sys-on-surface);
      display: block;
      font: var(--mat-sys-title-small);
      padding: 0.75rem 1rem;

      /* Makes the whole card clickable. */
      &::after {
        content: '';
        inset: 0;
        position: absolute;
      }
    }
  `,
})
export class SimilarRecipes {
  recipe = input.required<Recipe>();

  private _recipeRepository = inject(RecipeRepository);

  private _sameCourseRecipes = rxResource({
    params: () => ({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [this.recipe().course],
    }),
    stream: ({ params }) => this._recipeRepository.search(params),
  });

  similarRecipes = computed(() => {
    if (!this._sameCourseRecipes.hasValue()) {
      return [];
    }

    return this._sameCourseRecipes
      .value()
      .filter((similar) => similar.id !== this.recipe().id)
      .slice(0, MAX_SIMILAR_RECIPES);
  });

  detailLink(recipeId: string): string[] {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
