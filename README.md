# chempict
Create chemical pictures for the web.

## Usage

This is a node app which provide:

- a SMILES parser

## Dependencies

The google closure library is used in this package, it is listed in the devDependencies of the the npm package, so, to install it, just run `npm i` from the root folder.

eslint: lint javascript code
esformatter: format js code

## `npm` scripts

- lint javascript with eslint: `npm run lint`
- format javascript with esformatter: `npm run format`

## TODO

- Implement vectorization with [simd.js](https://hacks.mozilla.org/2014/10/introducing-simd-js/) see also <https://hacks.mozilla.org/2015/12/bringing-the-power-of-simd-js-to-gl-matrix/>

## Credits

This project is a fork of the [kemia](http://kemia.github.io/) project, which is a reaction editor written in javascript and compiled using the google closure compiler.
