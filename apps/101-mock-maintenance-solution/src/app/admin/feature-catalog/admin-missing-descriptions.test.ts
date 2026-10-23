import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import { AdminMissingDescriptions } from './admin-missing-descriptions.ng';

describe(AdminMissingDescriptions.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountAdminMissingDescriptions();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows an empty state when every recipe has a description', async () => {
    const { fixture, search } = mountAdminMissingDescriptions();
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
    await fixture.whenStable();

    expect(emptyState(fixture.nativeElement)).toBe(
      'Every recipe has a description.',
    );
  });

  it('lists recipes with a null description', async () => {
    const { fixture, search } = mountAdminMissingDescriptions();
    search.mockImplementation((params) =>
      of(
        Object.keys(params).length === 4
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
    await fixture.whenStable();

    expect(rowNames(fixture.nativeElement)).toEqual([
      'Tahini and Halva Brownies',
    ]);
  });

  it('treats blank descriptions as missing and sorts by name', async () => {
    const { fixture, search } = mountAdminMissingDescriptions();
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
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(rowNames(fixture.nativeElement)).toEqual([
      'Courgette Fritters',
      'Shakshuka',
    ]);
  });

  it('summarizes how many recipes miss a description', async () => {
    const { fixture, search } = mountAdminMissingDescriptions();
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
    await fixture.whenStable();

    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot(
      './__snapshots__/admin-missing-descriptions.calls.json',
    );
    expect(summary(fixture.nativeElement)).toBe('1 of 2 recipes');
  });
});

function mountAdminMissingDescriptions() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([]));

  const fixture = TestBed.createComponent(AdminMissingDescriptions);

  return { fixture, search };
}

function rowNames(root: HTMLElement): string[] {
  return [
    ...root.querySelectorAll('[data-testid="missing-description-row"]'),
  ].map((row) => row.textContent?.trim() ?? '');
}

function summary(root: HTMLElement): string | undefined {
  return root
    .querySelector('[data-testid="missing-description-summary"]')
    ?.textContent?.trim();
}

function emptyState(root: HTMLElement): string | undefined {
  return root.querySelector('[data-testid="empty-state"]')?.textContent?.trim();
}
