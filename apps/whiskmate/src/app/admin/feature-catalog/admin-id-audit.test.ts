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
import { AdminIdAudit } from './admin-id-audit.ng';

describe(AdminIdAudit, () => {
  it('searches all recipes', async () => {
    mountAdminIdAudit({
      recipes: [
        recipeMother
          .withBasicInfo({
            name: 'Lemon and Ricotta Cheesecake',
            course: 'dessert',
          })
          .withId('Cheesecake')
          .build(),
        recipeMother
          .withBasicInfo('Shakshuka')
          .withId('Shakshuka')
          .withManyIngredients()
          .build(),
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withId('Hummus')
          .withManySteps()
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('id-audit-row'))
      .toEqual([
        'Cheesecake Not kebab-case lemon-and-ricotta-cheesecake',
        'Shakshuka Not kebab-case shakshuka',
        'Hummus Not kebab-case hummus-with-ful',
      ]);
  });

  it('accepts a kebab-case id matching the name', async () => {
    mountAdminIdAudit({
      recipes: [recipeMother.withBasicInfo('Courgette Fritters').build()],
    });

    await expect.element(page.getByTestId('empty-state')).toHaveTextContent('All ids look good.');
  });

  it('flags ids that are not kebab-case', async () => {
    mountAdminIdAudit({
      recipes: [
        recipeMother.withBasicInfo('Shakshuka').withId('Shakshuka_v2').build(),
      ],
    });

    await expect
      .poll(() => rowTexts('id-audit-row'))
      .toEqual(['Shakshuka_v2 Not kebab-case shakshuka']);
  });

  it('flags kebab-case ids that do not match the name', async () => {
    mountAdminIdAudit({
      recipes: [
        recipeMother
          .withBasicInfo('Hummus with Ful')
          .withId('hummus-ful')
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('id-audit-row'))
      .toEqual(['hummus-ful Does not match name hummus-with-ful']);
  });

  it('suggests ids without accents or punctuation', async () => {
    mountAdminIdAudit({
      recipes: [
        recipeMother
          .withBasicInfo('Crème Brûlée (Classic!)')
          .withId('creme-brulee')
          .build(),
      ],
    });

    await expect
      .poll(() => rowTexts('id-audit-row'))
      .toEqual(['creme-brulee Does not match name creme-brulee-classic']);
  });
});

function mountAdminIdAudit({ recipes = [] }: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AdminIdAudit);
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
