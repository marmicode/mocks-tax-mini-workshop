import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
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

describe(AdminQualityReport.name, () => {
  it('searches all recipes', async () => {
    const { fixture } = mountAdminQualityReport({
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
    await fixture.whenStable();

    expect(rowNames(fixture.nativeElement)).toEqual([
      'Lemon and Ricotta Cheesecake',
      'Shakshuka',
      'Hummus with Ful',
    ]);
  });

  it('gives a perfect score to a complete recipe', async () => {
    const { fixture } = mountAdminQualityReport({ recipes: [shakshuka] });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual(['Shakshuka 100% ✅']);
  });

  it('reports a missing description', async () => {
    const { fixture } = mountAdminQualityReport({ recipes: [brownies] });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Tahini and Halva Brownies 75% Missing description',
    ]);
  });

  it('reports every issue of a sketchy recipe', async () => {
    const { fixture } = mountAdminQualityReport({ recipes: [sketchyFritters] });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters 0% Missing description Fewer than 3 steps Most ingredients have no quantity Picture is not served over https',
    ]);
  });

  it('shows only recipes with issues when filtered', async () => {
    const { fixture } = mountAdminQualityReport({
      recipes: [shakshuka, brownies, sketchyFritters],
    });
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'Only recipes with issues').click();
    await fixture.whenStable();

    expect(rowNames(fixture.nativeElement)).toEqual([
      'Tahini and Halva Brownies',
      'Courgette Fritters',
    ]);
  });

  it('shows every recipe again once the filter is unchecked', async () => {
    const { fixture } = mountAdminQualityReport({
      recipes: [shakshuka, brownies],
    });
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'Only recipes with issues').click();
    await fixture.whenStable();
    checkboxByLabel(fixture.nativeElement, 'Only recipes with issues').click();
    await fixture.whenStable();

    expect(rowNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Tahini and Halva Brownies',
    ]);
  });

  it('tolerates up to half of the ingredients without quantity', async () => {
    const { fixture } = mountAdminQualityReport({
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
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual(['Shakshuka 100% ✅']);
  });

  it('reports a blank description and too few steps', async () => {
    const { fixture } = mountAdminQualityReport({
      recipes: [
        { ...shakshuka, description: '   ', steps: ['Cook.', 'Serve.'] },
      ],
    });
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Shakshuka 50% Missing description Fewer than 3 steps',
    ]);
  });

  it('links each recipe to its edit page', async () => {
    const { fixture } = mountAdminQualityReport({
      recipes: [shakshuka, brownies],
    });
    await fixture.whenStable();

    expect(
      rows(fixture.nativeElement).map((row) =>
        row.querySelector('a')?.getAttribute('href'),
      ),
    ).toEqual([
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

  const fixture = TestBed.createComponent(AdminQualityReport);

  return { fixture };
}

function rows(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('[data-testid="quality-row"]')];
}

function rowTexts(root: HTMLElement): string[] {
  return rows(root).map((row) =>
    [...row.querySelectorAll('td, li')]
      .filter((el) => el.querySelector('li') == null)
      .map((el) => el.textContent?.replace(/\s+/g, ' ').trim())
      .join(' '),
  );
}

function rowNames(root: HTMLElement): string[] {
  return rows(root).map(
    (row) => row.querySelector('a')?.textContent?.trim() ?? '',
  );
}

function checkboxByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const input = [...root.querySelectorAll('label')]
    .find((el) => el.textContent?.trim() === label)
    ?.querySelector('input');
  if (input == null) {
    throw new Error(`Checkbox "${label}" not found.`);
  }
  return input;
}
