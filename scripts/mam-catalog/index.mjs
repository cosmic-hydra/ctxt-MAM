/**
 * MAM Catalog index — aggregates all 20 domain modules.
 * Order here defines display order in docs and the generated registry.
 */
import frontend from './frontend.mjs';
import backend from './backend.mjs';
import database from './database.mjs';
import dataPlatform from './data-platform.mjs';
import ml from './ml.mjs';
import mobile from './mobile.mjs';
import devops from './devops.mjs';
import cloud from './cloud.mjs';
import security from './security.mjs';
import quality from './quality.mjs';
import performance from './performance.mjs';
import observability from './observability.mjs';
import api from './api.mjs';
import architecture from './architecture.mjs';
import refactoring from './refactoring.mjs';
import debugging from './debugging.mjs';
import docs from './docs.mjs';
import research from './research.mjs';
import product from './product.mjs';
import release from './release.mjs';

export const MAM_DOMAINS = [
  frontend,
  backend,
  database,
  dataPlatform,
  ml,
  mobile,
  devops,
  cloud,
  security,
  quality,
  performance,
  observability,
  api,
  architecture,
  refactoring,
  debugging,
  docs,
  research,
  product,
  release,
];

export default MAM_DOMAINS;
