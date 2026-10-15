/**
 * Build Script for @goadminuiux/calculator
 * Generates UMD, ESM, and Minified production bundles.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const terser = require('terser');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Read dist/calculator.js and generate dist/calculator.min.js
const umdCode = fs.readFileSync(path.join(distDir, 'calculator.js'), 'utf8');

terser.minify(umdCode, {
    compress: { drop_console: false },
    mangle: true,
    output: { comments: /^!|@license|@goadminuiux/ },
    sourceMap: {
        filename: 'calculator.min.js',
        url: 'calculator.min.js.map'
    }
}).then(minified => {
    fs.writeFileSync(path.join(distDir, 'calculator.min.js'), minified.code);
    if (minified.map) {
        fs.writeFileSync(path.join(distDir, 'calculator.min.js.map'), minified.map);
        console.log('✔ Built dist/calculator.min.js.map (' + minified.map.length + ' bytes)');
    }
    console.log('✔ Built dist/calculator.min.js (' + minified.code.length + ' bytes)');
    console.log('✔ All builds generated successfully in dist/');
}).catch(err => {
    console.error('Build error:', err);
    process.exit(1);
});
