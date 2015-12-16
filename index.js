require('./node_modules/google-closure-library/closure/goog/bootstrap/nodejs');

var SmilesParser = require('./src/io/smiles_parser.js');

//console.log(SmilesParser);
// const smiles = 'N[C@@H](CCC(=O)N[C@@H](CSSC[C@H](NC(=O)CC[C@H](N)C(O)=O)C(=O)NCC(O)=O)C(=O)NCC(O)=O)C(O)=O';

const smiles = 'OCO';
var mol = SmilesParser.parse(smiles);
console.log(mol);

// kemia.layout.CoordinateGenerator.generate(mol);

//console.log(SmilesParser);
