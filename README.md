# chempict
Create chemical pictures for the web.

## Usage

This is a node app which provide:

- a SMILES parser
- a coordinate generator
- a [chemdoodle json](https://web.chemdoodle.com/docs/chemdoodle-json-format/) writer

## Dependencies

The google closure library is used in this package, it is listed in the devDependencies of the the npm package, so, to install it, just run `npm i` from the root folder.

eslint: lint javascript code
clang-format: format js code

## `npm` scripts

- lint javascript with eslint: `npm run lint`
- format javascript with clang-format: `npm run format`

## TODO

- Implement vectorization with [simd.js](https://hacks.mozilla.org/2014/10/introducing-simd-js/) see also <https://hacks.mozilla.org/2015/12/bringing-the-power-of-simd-js-to-gl-matrix/>

## Credits

This project is a fork of the [kemia](http://kemia.github.io/) project, which is a reaction editor written in javascript and compiled using the google closure compiler.

The chemdoodle writer is inspired by this blog [post](http://zachcp.org/blog/2015/browserchemistry/) written by [zach charlop-powers](http://zachcp.org/index.html)
