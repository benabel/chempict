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
    let x = (coord.x - dx) * 100 / w;
    let y = (coord.y - dy) * 100 / h;
    sb +=
        `<text x="${x}" y="${y}" font-family="Verdana" font-size="${fontSize}" text-anchor="middle" fill="black">${symb}</text>\n`;
  }
  mol.atoms.forEach(svgtxt);
};

svgDepict.drawBonds = function(mol) {};

svgDepict.toSvg = function(w, h, mol) {
  this.writeHeader(w, h);
  sb += '<rect width="100%" height="100%" fill="white"/>\n';
  // const matrix = this.trans
  this.drawAtoms(mol, 1);
  return sb + '</svg>';
};
