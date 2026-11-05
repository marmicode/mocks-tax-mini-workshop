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
import { AdminMissingSteps } from './admin-missing-steps.ng';

describe(AdminMissingSteps, () => {
  it('searches all recipes', async () => {
    mountAdminMissingSteps({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .build(),
        recipeMother.withBasicInfo('Shakshuka').withManyIngredients().build(),
        /* Too many steps for any quick filter, all of them blank. */
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withSteps(['', '', '', '', '', '', '', ''])
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('missing-steps-row'))
      .toEqual([
        'Lemon and Ricotta Cheesecake',
        'Shakshuka',
        'Hummus with Ful (8 blank)',
      ]);
  });

  it('shows an empty state when every recipe has steps', async () => {
    mountAdminMissingSteps({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Shakshuka',
          })
          .withSomeSteps()
          .build(),
      ],
    });

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('Every recipe has steps.');
  });

  it('lists recipes without any step', async () => {
    mountAdminMissingSteps({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
          })
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('missing-steps-row'))
      .toEqual(['Hummus with Ful']);
  });

  it('lists recipes with only blank steps', async () => {
    mountAdminMissingSteps({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Courgette Fritters', course: 'starter' })
          .withSteps(['', '  '])
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('missing-steps-row'))
      .toEqual(['Courgette Fritters (2 blank)']);
  });

  it('ignores recipes with at least one real step', async () => {
    mountAdminMissingSteps({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Tahini and Halva Brownies',
          })
          .withSteps(['', 'Bake.'])
          .build(),
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
          })
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('missing-steps-row'))
      .toEqual(['Hummus with Ful']);
  });
});

function mountAdminMissingSteps({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AdminMissingSteps);
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
