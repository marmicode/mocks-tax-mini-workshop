import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { recipeDetailRouterHelper } from '@whiskmate/recipe/feature-detail';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';

interface LetterGroup {
  letter: string;
  recipes: Recipe[];
}

@Component({
  selector: 'wm-alphabetical-index',
  imports: [RouterLink],
  template: `
    <h2>A–Z</h2>
    @if (groups.hasValue()) {
      @for (group of groups.value(); track group.letter) {
        <section data-testid="letter-group">
          <h3 data-testid="letter">{{ group.letter }}</h3>
          <ul>
            @for (recipe of group.recipes; track recipe.id) {
              <li>
                <a
                  data-testid="recipe-name"
                  [routerLink]="detailRoute(recipe.id)"
                  >{{ recipe.name }}</a
                >
              </li>
            }
          </ul>
        </section>
      } @empty {
        <p class="empty" data-testid="no-recipes-message">
          No recipes to index.
        </p>
      }
    }
  `,
  styles: `
    :host {
      display: block;
      padding: 1.5rem;
    }

    h3 {
      border-bottom: 1px solid var(--mat-sys-outline-variant);
      color: var(--mat-sys-primary);
      font: var(--mat-sys-title-large);
      margin: 1.5rem 0 0.5rem;
    }

    ul {
      list-style: none;
      margin: 0;
      padding: 0;
    }

    li {
      padding: 0.25rem 0;
    }

    .empty {
      color: var(--mat-sys-on-surface-variant);
      padding: 3rem;
      text-align: center;
    }
  `,
})
export class AlphabeticalIndex {
  private _recipeRepository = inject(RecipeRepository);

  groups = rxResource({
    stream: () =>
      this._recipeRepository
        .search(createRecipeSearchParams())
        .pipe(map(groupByFirstLetter)),
  });

  detailRoute(recipeId: string) {
    return recipeDetailRouterHelper.detail(recipeId);
  }
}

function groupByFirstLetter(recipes: Recipe[]): LetterGroup[] {
  const groups = new Map<string, Recipe[]>();
  const sorted = [...recipes].sort((a, b) => a.name.localeCompare(b.name));
  for (const recipe of sorted) {
    const letter = firstLetter(recipe.name);
    groups.set(letter, [...(groups.get(letter) ?? []), recipe]);
  }
  return [...groups.entries()]
    .map(([letter, recipes]) => ({ letter, recipes }))
    .sort((a, b) => compareLetters(a.letter, b.letter));
}

function firstLetter(name: string): string {
  const letter = name.trim().charAt(0).toUpperCase();
  return /^[A-Z]$/.test(letter) ? letter : '#';
}

function compareLetters(a: string, b: string): number {
  if (a === '#') return 1;
  if (b === '#') return -1;
  return a.localeCompare(b);
}
