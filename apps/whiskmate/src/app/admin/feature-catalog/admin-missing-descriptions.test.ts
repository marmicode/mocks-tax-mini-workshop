import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { AdminMissingDescriptions } from './admin-missing-descriptions.ng';

describe(AdminMissingDescriptions, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminMissingDescriptions();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows an empty state when every recipe has a description', async () => {
    const { search } = mountAdminMissingDescriptions();
    search.mockImplementation((params) => {
      expect(params.keywords).toBe('');
      expect(params.courses).toEqual([]);
      return of([
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: 'Eggs poached in a spiced tomato sauce.',
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }],
          steps: ['Cook.'],
        },
      ]);
    });

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('Every recipe has a description.');
  });

  it('lists recipes with a null description', async () => {
    const { search } = mountAdminMissingDescriptions();
    search.mockImplementation((params) =>
      of(
        params.courses.length === 0
          ? [
              {
                id: 'tahini-halva-brownies',
                course: 'dessert',
                name: 'Tahini and Halva Brownies',
                description: null,
                pictureUri: '/images/tahini-halva-brownies.svg',
                ingredients: [{ name: 'dark chocolate' }],
                steps: ['Bake.'],
              },
            ]
          : [],
      ),
    );

    await expect
      .element(page.getByTestId('missing-description-row'))
      .toHaveTextContent('Tahini and Halva Brownies');
  });

  it('treats blank descriptions as missing and sorts by name', async () => {
    const { search } = mountAdminMissingDescriptions();
    search.mockReturnValue(
      of([
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: '   ',
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }],
          steps: ['Cook.'],
        },
        {
          id: 'courgette-fritters',
          course: 'starter',
          name: 'Courgette Fritters',
          description: '',
          pictureUri: 'https://example.com/fritters.jpg',
          ingredients: [{ name: 'courgettes' }],
          steps: ['Fry.'],
        },
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

    await expect
      .poll(() => rowTexts('missing-description-row'))
      .toEqual(['Courgette Fritters', 'Shakshuka']);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('summarizes how many recipes miss a description', async () => {
    const { search } = mountAdminMissingDescriptions();
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
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: null,
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }],
          steps: ['Cook.'],
        },
      ]),
    );

    await expect
      .element(page.getByTestId('missing-description-summary'))
      .toHaveTextContent('1 of 2 recipes');
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot(
      './__snapshots__/admin-missing-descriptions.calls.json',
    );
  });
});

function mountAdminMissingDescriptions() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(AdminMissingDescriptions);

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
