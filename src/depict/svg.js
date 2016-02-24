'use strict';

goog.require('goog.graphics');

var svgDepict = function() {};

module.exports = svgDepict;

var sb = '';

svgDepict.writeHeader = function(w, h) {
  sb += `
<svg version="1.2"
     baseProfile="full"
     width="${w}" height="${h}"
     xmlns="http://www.w3.org/2000/svg">
`;
};

svgDepict.drawAtoms = function(mol, fontSize) {
  const box = mol.getBoundingBox();  // getters: top bottom left right
  // translations
  const dx = box.left;
  const dy = box.top;
  // size
  const w = box.right - box.left;
  const h = box.bottom - box.top;
  console.log(dx, dy, w, h);

  function svgtxt(element) {
    let symb = element.symbol;
    let coord = element.coord;
    // TODO: be careful this add deformation
    let x = (coord.x - dx) * width / w;
    let y = (coord.y - dy) * height / h;
    sb +=
        `<text x="${x}" y="${y}" font-family="Verdana" font-size="${fontSize}" text-anchor="middle" fill="black">${symb}</text>\n`;
  }
  mol.atoms.forEach(svgtxt);
};

svgDepict.drawBonds = function(mol) {

  const box = mol.getBoundingBox();  // getters: top bottom left right
  // translations
  const dx = box.left;
  const dy = box.top;
  // size
  const w = box.right - box.left;
  const h = box.bottom - box.top;
  console.log(dx, dy, w, h);

  function drawBond(bond) {
    // console.log('////////////// SOURCE');
    // console.log(bond.source.coord.x, bond.source.coord.y);
    let x1 = bond.source.coord.x;
    let y1 = bond.source.coord.y;
    // console.log('////////////// TARGET');
    let x2 = bond.target.coord.x;
    let y2 = bond.target.coord.y;
    // TODO: be careful this add deformation
    x1 = (x1 - dx) * width / w;
    x2 = (x2 - dx) * width / w;
    y1 = (y1 - dy) * height / h;
    y2 = (y2 - dy) * height / h;
    // console.log(bond.target.coord.x, bond.target.coord.y);
    sb += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black" stroke-width="3"/>\n`;
  }

  mol.bonds.forEach(drawBond);
};

svgDepict.toSvg = function(w, h, mol) {
  this.writeHeader(w, h);
  sb += '<rect width="100%" height="100%" fill="white"/>\n';
  // const matrix = this.trans
  this.drawAtoms(mol, 12);
  this.drawBonds(mol);
  return sb + '</svg>';
};
