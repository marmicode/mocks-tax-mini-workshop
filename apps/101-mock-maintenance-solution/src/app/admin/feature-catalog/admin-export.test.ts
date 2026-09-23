import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, it, vi } from 'vitest';
import {
  RecipeRepository,
  type RecipeSearchParams,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { AdminExport } from './admin-export.ng';

const shakshuka: Recipe = {
  id: 'shakshuka',
  course: 'main',
  name: 'Shakshuka',
  description: null,
  pictureUri: 'https://example.com/shakshuka.jpg',
  ingredients: [],
  steps: [],
};

const cheesecake: Recipe = {
  id: 'lemon-ricotta-cheesecake',
  course: 'dessert',
  name: 'Lemon and Ricotta Cheesecake',
  description: null,
  pictureUri: 'https://example.com/cheesecake.jpg',
  ingredients: [],
  steps: [],
};

/**
 * What the backend returns for each course filter.
 */
const recipesByCourse: Record<string, Recipe[]> = {
  all: [shakshuka, cheesecake],
  starter: [],
  main: [shakshuka],
  dessert: [cheesecake],
};

describe(AdminExport.name, () => {
  it('searches all recipes without a course filter', async () => {
    const { fixture, search } = mountAdminExport();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(search.mock.lastCall?.[0]).toHaveProperty('courses', []);
  });

  it('previews the exported recipes as JSON', async () => {
    const { fixture, search } = mountAdminExport();
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '2 recipe(s) to export',
    );
    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([shakshuka, cheesecake]);
    expect(search.mock.calls).toMatchInlineSnapshot(`
      [
        [
          {
            "courses": [],
            "keywords": "",
            "maxIngredientCount": null,
            "maxStepCount": null,
          },
        ],
      ]
    `);
  });

  it('exports a single course', async () => {
    const { fixture, search } = mountAdminExport();
    const responses: Record<string, Recipe[]> = {
      [searchKey({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: [],
      })]: recipesByCourse['all'],
      [searchKey({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
        courses: ['dessert'],
      })]: recipesByCourse['dessert'],
    };
    search.mockImplementation((params) => {
      const recipes = responses[searchKey(params)];
      if (recipes == null) {
        throw new Error(`unexpected search ${searchKey(params)}`);
      }
      return of(recipes);
    });
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([cheesecake]);
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('goes back to all courses', async () => {
    const { fixture, search } = mountAdminExport();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '2 recipe(s) to export',
    );
    expect(search).toHaveBeenCalledTimes(3);
    expect(search.mock.calls).toMatchSnapshot();
  });

  it('downloads the recipes as recipes.json', async () => {
    const { fixture, search } = mountAdminExport();
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:recipes');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    await fixture.whenStable();

    buttonByText(fixture.nativeElement, 'Download recipes.json').click();

    const blob = createObjectURL.mock.lastCall?.[0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual([shakshuka, cheesecake]);
    const link = click.mock.contexts[0] as HTMLAnchorElement;
    expect(link.download).toBe('recipes.json');
    expect(link.href).toBe('blob:recipes');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('previews an empty export when the catalog is empty', async () => {
    const { fixture, search } = mountAdminExport();
    search.mockImplementation((params) =>
      Object.keys(params).length === 4
        ? of([])
        : throwError(() => new Error(`unexpected search ${searchKey(params)}`)),
    );
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '0 recipe(s) to export',
    );
    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([]);
  });

  it('switches from one course to another', async () => {
    const { fixture, search } = mountAdminExport();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '1 recipe(s) to export',
    );
    expect(search).toHaveBeenCalledTimes(3);
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
  });

  it('counts the recipes to export again after going back to all courses', async () => {
    const { fixture, search } = mountAdminExport();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '1 recipe(s) to export',
    );

    selectCourse(fixture.nativeElement, '');
    await fixture.whenStable();

    expect(textByTestId(fixture.nativeElement, 'export-count')).toBe(
      '2 recipe(s) to export',
    );
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot('./__snapshots__/admin-export.calls.json');
  });

  it('downloads only the recipes of the selected course', async () => {
    const { fixture, search } = mountAdminExport();
    search.mockImplementation(({ courses }) =>
      of(
        courses?.length
          ? recipesByCourse['all'].filter((recipe) =>
              courses.includes(recipe.course),
            )
          : recipesByCourse['all'],
      ),
    );
    const createObjectURL = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:recipes');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      () => undefined,
    );
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'main');
    await fixture.whenStable();
    buttonByText(fixture.nativeElement, 'Download recipes.json').click();

    const blob = createObjectURL.mock.lastCall?.[0] as Blob;
    expect(JSON.parse(await blob.text())).toEqual([shakshuka]);
    expect(search).toHaveBeenCalledTimes(2);
  });
});

function mountAdminExport() {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation(({ courses }) =>
      of(
        courses.length === 0
          ? recipesByCourse['all']
          : recipesByCourse[courses[0]],
      ),
    );

  const fixture = TestBed.createComponent(AdminExport);

  return { fixture, search };
}

function textByTestId(root: HTMLElement, testId: string): string {
  return (
    root.querySelector(`[data-testid="${testId}"]`)?.textContent?.trim() ?? ''
  );
}

function selectCourse(root: HTMLElement, course: string): void {
  const select = root.querySelector<HTMLSelectElement>(
    'select[aria-label="Course"]',
  );
  if (select == null) {
    throw new Error('Course select not found.');
  }
  select.value = course;
  select.dispatchEvent(new Event('change'));
}

function buttonByText(root: HTMLElement, text: string): HTMLButtonElement {
  const button = [...root.querySelectorAll('button')].find(
    (el) => el.textContent?.trim() === text,
  );
  if (button == null) {
    throw new Error(`Button "${text}" not found.`);
  }
  return button;
}

function searchKey(params: RecipeSearchParams) {
  return JSON.stringify(params);
}
