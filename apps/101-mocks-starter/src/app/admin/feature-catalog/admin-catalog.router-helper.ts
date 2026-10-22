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
};
