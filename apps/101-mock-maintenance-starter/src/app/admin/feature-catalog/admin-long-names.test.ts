import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { AdminLongNames } from './admin-long-names.ng';

describe(AdminLongNames.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAdminLongNames();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('shows an empty state when every name is short enough', async () => {
    const { fixture, search } = mountAdminLongNames();
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
    await fixture.whenStable();

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
    expect(emptyState(fixture.nativeElement)).toBe(
      'Every name fits within 30 characters.',
    );
  });

  it('lists names longer than 30 characters by default', async () => {
    const { fixture, search } = mountAdminLongNames();
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
    await fixture.whenStable();

    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Slow-Roasted Lamb Shoulder with Pomegranate (43)',
    ]);
  });

  it('sorts the longest names first', async () => {
    const { fixture, search } = mountAdminLongNames();
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
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
    expect(rowTexts(fixture.nativeElement)).toEqual([
      'Slow-Roasted Lamb Shoulder with Pomegranate (43)',
      'Tahini and Halva Brownies with Sea Salt (39)',
    ]);
  });

  it('applies a custom max length without searching again', async () => {
    const { fixture, search } = mountAdminLongNames();
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
    await fixture.whenStable();

    const input = maxLengthInput(fixture.nativeElement);
    input.value = '10';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledOnce();
    expect(search.mock.calls).toMatchSnapshot();
    expect(rowTexts(fixture.nativeElement)).toEqual(['Hummus with Ful (15)']);
  });
});

function mountAdminLongNames() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(AdminLongNames);

  return { fixture, search };
}

function rowTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('[data-testid="long-name-row"]')].map(
    (row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '',
  );
}

function maxLengthInput(root: HTMLElement): HTMLInputElement {
  const input = [...root.querySelectorAll('label')]
    .find((el) => el.textContent?.trim() === 'Max length')
    ?.querySelector('input');
  if (input == null) {
    throw new Error('Max length input not found.');
  }
  return input;
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
