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
import { AdminLongNames } from './admin-long-names.ng';

describe(AdminLongNames, () => {
  it('searches all recipes', async () => {
    mountAdminLongNames({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake with Honey',
            course: 'dessert',
          })
          .build(),
        recipeMother
          .withBasicInfo('Slow-Roasted Lamb Shoulder with Pomegranate')
          .withManyIngredients()
          .build(),
        recipeMother
          .withBasicInfo('Burnt Aubergine Salad with Pomegranate')
          .withManySteps()
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('long-name-row'))
      .toEqual([
        'Slow-Roasted Lamb Shoulder with Pomegranate (43)',
        'Lemon and Ricotta Cheesecake with Honey (39)',
        'Burnt Aubergine Salad with Pomegranate (38)',
      ]);
  });

  it('shows an empty state when every name is short enough', async () => {
    mountAdminLongNames({
      recipes: [recipeMother.withBasicInfo('Shakshuka').build()],
    });

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('Every name fits within 30 characters.');
  });

  it('lists names longer than 30 characters by default', async () => {
    mountAdminLongNames({
      recipes: [
        recipeMother
          .withBasicInfo('Slow-Roasted Lamb Shoulder with Pomegranate')
          .build(),
        recipeMother.withBasicInfo('Hummus with Ful').build(),
      ],
    });

    await expect
      .poll(() => rowTexts('long-name-row'))
      .toEqual(['Slow-Roasted Lamb Shoulder with Pomegranate (43)']);
  });

  it('sorts the longest names first', async () => {
    mountAdminLongNames({
      recipes: [
        recipeMother
          .withBasicInfo('Tahini and Halva Brownies with Sea Salt')
          .build(),
        recipeMother
          .withBasicInfo('Slow-Roasted Lamb Shoulder with Pomegranate')
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('long-name-row'))
      .toEqual([
        'Slow-Roasted Lamb Shoulder with Pomegranate (43)',
        'Tahini and Halva Brownies with Sea Salt (39)',
      ]);
  });

  it('applies a custom max length', async () => {
    mountAdminLongNames({
      recipes: [
        recipeMother.withBasicInfo('Hummus with Ful').build(),
        recipeMother.withBasicInfo('Shakshuka').build(),
      ],
    });

    await page.getByLabelText('Max length').fill('10');

    await expect
      .poll(() => rowTexts('long-name-row'))
      .toEqual(['Hummus with Ful (15)']);
  });
});

function mountAdminLongNames({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AdminLongNames);
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
