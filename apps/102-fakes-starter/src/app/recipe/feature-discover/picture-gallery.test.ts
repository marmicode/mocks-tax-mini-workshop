import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
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
  it('shows the picture of each recipe', async () => {
    const { fixture } = mountPictureGallery({ recipes: [hummus, salad] });
    await fixture.whenStable();

    expect(pictureSources(fixture.nativeElement)).toEqual([
      'https://example.com/hummus.jpg',
      'https://example.com/salad.jpg',
    ]);
  });

  it('describes each picture with the recipe name', async () => {
    const { fixture } = mountPictureGallery({ recipes: [salad] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('img')?.getAttribute('alt'),
    ).toBe('Burnt Aubergine with Tahini and Pomegranate');
  });

  it('links each picture to the recipe detail page', async () => {
    const { fixture } = mountPictureGallery({ recipes: [hummus] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement
        .querySelector('[data-testid="gallery-item"]')
        ?.getAttribute('href'),
    ).toBe('/recipes/hummus-ful');
  });

  it('shows a message when there are no pictures', async () => {
    const { fixture } = mountPictureGallery({ recipes: [] });
    await fixture.whenStable();

    expect(
      fixture.nativeElement.querySelector('[data-testid="no-recipes-message"]')
        ?.textContent,
    ).toContain('No pictures to show');
  });
});

function mountPictureGallery({
  recipes = [hummus, salad],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  const fixture = TestBed.createComponent(PictureGallery);

  return { fixture };
}

function pictureSources(root: HTMLElement): string[] {
  return [...root.querySelectorAll('img')].map(
    (img) => img.getAttribute('src') ?? '',
  );
}
