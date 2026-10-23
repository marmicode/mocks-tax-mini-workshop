import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
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

describe(PictureGallery.name, () => {
  it('searches all recipes', async () => {
    const { fixture, search } = mountPictureGallery();
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
  });

  it('shows the picture of each recipe', async () => {
    const { fixture, search } = mountPictureGallery();
    search.mockReturnValue(of([hummus, salad]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(pictureSources(fixture.nativeElement)).toEqual([
      'https://example.com/hummus.jpg',
      'https://example.com/salad.jpg',
    ]);
  });

  it('describes each picture with the recipe name', async () => {
    const { fixture, search } = mountPictureGallery();
    search.mockReturnValue(of([salad]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(
      fixture.nativeElement.querySelector('img')?.getAttribute('alt'),
    ).toBe('Burnt Aubergine with Tahini and Pomegranate');
  });

  it('links each picture to the recipe detail page', async () => {
    const { fixture, search } = mountPictureGallery();
    search.mockReturnValue(of([hummus]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="gallery-item"]')
        ?.getAttribute('href'),
    ).toBe('/recipes/hummus-ful');
  });

  it('shows a message when there are no pictures', async () => {
    const { fixture, search } = mountPictureGallery();
    search.mockReturnValue(of([]));
    await fixture.whenStable();

    expect(search).toHaveBeenCalledExactlyOnceWith({
      keywords: '',
      maxIngredientCount: null,
      maxStepCount: null,
      courses: [],
    });
    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No pictures to show');
  });
});

function mountPictureGallery() {
  TestBed.configureTestingModule({
    providers: [provideRouter([])],
  });

  const search = vi
    .spyOn(TestBed.inject(RecipeRepository), 'search')
    .mockReturnValue(of([hummus, salad]));

  const fixture = TestBed.createComponent(PictureGallery);

  return { fixture, search };
}

function pictureSources(root: HTMLElement): string[] {
  return [...root.querySelectorAll('img')].map(
    (img) => img.getAttribute('src') ?? '',
  );
}
