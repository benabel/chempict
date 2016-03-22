/*
 * Layout should follow ACS setting 1996
 * see
 https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Chemistry/Structure_drawing#Suggested_molecule_editor_settings

   The ACS settings are as follows:

     Chain angle: 120 degrees
     Bond spacing: 18% of length
     Bond length: 0.508 cm (14.4 pt)
     Bold width: 0.071 cm (2 pt)
     Line width: 0.021 cm (0.6 pt)
     Margin width: 0.056 cm (1.6 pt)
     Hash spacing: 0.088 cm (2.5 pt)
     Captions: Arial 10 pt
     Atom labels: Arial 10 pt
     Bond angles and length: “fixed” is recommended

 Also recommended: For minus symbols on atoms, change the font for the minus symbol to “Symbol” for
 clarity.
 */
'use strict';

// Units conversion in svg
// https://www.w3.org/TR/SVG/coords.html#Units
const ptToPx = 1.25;

const config = {
  bgColor: 'white',
  fontSize: 10,
  bondLength: 14.4,
  bondSpacing: 0.18 * 14.4,
  lineWidth: 0.6,
  marginWidth: ptToPx * 1.6
};

module.exports = config;
