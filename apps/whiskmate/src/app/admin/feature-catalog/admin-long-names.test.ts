import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { AdminLongNames } from './admin-long-names.ng';

describe(AdminLongNames, () => {
  it('searches all recipes', async () => {
    const { search } = mountAdminLongNames();

    await expect.poll(() => search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows an empty state when every name is short enough', async () => {
    const { search } = mountAdminLongNames();
    search.mockReturnValue(
      of([
        {
          id: 'shakshuka',
          course: 'main',
          name: 'Shakshuka',
          description: 'Eggs poached in a spiced tomato sauce.',
          pictureUri: 'https://example.com/shakshuka.jpg',
          ingredients: [{ name: 'eggs' }],
          steps: ['Cook.'],
        },
      ]),
    );

    await expect
      .element(page.getByTestId('empty-state'))
      .toHaveTextContent('Every name fits within 30 characters.');
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('lists names longer than 30 characters by default', async () => {
    const { search } = mountAdminLongNames();
    search.mockImplementation((params) => {
      if (
        !Object.values(params).every((value) => value === '' || value === null)
      ) {
        return throwError(
          () => new Error(`unexpected search ${JSON.stringify(params)}`),
        );
      }
      return of([
        {
          id: 'slow-roasted-lamb-shoulder-with-pomegranate',
          course: 'main',
          name: 'Slow-Roasted Lamb Shoulder with Pomegranate',
          description: null,
          pictureUri: 'https://example.com/lamb.jpg',
          ingredients: [{ name: 'lamb shoulder' }],
          steps: ['Roast.'],
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
      ]);
    });

    await expect
      .element(page.getByTestId('long-name-row'))
      .toHaveTextContent('Slow-Roasted Lamb Shoulder with Pomegranate (43)');
  });

  it('sorts the longest names first', async () => {
    const { search } = mountAdminLongNames();
    search.mockReturnValue(
      of([
        {
          id: 'tahini-and-halva-brownies-with-sea-salt',
          course: 'dessert',
          name: 'Tahini and Halva Brownies with Sea Salt',
          description: null,
          pictureUri: '/images/tahini-halva-brownies.svg',
          ingredients: [{ name: 'tahini' }],
          steps: ['Bake.'],
        },
        {
          id: 'slow-roasted-lamb-shoulder-with-pomegranate',
          course: 'main',
          name: 'Slow-Roasted Lamb Shoulder with Pomegranate',
          description: null,
          pictureUri: 'https://example.com/lamb.jpg',
          ingredients: [{ name: 'lamb shoulder' }],
          steps: ['Roast.'],
        },
      ]),
    );

    await expect
      .poll(() => rowTexts('long-name-row'))
      .toEqual([
        'Slow-Roasted Lamb Shoulder with Pomegranate (43)',
        'Tahini and Halva Brownies with Sea Salt (39)',
      ]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('applies a custom max length without searching again', async () => {
    const { search } = mountAdminLongNames();
    search.mockReturnValue(
      of([
        {
          id: 'hummus-with-ful',
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

    await page.getByLabelText('Max length').fill('10');

    await expect
      .element(page.getByTestId('long-name-row'))
      .toHaveTextContent('Hummus with Ful (15)');
    expect(search).toHaveBeenCalledOnce();
    expect(search.mock.calls).toMatchSnapshot();
  });
});

function mountAdminLongNames() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  TestBed.createComponent(AdminLongNames);

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
