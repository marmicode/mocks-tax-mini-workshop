import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  createRecipeSearchParams,
  RecipeRepository,
} from '@whiskmate/recipe/infra';
import { AdminIdAudit } from './admin-id-audit.ng';

describe(AdminIdAudit, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminIdAudit();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('accepts a kebab-case id matching the name', async () => {
    const { search } = mountAdminIdAudit();
    search.mockImplementationOnce((params) => {
      expect(params).toStrictEqual(createRecipeSearchParams());
      return of([
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: null,
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [{ name: 'courgettes' }],
          steps: ['Fry.'],
        },
      ]);
    });

    await expect.element(page.getByTestId('empty-state')).toHaveTextContent('All ids look good.');
  });

  it('flags ids that are not kebab-case', async () => {
    const { search } = mountAdminIdAudit();
    search.mockImplementation((params) =>
      'courses' in params
        ? of([])
        : of([
            {
              id: 'Shakshuka_v2',
              course: 'main',
              name: 'Shakshuka',
              description: 'Eggs poached in a spiced tomato sauce.',
              pictureUri: 'https://example.com/shakshuka.jpg',
              ingredients: [{ name: 'eggs' }],
              steps: ['Cook.'],
            },
          ]),
    );

    await expect.poll(() => rowTexts('id-audit-row')).toEqual(['Shakshuka_v2 Not kebab-case shakshuka']);
  });

  it('flags kebab-case ids that do not match the name', async () => {
    const { search } = mountAdminIdAudit();
    search.mockReturnValue(
      of([
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: 'https://example.com/hummus.jpg',
          ingredients: [{ name: 'chickpeas' }],
          steps: ['Blend.'],
        },
      ]),
    );

    await expect.poll(() => rowTexts('id-audit-row')).toEqual(['hummus-ful Does not match name hummus-with-ful']);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('suggests ids without accents or punctuation', async () => {
    const { search } = mountAdminIdAudit();
    search.mockReturnValue(
      of([
        {
          id: 'creme-brulee',
          course: 'dessert',
          name: 'Crème Brûlée (Classic!)',
          description: null,
          pictureUri: '/images/creme-brulee.svg',
          ingredients: [{ name: 'cream' }],
          steps: ['Bake.', 'Torch.'],
        },
      ]),
    );

    await expect.poll(() => rowTexts('id-audit-row')).toEqual(['creme-brulee Does not match name creme-brulee-classic']);
    expect(search.mock.calls).toMatchSnapshot();
  });
});

function mountAdminIdAudit() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(AdminIdAudit);

  return { search };
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
