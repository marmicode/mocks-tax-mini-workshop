import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminPictureAudit } from './admin-picture-audit.ng';

const WHOLE_CATALOG_SEARCH_KEY = searchKey({
  keywords: '',
  maxIngredientCount: null,
  maxStepCount: null,
  courses: [],
});

describe(AdminPictureAudit, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminPictureAudit();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('accepts https and local pictures', async () => {
    const { search } = mountAdminPictureAudit();
    search.mockImplementation(
      respondBySearchKey({
        [WHOLE_CATALOG_SEARCH_KEY]: [
          {
            id: 'shakshuka',
            course: 'main',
            name: 'Shakshuka',
            description: 'Eggs poached in a spiced tomato sauce.',
            pictureUri: 'https://example.com/shakshuka.jpg',
            ingredients: [{ name: 'eggs' }],
            steps: ['Cook.'],
          },
          {
            id: 'tahini-halva-brownies',
            course: 'dessert',
            name: 'Tahini and Halva Brownies',
            description: null,
            pictureUri: '/images/tahini-halva-brownies.svg',
            ingredients: [{ name: 'tahini' }],
            steps: ['Bake.'],
          },
        ],
      }),
    );

    await expect.element(page.getByTestId('empty-state')).toHaveTextContent('All pictures are safe.');
  });

  it('flags pictures served over plain http', async () => {
    const { search } = mountAdminPictureAudit();
    search.mockImplementation(
      respondBySearchKey({
        [WHOLE_CATALOG_SEARCH_KEY]: [
          {
            id: 'courgette-fritters',
            course: 'starter',
            name: 'Courgette Fritters',
            description: null,
            pictureUri: 'http://example.com/fritters.jpg',
            ingredients: [{ name: 'courgettes' }],
            steps: ['Fry.'],
          },
        ],
      }),
    );

    await expect.poll(() => rowTexts('picture-audit-row')).toEqual(['Courgette Fritters http://example.com/fritters.jpg Not served over https']);
  });

  it('flags missing pictures', async () => {
    const { search } = mountAdminPictureAudit();
    search.mockReturnValue(
      of([
        {
          id: 'hummus-ful',
          course: 'starter',
          name: 'Hummus with Ful',
          description: 'Creamy hummus.',
          pictureUri: '',
          ingredients: [{ name: 'chickpeas' }],
          steps: ['Blend.'],
        },
      ]),
    );

    await expect.poll(() => rowTexts('picture-audit-row')).toEqual(['Hummus with Ful Missing picture']);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('flags pictures from unknown locations', async () => {
    const { search } = mountAdminPictureAudit();
    search.mockImplementation(
      respondBySearchKey({
        [WHOLE_CATALOG_SEARCH_KEY]: [
          {
            id: 'shakshuka',
            course: 'main',
            name: 'Shakshuka',
            description: null,
            pictureUri: 'ftp://example.com/shakshuka.jpg',
            ingredients: [{ name: 'eggs' }],
            steps: ['Cook.'],
          },
        ],
      }),
    );

    await expect.poll(() => rowTexts('picture-audit-row')).toEqual(['Shakshuka ftp://example.com/shakshuka.jpg Unknown location']);
    expect(search).toHaveBeenCalledOnce();
  });
});

function mountAdminPictureAudit() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(AdminPictureAudit);

  return { search };
}

function respondBySearchKey(responses: Record<string, Recipe[]>) {
  return (params: RecipeSearchParams) => {
    const key = searchKey(params);
    return key in responses
      ? of(responses[key])
      : throwError(() => new Error(`unexpected search ${key}`));
  };
}

function searchKey(params: RecipeSearchParams): string {
  return JSON.stringify(params);
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
