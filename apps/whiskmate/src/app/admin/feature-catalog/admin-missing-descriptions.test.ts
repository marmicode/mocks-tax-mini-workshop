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
import { AdminMissingDescriptions } from './admin-missing-descriptions.ng';

describe(AdminMissingDescriptions, () => {
  it('searches all recipes', async () => {
    mountAdminMissingDescriptions({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .build(),
        recipeMother.withBasicInfo('Shakshuka').withManyIngredients().build(),
        recipeMother.withBasicInfo('Hummus with Ful').withManySteps().build(),
      ],
    });

    await expect
      .element(page.getByTestId('missing-description-summary'))
      .toHaveTextContent('3 of 3 recipes');
    await expect
      .poll(() => rowTexts('missing-description-row'))
      .toEqual([
        'Hummus with Ful',
        'Lemon and Ricotta Cheesecake',
        'Shakshuka',
      ]);
  });

  it('shows an empty state when every recipe has a description', async () => {
    mountAdminMissingDescriptions({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Shakshuka',
            description: 'Eggs poached in a spiced tomato sauce.',
          })
          .build(),
      ],
    });

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('Every recipe has a description.');
  });

  it('lists recipes with a null description', async () => {
    mountAdminMissingDescriptions({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Tahini and Halva Brownies',
          })
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('missing-description-row'))
      .toEqual(['Tahini and Halva Brownies']);
  });

  it('treats blank descriptions as missing and sorts by name', async () => {
    mountAdminMissingDescriptions({
      recipes: [
        recipeMother
          .withBasicInfo({ name: 'Shakshuka', description: '   ' })
          .build(),
        recipeMother
          .withBasicInfo({
            name: 'Courgette Fritters',
            description: '',
          })
          .build(),
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
            description: 'Creamy hummus.',
          })
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('missing-description-row'))
      .toEqual(['Courgette Fritters', 'Shakshuka']);
  });

  it('summarizes how many recipes miss a description', async () => {
    mountAdminMissingDescriptions({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Hummus with Ful',
            description: 'Creamy hummus.',
          })
          .build(),
        recipeMother.withBasicInfo('Shakshuka').build(),
      ],
    });

    await expect
      .element(page.getByTestId('missing-description-summary'))
      .toHaveTextContent('1 of 2 recipes');
  });
});

function mountAdminMissingDescriptions({
  recipes = [],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AdminMissingDescriptions);
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
