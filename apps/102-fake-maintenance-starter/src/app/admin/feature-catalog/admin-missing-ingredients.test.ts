import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { AdminMissingIngredients } from './admin-missing-ingredients.ng';

describe(AdminMissingIngredients, () => {
  it('searches all recipes', async () => {
    const lambShoulder = recipeMother
      .withBasicInfo('Slow-Roasted Lamb Shoulder')
      .withManyIngredients()
      .build();
    mountAdminMissingIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .build(),
        /* Too many ingredients for any quick filter, one of them unnamed. */
        {
          ...lambShoulder,
          ingredients: [...lambShoulder.ingredients, { name: '' }],
        },
        recipeMother.withBasicInfo('Hummus with Ful').withManySteps().build(),
      ],
    });

    await expect
      .poll(() => rowTexts('missing-ingredients-row'))
      .toEqual([
        'Lemon and Ricotta Cheesecake — no ingredients',
        'Slow-Roasted Lamb Shoulder — 1 unnamed ingredient(s)',
        'Hummus with Ful — no ingredients',
      ]);
  });

  it('shows an empty state when every recipe has ingredients', async () => {
    mountAdminMissingIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Shakshuka',
          })
          .withSomeIngredients()
          .build(),
      ],
    });

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('Every recipe has ingredients.');
  });

  it('lists recipes without any ingredient', async () => {
    mountAdminMissingIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Courgette Fritters', course: 'starter' })
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('missing-ingredients-row'))
      .toEqual(['Courgette Fritters — no ingredients']);
  });

  it('lists recipes with unnamed ingredients', async () => {
    mountAdminMissingIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Tahini and Halva Brownies',
          })
          .withIngredients([{ name: 'butter' }, { name: '' }, { name: ' ' }])
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('missing-ingredients-row'))
      .toEqual(['Tahini and Halva Brownies — 2 unnamed ingredient(s)']);
  });

  it('only lists incomplete recipes', async () => {
    mountAdminMissingIngredients({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
          })
          .withSomeIngredients()
          .build(),
        recipeMother
          .withBasicInfo({ name: 'Courgette Fritters', course: 'starter' })
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('missing-ingredients-row'))
      .toEqual(['Courgette Fritters — no ingredients']);
  });
});

function mountAdminMissingIngredients({
  recipes = [],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AdminMissingIngredients);
}

function rowTexts(testId: string) {
  return page.getByTestId(testId).elements().map((row) => rowText(row));
}

function rowText(row: Element) {
  return textOf(row);
}

function textOf(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  }
  if (!(node instanceof Element)) {
    return '';
  }
  return [...node.childNodes]
    .map((child) => textOf(child))
    .filter((text) => text.length > 0)
    .join(' ');
}
