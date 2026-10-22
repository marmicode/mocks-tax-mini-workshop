import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';

@Component({
  selector: 'wm-picture-gallery',
  imports: [RouterLink],
  template: `
    <h2>Gallery</h2>
    @if (recipes.hasValue()) {
      <div class="gallery">
        @for (recipe of recipes.value(); track recipe.id) {
          <a
            data-testid="gallery-item"
            [routerLink]="detailRoute(recipe.id)"
            [title]="recipe.name"
          >
            <img [src]="recipe.pictureUri" [alt]="recipe.name" />
          </a>
        } @empty {
          <p class="empty" data-testid="no-recipes-message">
            No pictures to show.
          </p>
        }
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    .gallery {
      display: grid;
      gap: 0.5rem;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    }

    img {
      aspect-ratio: 1;
      border-radius: 12px;
      display: block;
      object-fit: cover;
      width: 100%;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      grid-column: 1 / -1;
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class PictureGallery {
  private _recipeRepository = inject(RecipeRepository);

  recipes = rxResource({
    stream: () => this._recipeRepository.search(createRecipeSearchParams()),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}
