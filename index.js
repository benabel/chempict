require('./node_modules/google-closure-library/closure/goog/bootstrap/nodejs');

const fs = require('fs')
const SmilesParser = require('./src/io/smiles_parser');
const CoordinateGenerator = require('./src/layout/coordinate_generator');
const SvgDepict = require('./src/depict/svg_depict');

//console.log(SmilesParser);
const smiles = 'N[C@@H](CCC(=O)N[C@@H](CSSC[C@H](NC(=O)CC[C@H](N)C(O)=O)C(=O)NCC(O)=O)C(=O)NCC(O)=O)C(O)=O';
//const smiles = 'CCCC(O)=O';
//const smiles = 'O=C=O';
var mol = SmilesParser.parse(smiles);
//console.log(mol.atoms);

CoordinateGenerator.generate(mol);

var svg = SvgDepict.toSvg(100, 100, mol)

fs.writeFile("/home/ben/Bureau/mol.svg", svg, function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("Le svg est enregistré sur le Bureau");
});
