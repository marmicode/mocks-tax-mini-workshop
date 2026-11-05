import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { page } from 'vitest/browser';
import { describe, it, vi } from 'vitest';
import { RecipeRepository } from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { PictureGallery } from './picture-gallery.ng';

const hummus: Recipe = {
  id: 'hummus-ful',
  course: 'starter',
  name: 'Hummus with Ful',
  description: null,
  pictureUri: 'https://example.com/hummus.jpg',
  ingredients: [],
  steps: [],
};

const salad: Recipe = {
  id: 'burnt-aubergine-salad',
  course: 'starter',
  name: 'Burnt Aubergine with Tahini and Pomegranate',
  description: null,
  pictureUri: 'https://example.com/salad.jpg',
  ingredients: [],
  steps: [],
};

describe(PictureGallery, () => {
  it('searches all recipes', async () => {
    const { search } = mountPictureGallery();

    await expect
      .poll(() => search)
      .toHaveBeenCalledExactlyOnceWith({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
      });
  });

  it('shows the picture of each recipe', async () => {
    const { search } = mountPictureGallery();
    search.mockImplementationOnce((params) => {
      expect(params).toStrictEqual({
        keywords: '',
        maxIngredientCount: null,
        maxStepCount: null,
      });
      return of([hummus, salad]);
    });

    await expect
      .poll(pictureSources)
      .toEqual([
        'https://example.com/hummus.jpg',
        'https://example.com/salad.jpg',
      ]);
  });

  it('describes each picture with the recipe name', async () => {
    const { search } = mountPictureGallery();
    search.mockImplementationOnce((params) =>
      of(
        Object.values(params).every((value) => value === '' || value === null)
          ? [salad]
          : [],
      ),
    );

    await expect
      .element(page.getByRole('img'))
      .toHaveAttribute('alt', 'Burnt Aubergine with Tahini and Pomegranate');
  });

  it('links each picture to the recipe detail page', async () => {
    const { search } = mountPictureGallery();
    search.mockReturnValue(of([hummus]));

    await expect
      .element(page.getByRole('img', { name: 'Hummus with Ful' }))
      .toBeVisible();
    await expect
      .element(page.getByTestId('gallery-item'))
      .toHaveAttribute('href', '/recipes/hummus-ful');
    await expect(
      JSON.stringify(search.mock.calls, null, 2),
    ).toMatchFileSnapshot('./__snapshots__/picture-gallery-links.calls.json');
  });

  it('shows a message when there are no pictures', async () => {
    const { search } = mountPictureGallery();
    search.mockReturnValue(of([]));

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No pictures to show');
    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
    });
  });
});

function mountPictureGallery() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockImplementation((params) => {
      const catalog = [hummus, salad];
      return of(
        params.courses
          ? catalog.filter((recipe) => params.courses?.includes(recipe.course))
          : catalog,
      );
    });

  TestBed.createComponent(PictureGallery);

  return { search };
}

function pictureSources() {
  return page
    .getByRole('img')
    .elements()
    .map((img) => img.getAttribute('src') ?? '');
}
