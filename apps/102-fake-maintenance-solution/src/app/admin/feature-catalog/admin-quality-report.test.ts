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
import { AdminQualityReport } from './admin-quality-report.ng';

const shakshuka = recipeMother
  .withBasicInfo({
    name: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato sauce.',
  })
  .withIngredients([
    { name: 'eggs', quantity: { amount: 6, unit: '' } },
    { name: 'tomatoes', quantity: { amount: 800, unit: 'g' } },
  ])
  .withSteps(['Cook the sauce.', 'Crack the eggs.', 'Serve.'])
  .build();

const brownies = recipeMother
  .withBasicInfo('Tahini and Halva Brownies')
  .withIngredients([
    { name: 'dark chocolate', quantity: { amount: 200, unit: 'g' } },
    { name: 'butter', quantity: { amount: 200, unit: 'g' } },
  ])
  .withSteps(['Melt.', 'Mix.', 'Bake.'])
  .build();

const sketchyFritters = recipeMother
  .withBasicInfo({
    name: 'Courgette Fritters',
    description: '',
  })
  .withPictureUri('http://example.com/fritters.jpg')
  .withIngredients([{ name: 'courgettes' }, { name: 'eggs' }])
  .withSteps(['Fry.'])
  .build();

describe(AdminQualityReport, () => {
  it('searches all recipes', async () => {
    mountAdminQualityReport({
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
      .poll(() => rowNames())
      .toEqual([
        'Lemon and Ricotta Cheesecake',
        'Shakshuka',
        'Hummus with Ful',
      ]);
  });

  it('gives a perfect score to a complete recipe', async () => {
    mountAdminQualityReport({ recipes: [shakshuka] });

    await expect.poll(() => rowTexts()).toEqual(['Shakshuka 100% ✅']);
  });

  it('reports a missing description', async () => {
    mountAdminQualityReport({ recipes: [brownies] });

    await expect
      .poll(() => rowTexts())
      .toEqual(['Tahini and Halva Brownies 75% Missing description']);
  });

  it('reports every issue of a sketchy recipe', async () => {
    mountAdminQualityReport({ recipes: [sketchyFritters] });

    await expect
      .poll(() => rowTexts())
      .toEqual([
        'Courgette Fritters 0% Missing description Fewer than 3 steps Most ingredients have no quantity Picture is not served over https',
      ]);
  });

  it('shows only recipes with issues when filtered', async () => {
    mountAdminQualityReport({
      recipes: [shakshuka, brownies, sketchyFritters],
    });

    await expect.element(page.getByTestId('quality-row').first()).toBeVisible();
    await page
      .getByRole('checkbox', { name: 'Only recipes with issues' })
      .click();

    await expect
      .poll(() => rowNames())
      .toEqual(['Tahini and Halva Brownies', 'Courgette Fritters']);
  });

  it('shows every recipe again once the filter is unchecked', async () => {
    mountAdminQualityReport({
      recipes: [shakshuka, brownies],
    });

    await expect.element(page.getByTestId('quality-row').first()).toBeVisible();
    await page
      .getByRole('checkbox', { name: 'Only recipes with issues' })
      .click();
    await page
      .getByRole('checkbox', { name: 'Only recipes with issues' })
      .click();

    await expect
      .poll(() => rowNames())
      .toEqual(['Shakshuka', 'Tahini and Halva Brownies']);
  });

  it('tolerates up to half of the ingredients without quantity', async () => {
    mountAdminQualityReport({
      recipes: [
        {
          ...shakshuka,
          ingredients: [
            { name: 'eggs', quantity: { amount: 6, unit: '' } },
            { name: 'salt' },
          ],
        },
      ],
    });

    await expect.poll(() => rowTexts()).toEqual(['Shakshuka 100% ✅']);
  });

  it('reports a blank description and too few steps', async () => {
    mountAdminQualityReport({
      recipes: [
        { ...shakshuka, description: '   ', steps: ['Cook.', 'Serve.'] },
      ],
    });

    await expect
      .poll(() => rowTexts())
      .toEqual(['Shakshuka 50% Missing description Fewer than 3 steps']);
  });

  it('links each recipe to its edit page', async () => {
    mountAdminQualityReport({
      recipes: [shakshuka, brownies],
    });

    await expect
      .poll(() => editLinks())
      .toEqual([
        `/admin/recipes/${shakshuka.id}/edit`,
        `/admin/recipes/${brownies.id}/edit`,
      ]);
  });
});

function mountAdminQualityReport({
  recipes = [],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });
  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(AdminQualityReport);
}

function rowTexts() {
  return page.getByTestId('quality-row').elements().map((row) => rowText(row));
}

function rowNames() {
  return page
    .getByTestId('quality-row')
    .getByRole('link')
    .elements()
    .map((link) => link.textContent?.trim() ?? '');
}

function editLinks() {
  return page
    .getByTestId('quality-row')
    .getByRole('link')
    .elements()
    .map((link) => link.getAttribute('href'));
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
