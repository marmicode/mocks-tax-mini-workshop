import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminRecipeList } from './admin-recipe-list.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [{ name: 'eggs' }, { name: 'tomatoes' }],
  steps: ['Cook the sauce.', 'Poach the eggs.', 'Serve.'],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [{ name: 'ricotta' }],
  steps: ['Bake.'],
};

const catalog = [shakshuka, cheesecake];

describe(AdminRecipeList.name, () => {
  it('lists all recipes on load', async () => {
    const { fixture, search } = mountAdminRecipeList();
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Shakshuka', 'main', '2', '3'],
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });

  it('searches by keywords', async () => {
    const { fixture, search } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'lemon');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
        [
          {
            "keywords": "lemon",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('searches by course', async () => {
    const { fixture, search } = mountAdminRecipeList();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('stops filtering by course when "All courses" is selected', async () => {
    const { fixture, search } = mountAdminRecipeList();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Shakshuka', 'main', '2', '3'],
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ courses: expect.anything() }),
    );
  });

  it('links to the edit and delete pages of each recipe', async () => {
    const { fixture, search } = mountAdminRecipeList();
    search.mockImplementation(
      respondBySearchKey({
        [searchKey({
          keywords: '',
          maxIngredientCount: null,
          maxStepCount: null,
        })]: [shakshuka],
      }),
    );
    await fixture.whenStable();

    expect(linkByText(fixture.nativeElement, 'Edit').getAttribute('href')).toBe(
      '/admin/recipes/shakshuka/edit',
    );
    expect(
      linkByText(fixture.nativeElement, 'Delete').getAttribute('href'),
    ).toBe('/admin/recipes/shakshuka/delete');
    expect(
      linkByText(fixture.nativeElement, 'New recipe').getAttribute('href'),
    ).toBe('/admin/recipes/new');
  });

  it('shows "No recipes found" when nothing matches', async () => {
    const { fixture, search } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'xyz');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No recipes found');
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('shows the number of recipes found', async () => {
    const { fixture, search } = mountAdminRecipeList();
    search.mockImplementationOnce((params) => {
      expect(Object.keys(params)).toEqual([
        'keywords',
        'maxIngredientCount',
        'maxStepCount',
      ]);
      return of(catalog);
    });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('.count')?.textContent?.trim(),
    ).toBe('2 recipe(s)');
    expect(search).toHaveBeenCalledOnce();
  });

  it('renders the recipes matching the keywords', async () => {
    const { fixture, search } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'ricotta');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Lemon and Ricotta Cheesecake', 'dessert', '1', '1'],
    ]);
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot('./__snapshots__/admin-recipe-list.calls.json');
  });

  it('combines keywords and course', async () => {
    const { fixture, search } = mountAdminRecipeList();
    await fixture.whenStable();

    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'shak');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();

    expect(rows(fixture.nativeElement)).toEqual([
      ['Shakshuka', 'main', '2', '3'],
    ]);
    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenNthCalledWith(3, {
      keywords: 'shak',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
  });

  it('keeps keywords when "All courses" is selected again', async () => {
    const { fixture, search } = mountAdminRecipeList();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'starter');
    await fixture.whenStable();
    typeInto(inputByLabel(fixture.nativeElement, 'Keywords'), 'hummus');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(search).toHaveBeenCalledTimes(4);
    expect(search.mock.lastCall).toMatchInlineSnapshot(`
        [
          {
            "keywords": "hummus",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ]
      `);
  });
});

function mountAdminRecipeList() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) => {
      const recipes =
        'courses' in params
          ? catalog.filter((recipe) => params.courses?.includes(recipe.course))
          : catalog;
      return of(
        recipes.filter((recipe) =>
          recipe.name.toLowerCase().includes(params.keywords.toLowerCase()),
        ),
      );
    });
  const fixture = TestBed.createComponent(AdminRecipeList);
  return { fixture, search };
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

function rows(root: HTMLElement): string[][] {
  return [...root.querySelectorAll('[data-testid="recipe-row"]')].map((row) =>
    [...row.querySelectorAll('td')]
      .slice(0, 4)
      .map((cell) => cell.textContent?.trim() ?? ''),
  );
}

function inputByLabel(root: HTMLElement, label: string): HTMLInputElement {
  const field = [...root.querySelectorAll('mat-form-field')].find(
    (el) => el.querySelector('mat-label')?.textContent?.trim() === label,
  );
  const input = field?.querySelector('input');
  if (input == null) {
    throw new Error(`Input "${label}" not found.`);
  }
  return input;
}

function typeInto(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

function selectCourse(root: HTMLElement, course: string): void {
  const select = root.querySelector('select');
  if (select == null) {
    throw new Error('Course select not found.');
  }
  select.value = course;
  select.dispatchEvent(new Event('change'));
}

function linkByText(root: HTMLElement, text: string): HTMLAnchorElement {
  const link = [...root.querySelectorAll('a')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (link == null) {
    throw new Error(`Link "${text}" not found.`);
  }
  return link;
}
