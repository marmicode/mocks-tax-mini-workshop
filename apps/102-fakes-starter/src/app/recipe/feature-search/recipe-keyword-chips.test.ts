import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { provideLocalStorageFake } from '@whiskmate/shared/infra';
import { RecipeKeywordChips } from './recipe-keyword-chips.ng';

const cheesecake = recipeMother
  .withBasicInfo('Lemon and Ricotta Cheesecake')
  .build();

const lentilSoup = recipeMother.withBasicInfo('Red Lentil Soup').build();

const shakshuka = recipeMother.withBasicInfo('Shakshuka').build();

describe(RecipeKeywordChips.name, () => {
  it('shows a chip for each keyword matching the typed prefix', async () => {
    const { fixture } = mountRecipeKeywordChips();
    await fixture.whenStable();

    typeKeywordPrefix(fixture.nativeElement, 'le');
    await fixture.whenStable();

    expect(chipLabels(fixture.nativeElement)).toEqual(['lemon', 'lentil']);
  });

  it('shows the recipes matching the picked keyword', async () => {
    const { fixture } = mountRecipeKeywordChips();
    await fixture.whenStable();

    typeKeywordPrefix(fixture.nativeElement, 'le');
    await fixture.whenStable();
    chipByLabel(fixture.nativeElement, 'lentil').click();
    await fixture.whenStable();

    expect(recipeNames(fixture.nativeElement)).toEqual(['Red Lentil Soup']);
  });

  it('shows a message when the picked keyword matches no recipe anymore', async () => {
    const { fixture, recipeRepositoryFake } = mountRecipeKeywordChips();
    await fixture.whenStable();

    typeKeywordPrefix(fixture.nativeElement, 'ri');
    await fixture.whenStable();
    /* The only "ricotta" recipe is removed meanwhile. */
    recipeRepositoryFake.setRecipes([lentilSoup, shakshuka]);
    chipByLabel(fixture.nativeElement, 'ricotta').click();
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No recipes found for "ricotta"');
  });

  it('shows no chip while the prefix is too short', async () => {
    const { fixture } = mountRecipeKeywordChips();
    await fixture.whenStable();

    typeKeywordPrefix(fixture.nativeElement, 'l');
    await fixture.whenStable();

    expect(chipLabels(fixture.nativeElement)).toEqual([]);
  });
});

function mountRecipeKeywordChips({
  recipes = [cheesecake, lentilSoup, shakshuka],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      provideLocalStorageFake(),
      provideRecipeRepositoryFake(),
    ],
  });

  const recipeRepositoryFake = TestBed.inject(RecipeRepositoryFake);
  recipeRepositoryFake.setRecipes(recipes);

  const fixture = TestBed.createComponent(RecipeKeywordChips);

  return { fixture, recipeRepositoryFake };
}

function typeKeywordPrefix(root: HTMLElement, prefix: string): void {
  const input = root.querySelector<HTMLInputElement>(
    'input[aria-label="Keyword prefix"]',
  );
  if (input == null) {
    throw new Error('Keyword prefix input not found.');
  }
  input.value = prefix;
  input.dispatchEvent(new Event('input'));
}

function chipLabels(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="keyword-chip"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}

function chipByLabel(root: HTMLElement, label: string): HTMLButtonElement {
  const chip = [
    ...root.querySelectorAll<HTMLButtonElement>('[data-testid="keyword-chip"]'),
  ].find((el) => el.textContent?.trim() === label);
  if (chip == null) {
    throw new Error(`Chip "${label}" not found.`);
  }
  return chip;
}

function recipeNames(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="recipe-name"]')].map(
    (el) => el.textContent?.trim() ?? '',
  );
}
