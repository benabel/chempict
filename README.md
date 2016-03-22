# chempict
Create chemical pictures for the web.

## Install

This is a javascript app that can be run in node and in the browser.

- To install it in node from npm: `npm i chempict`
- To import it in a webpage add a `<script>` tag your webpage:

    <script src="https://npmcdn.com/chempict"></script>

## Usage

It provides:

- a SMILES parser
- a coordinate generator
- a [chemdoodle json](https://web.chemdoodle.com/docs/chemdoodle-json-format/) writer

## Dependencies

eslint: lint and fix javascript code
clang-format: format js code

## `npm` scripts

- lint javascript with eslint: `npm run lint`
- format javascript with clang-format: `npm run format`

## TODO

- Validate jsdoc tags with eslint.
- Generate documentation with jsdoc.
- Implement vectorization with [simd.js](https://hacks.mozilla.org/2014/10/introducing-simd-js/) see also <https://hacks.mozilla.org/2015/12/bringing-the-power-of-simd-js-to-gl-matrix/>

## Guidelines

- Depictions should try to follow [Graphical representation standards for chemical structure diagrams (IUPAC Recommendations 2008)](http://iupac.org/publications/pac/80/2/0277/).

## Credits

This project is a fork of the [kemia](http://kemia.github.io/) project, which is a reaction editor written in javascript and compiled using the google closure compiler.

The google closure library was used in kemia and some parts of it had been included as `utils` modules.

[Webpack](https://github.com/webpack/webpack) is used to bundle a umd js file for web and node usage.

[npmcdn](https://npmcdn.com/) is used to distribute the library for web usage.

The chemdoodle writer is inspired by this blog [post](http://zachcp.org/blog/2015/browserchemistry/) written by [zach charlop-powers](http://zachcp.org/index.html)
