import type { Course } from '@whiskmate/shared-recipe/model';

export const recipeDiscoverRouterHelper = {
  DISCOVER_PATH: 'discover' as const,

  discover() {
    return ['/', this.DISCOVER_PATH];
  },

  course(course: Course) {
    return ['/', this.DISCOVER_PATH, 'courses', course];
  },

  quick() {
    return ['/', this.DISCOVER_PATH, 'quick'];
  },

  today() {
    return ['/', this.DISCOVER_PATH, 'today'];
  },

  favorites() {
    return ['/', this.DISCOVER_PATH, 'favorites'];
  },

  surprise() {
    return ['/', this.DISCOVER_PATH, 'surprise'];
  },

  recentlyViewed() {
    return ['/', this.DISCOVER_PATH, 'recently-viewed'];
  },

  ingredients() {
    return ['/', this.DISCOVER_PATH, 'ingredients'];
  },

  pantry() {
    return ['/', this.DISCOVER_PATH, 'pantry'];
  },

  menuBuilder() {
    return ['/', this.DISCOVER_PATH, 'menu-builder'];
  },

  alphabetical() {
    return ['/', this.DISCOVER_PATH, 'a-z'];
  },

  fiveIngredients() {
    return ['/', this.DISCOVER_PATH, 'five-ingredients'];
  },

  threeSteps() {
    return ['/', this.DISCOVER_PATH, 'three-steps'];
  },

  weekendProjects() {
    return ['/', this.DISCOVER_PATH, 'weekend-projects'];
  },

  simplest() {
    return ['/', this.DISCOVER_PATH, 'simplest'];
  },

  ingredientSpotlight() {
    return ['/', this.DISCOVER_PATH, 'ingredient-spotlight'];
  },

  collections() {
    return ['/', this.DISCOVER_PATH, 'collections'];
  },

  catalog() {
    return ['/', this.DISCOVER_PATH, 'catalog'];
  },

  gallery() {
    return ['/', this.DISCOVER_PATH, 'gallery'];
  },
};
