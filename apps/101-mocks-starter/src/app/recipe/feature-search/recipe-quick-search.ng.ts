import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';

const MIN_KEYWORDS_LENGTH = 2;
const MAX_SUGGESTIONS = 5;

@Component({
  selector: 'wm-recipe-quick-search',
  imports: [RouterLink],
  template: `
    <input
      type="search"
      placeholder="Quick search…"
      aria-label="Quick search"
      [value]="keywords()"
      (input)="onKeywordsChange($event)"
    />
    @if (suggestions(); as suggestions) {
      <ul class="suggestions">
        @for (recipe of suggestions; track recipe.id) {
          <li>
            <a
              data-testid="quick-search-suggestion"
              [routerLink]="detailLink(recipe.id)"
              (click)="clear()"
              >{{ recipe.name }}</a
            >
          </li>
        } @empty {
          <li data-testid="quick-search-empty">No recipes found</li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }

    input {
      background: rgb(255 255 255 / 14%);
      border: none;
      border-radius: 999px;
      box-sizing: border-box;
      color: white;
      font: inherit;
      height: 36px;
      padding: 0 1rem;
      width: 220px;

      &::placeholder {
        color: rgb(255 255 255 / 70%);
      }

      &::-webkit-search-cancel-button {
        display: none;
      }

      &:focus {
        background: rgb(255 255 255 / 22%);
        outline: 2px solid rgb(255 255 255 / 50%);
      }
    }

    .suggestions {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
      list-style: none;
      margin: 0.25rem 0 0;
      min-width: 100%;
      padding: 0.25rem 0;
      position: absolute;
      right: 0;
      text-align: left;
      white-space: nowrap;
      z-index: 10;
    }

    li {
      color: #380030;
      padding: 0.5rem 1rem;
    }

    a {
      color: #380030;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }
  `,
})
export class RecipeQuickSearch {
  keywords = signal('');

  private _recipeRepository = inject(RecipeRepository);

  private _recipes = rxResource({
    params: () => {
      const keywords = this.keywords().trim();
      return keywords.length >= MIN_KEYWORDS_LENGTH ? keywords : undefined;
    },
    stream: ({ params: keywords }) =>
      this._recipeRepository.search(createRecipeSearchParams({ keywords })),
  });

  /**
   * Null while there is nothing to suggest (e.g. keywords are too short).
   */
  suggestions = computed(() =>
    this._recipes.hasValue()
      ? this._recipes.value().slice(0, MAX_SUGGESTIONS)
      : null,
  );

  detailLink(recipeId: string): string[] {
    return recipeDetailRouterHelper.detail(recipeId);
  }

  onKeywordsChange(event: Event): void {
    this.keywords.set((event.target as HTMLInputElement).value);
  }

  clear(): void {
    this.keywords.set('');
  }
}
