'use strict';

require('../node_modules/google-closure-library/closure/goog/bootstrap/nodejs');

// const fs = require('fs');
const SmilesParser = require('../src/io/smiles_parser');
const CoordinateGenerator = require('../src/layout/coordinate_generator');
const SvgDepict = require('../src/depict/svg');

const smiles = [
  'N[C@@H](CCC(=O)N[C@@H](CSSC[C@H](NC(=O)CC[C@H](N)C(O)=O)C(=O)NCC(O)=O)C(=O)NCC(O)=O)C(O)=O',
  'O=C(O)c1ccccc1OC(=O)C', 'CC(=O)OC1=CC=CC=C1C(=O)O',
  'C([C@@H]1[C@@H]([C@@H]([C@H]([C@@H](O1)O[C@@H]2[C@H](O[C@H]([C@@H]([C@H]2O)O)O)CO)O)O)O)O',
  'CCCC(O)=O', 'O=C=O'
];

for (var i = 0; i < smiles.length; i++) {
  const smi = smiles[i];
  const mol = SmilesParser.parse(smi);
  CoordinateGenerator.generate(mol);
  const o = new SvgDepict(mol);
  o.toSvg();
}

// // write svg file
// fs.writeFile('/home/ben/Bureau/mol.svg', svg, function(err) {
//   if (err) {
//     return console.log(err);
//   }
//   console.log('Le svg est enregistré sur le Bureau');
// });
