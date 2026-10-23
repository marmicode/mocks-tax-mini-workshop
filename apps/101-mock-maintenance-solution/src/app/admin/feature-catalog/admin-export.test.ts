import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
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
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('exports a single course', async () => {
    const { fixture, search } = mountAdminExport();
    await fixture.whenStable();

    selectCourse(fixture.nativeElement, 'dessert');
    await fixture.whenStable();

    expect(
      JSON.parse(textByTestId(fixture.nativeElement, 'export-preview')),
    ).toEqual([cheesecake]);
    expect(search).toHaveBeenCalledTimes(2);
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['dessert'],
    });
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
    expect(search).toHaveBeenNthCalledWith(1, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(search).toHaveBeenNthCalledWith(2, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
    expect(search).toHaveBeenNthCalledWith(3, {
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
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
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
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
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('downloads only the recipes of the selected course', async () => {
    const { fixture, search } = mountAdminExport();
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
    expect(search).toHaveBeenLastCalledWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: ['main'],
    });
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
