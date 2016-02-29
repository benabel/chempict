'use strict';

const svgConfig = require('./config');

// svg string
let sb = '';

class SvgDepict {
  constructor(mol, config = svgConfig) {
    this.mol = mol;
    this.config = config;
    this.sizeCalculator();
  }

  sizeCalculator() {
    let margin = this.config.marginWidth;
    this.scale = this.config.bondLength / this.mol.getAverageBondLength();
    let box = this.mol.getBoundingBox();  // getters: top bottom left right
    // translations
    this.dx = margin + this.scale * box.left;
    this.dy = margin + this.scale * box.top;
    // size
    this.w = 2 * margin + this.scale * (box.right - box.left);
    this.h = 2 * margin + this.scale * (box.bottom - box.top);
  }

  writeHeader() {
    sb += `
  <svg version="1.2"
       baseProfile="full"
       width="${this.w}" height="${this.h}"
       xmlns="http://www.w3.org/2000/svg">
  `;
  };

  _drawAtom(element) {
    let symb = element.symbol;
    let coord = element.coord;
    let fontSize = this.config.fontSize;
    let x = coord.x * this.scale - this.dx;
    let y = coord.y * this.scale - this.dy;
    y += 3 * fontSize / 8;  // vertical alignment
    sb += `<text x="${x}" y="${y}" font-family="Arial"
        font-size="${fontSize}"
        text-anchor="middle" fill="black">${symb}</text>\n`;
  }

  drawAtoms() { this.mol.atoms.forEach(this._drawAtom, this); };

  _drawBond(bond) {
    let x1 = bond.source.coord.x * this.scale - this.dx;
    let y1 = bond.source.coord.y * this.scale - this.dy;
    let x2 = bond.target.coord.x * this.scale - this.dx;
    let y2 = bond.target.coord.y * this.scale - this.dy;

    sb += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="black"
    stroke-width="${this.config.lineWidth}"/>\n`;
  };

  drawBonds() { this.mol.bonds.forEach(this._drawBond, this); };

  toSvg() {
    // console.log(this.config);
    this.writeHeader();
    sb += '<rect width="100%" height="100%" fill="white"/>\n';
    this.drawAtoms();
    this.drawBonds();
    return sb + '</svg>';
  };
}

module.exports = SvgDepict;
