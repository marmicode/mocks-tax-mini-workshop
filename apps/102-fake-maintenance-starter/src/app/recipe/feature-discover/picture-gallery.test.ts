import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, it } from 'vitest';
import {
  provideRecipeRepositoryFake,
  RecipeRepositoryFake,
} from '@whiskmate/recipe/infra';
import type { Recipe } from '@whiskmate/shared-recipe/model';
import { recipeMother } from '@whiskmate/shared-recipe/testing';
import { PictureGallery } from './picture-gallery.ng';

const hummus = recipeMother.withBasicInfo('Hummus with Ful').build();

const salad = recipeMother
  .withBasicInfo('Burnt Aubergine with Tahini and Pomegranate')
  .build();

describe(PictureGallery.name, () => {
  it('searches all recipes', async () => {
    const baklava = recipeMother
      .withBasicInfo({ name: 'Baklava', course: 'dessert' })
      .build();
    const cassoulet = recipeMother
      .withBasicInfo('Cassoulet')
      .withManyIngredients()
      .build();
    const stew = recipeMother
      .withBasicInfo('Slow-cooked Lamb Stew')
      .withManySteps()
      .build();
    const { fixture } = mountPictureGallery({
      recipes: [baklava, cassoulet, stew],
    });
    await fixture.whenStable();

    expect(pictureSources(fixture.nativeElement)).toEqual([
      baklava.pictureUri,
      cassoulet.pictureUri,
      stew.pictureUri,
    ]);
  });

  it('shows the picture of each recipe', async () => {
    const { fixture } = mountPictureGallery({ recipes: [hummus, salad] });
    await fixture.whenStable();

    expect(pictureSources(fixture.nativeElement)).toEqual([
      hummus.pictureUri,
      salad.pictureUri,
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
    ).toBe(`/recipes/${hummus.id}`);
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
