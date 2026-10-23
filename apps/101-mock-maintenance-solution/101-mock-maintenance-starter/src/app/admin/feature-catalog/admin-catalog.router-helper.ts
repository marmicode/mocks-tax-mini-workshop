/**
 * Paths are relative to the admin route.
 */
export const adminCatalogRouterHelper = {
  CATALOG_PATH: 'catalog' as const,

  duplicates() {
    return ['/', 'admin', this.CATALOG_PATH, 'duplicates'];
  },

  quality() {
    return ['/', 'admin', this.CATALOG_PATH, 'quality'];
  },

  courses() {
    return ['/', 'admin', this.CATALOG_PATH, 'courses'];
  },

  ingredients() {
    return ['/', 'admin', this.CATALOG_PATH, 'ingredients'];
  },

  export() {
    return ['/', 'admin', this.CATALOG_PATH, 'export'];
  },

  import() {
    return ['/', 'admin', this.CATALOG_PATH, 'import'];
  },

  missingDescriptions() {
    return ['/', 'admin', this.CATALOG_PATH, 'missing-descriptions'];
  },

  missingSteps() {
    return ['/', 'admin', this.CATALOG_PATH, 'missing-steps'];
  },

  missingIngredients() {
    return ['/', 'admin', this.CATALOG_PATH, 'missing-ingredients'];
  },

  stepHistogram() {
    return ['/', 'admin', this.CATALOG_PATH, 'step-histogram'];
  },

  ingredientHistogram() {
    return ['/', 'admin', this.CATALOG_PATH, 'ingredient-histogram'];
  },

  idAudit() {
    return ['/', 'admin', this.CATALOG_PATH, 'id-audit'];
  },

  longNames() {
    return ['/', 'admin', this.CATALOG_PATH, 'long-names'];
  },

  pictureAudit() {
    return ['/', 'admin', this.CATALOG_PATH, 'picture-audit'];
  },
};
