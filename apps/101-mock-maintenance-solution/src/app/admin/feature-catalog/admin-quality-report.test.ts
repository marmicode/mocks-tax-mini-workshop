import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminQualityReport } from './admin-quality-report.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: 'Eggs poached in a spiced tomato sauce.',
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [
    { name: 'eggs', quantity: { amount: 6, unit: '' } },
    { name: 'tomatoes', quantity: { amount: 800, unit: 'g' } },
  ],
  steps: ['Cook the sauce.', 'Crack the eggs.', 'Serve.'],
};

const brownies: Recipe = {
  id: 'tahini-halva-brownies',
  course: 'dessert',
  name: 'Tahini and Halva Brownies',
  description: null,
  pictureUri: '/images/tahini-halva-brownies.svg',
  ingredients: [
    { name: 'dark chocolate', quantity: { amount: 200, unit: 'g' } },
    { name: 'butter', quantity: { amount: 200, unit: 'g' } },
  ],
  steps: ['Melt.', 'Mix.', 'Bake.'],
};

const sketchyFritters: Recipe = {
  id: 'courgette-fritters',
  course: 'starter',
  name: 'Courgette Fritters',
  description: '',
  pictureUri: 'http://example.com/fritters.jpg',
  ingredients: [{ name: 'courgettes' }, { name: 'eggs' }],
  steps: ['Fry.'],
};

describe(AdminQualityReport.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAdminQualityReport();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('gives a perfect score to a complete recipe', async () => {
    const { fixture, search } = mountAdminQualityReport();
    search.mockReturnValue(of([shakshuka]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowTexts(fixture.nativeElement)).toEqual(['Shakshuka 100% ✅']);
  });

  it('reports a missing description', async () => {
    const { fixture, search } = mountAdminQualityReport();
    search.mockReturnValue(of([brownies]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Tahini and Halva Brownies 75% Missing description',
    ]);
  });

  it('reports every issue of a sketchy recipe', async () => {
    const { fixture, search } = mountAdminQualityReport();
    search.mockReturnValue(of([sketchyFritters]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Courgette Fritters 0% Missing description Fewer than 3 steps Most ingredients have no quantity Picture is not served over https',
    ]);
  });

  it('shows only recipes with issues when filtered', async () => {
    const { fixture, search } = mountAdminQualityReport();
    search.mockReturnValue(of([shakshuka, brownies, sketchyFritters]));
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'Only recipes with issues').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowNames(fixture.nativeElement)).toEqual([
      'Tahini and Halva Brownies',
      'Courgette Fritters',
    ]);
  });

  it('shows every recipe again once the filter is unchecked', async () => {
    const { fixture, search } = mountAdminQualityReport();
    search.mockReturnValue(of([shakshuka, brownies]));
    await fixture.whenStable();

    checkboxByLabel(fixture.nativeElement, 'Only recipes with issues').click();
    await fixture.whenStable();
    checkboxByLabel(fixture.nativeElement, 'Only recipes with issues').click();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowNames(fixture.nativeElement)).toEqual([
      'Shakshuka',
      'Tahini and Halva Brownies',
    ]);
  });

  it('tolerates up to half of the ingredients without quantity', async () => {
    const { fixture, search } = mountAdminQualityReport();
    search.mockReturnValue(
      of([
        {
          ...shakshuka,
          ingredients: [
            { name: 'eggs', quantity: { amount: 6, unit: '' } },
            { name: 'salt' },
          ],
        },
      ]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowTexts(fixture.nativeElement)).toEqual(['Shakshuka 100% ✅']);
  });

  it('reports a blank description and too few steps', async () => {
    const { fixture, search } = mountAdminQualityReport();
    search.mockReturnValue(
      of([{ ...shakshuka, description: '   ', steps: ['Cook.', 'Serve.'] }]),
    );
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Shakshuka 50% Missing description Fewer than 3 steps',
    ]);
  });

  it('links each recipe to its edit page', async () => {
    const { fixture, search } = mountAdminQualityReport();
    search.mockReturnValue(of([shakshuka, brownies]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(
      rows(fixture.nativeElement).map((row) =>
        row.querySelector('a')?.getAttribute('href'),
      ),
    ).toEqual([
      '/admin/recipes/shakshuka/edit',
      '/admin/recipes/tahini-halva-brownies/edit',
    ]);
  });
});

function mountAdminQualityReport() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(AdminQualityReport);

  return { fixture, search };
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
