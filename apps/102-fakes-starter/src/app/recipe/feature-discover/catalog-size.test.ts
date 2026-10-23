import { TestBed } from '@angular/core/testing';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { CatalogSize } from './catalog-size.ng';

const hummus = recipeMother
  .withBasicInfo('Hummus with Ful')
  .withIngredients([{ name: '400g chickpeas' }, { name: 'tahini' }])
  .build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .withIngredients([{ name: '2 aubergines' }, { name: 'Tahini' }])
  .build();

describe(CatalogSize.name, () => {
  it('shows the number of recipes', async () => {
    const { fixture } = mountCatalogSize({ recipes: [hummus, salad] });
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'catalog-size')).toBe('2 recipes');
  });

  it('uses the singular for a single recipe', async () => {
    const { fixture } = mountCatalogSize({ recipes: [hummus] });
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'catalog-size')).toBe('1 recipe');
  });

  it('counts distinct ingredients', async () => {
    const { fixture } = mountCatalogSize({ recipes: [hummus, salad] });
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'ingredient-count')).toBe(
      'Using 3 distinct ingredients.',
    );
  });

  it('shows a message when the catalog is empty', async () => {
    const { fixture } = mountCatalogSize({ recipes: [] });
    await fixture.whenStable();

    expect(textOf(fixture.nativeElement, 'no-recipes-message')).toBe(
      'The catalog is empty.',
    );
  });
});

function mountCatalogSize({
  recipes = [hummus, salad],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(CatalogSize);

  return { fixture };
}

function textOf(root: HTMLElement, testId: string): string | undefined {
  return root.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim();
}
