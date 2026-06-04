process.env.DISABLE_ESLINT_PLUGIN = process.env.DISABLE_ESLINT_PLUGIN || 'true';
process.env.GENERATE_SOURCEMAP = process.env.GENERATE_SOURCEMAP || 'false';

require('../node_modules/react-scripts/scripts/build');
