import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { page } from 'vitest/browser';
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

describe(PictureGallery, () => {
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
    mountPictureGallery({
      recipes: [baklava, cassoulet, stew],
    });

    await expect
      .poll(pictureSources)
      .toEqual([baklava.pictureUri, cassoulet.pictureUri, stew.pictureUri]);
  });

  it('shows the picture of each recipe', async () => {
    mountPictureGallery({ recipes: [hummus, salad] });

    await expect
      .poll(pictureSources)
      .toEqual([hummus.pictureUri, salad.pictureUri]);
  });

  it('describes each picture with the recipe name', async () => {
    mountPictureGallery({ recipes: [salad] });

    await expect
      .element(page.getByRole('img'))
      .toHaveAttribute('alt', 'Burnt Aubergine with Tahini and Pomegranate');
  });

  it('links each picture to the recipe detail page', async () => {
    mountPictureGallery({ recipes: [hummus] });

    await expect
      .element(page.getByRole('img', { name: 'Hummus with Ful' }))
      .toBeVisible();
    await expect
      .element(page.getByTestId('gallery-item'))
      .toHaveAttribute('href', `/recipes/${hummus.id}`);
  });

  it('shows a message when there are no pictures', async () => {
    mountPictureGallery({ recipes: [] });

    await expect
      .element(page.getByTestId('no-recipes-message'))
      .toMatchTextContent('No pictures to show');
  });
});

function mountPictureGallery({
  recipes = [hummus, salad],
}: { recipes?: Recipe[] } = {}) {
  TestBed.configureTestingModule({
    providers: [provideRouter([]), provideRecipeRepositoryFake()],
  });

  TestBed.inject(RecipeRepositoryFake).setRecipes(recipes);

  TestBed.createComponent(PictureGallery);
}

function pictureSources() {
  return page
    .getByRole('img')
    .elements()
    .map((img) => img.getAttribute('src') ?? '');
}
