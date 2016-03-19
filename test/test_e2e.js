'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

// this code comes from http://stackoverflow.com/a/22649812/1919130
function runScript(scriptPath, callback) {
  // keep track of whether callback has been invoked to prevent multiple invocations
  var invoked = false;

  var process = childProcess.fork(scriptPath);

  // listen for errors as they may prevent the exit event from firing
  // process.on('error', function(err) {
  //   if (invoked) return;
  //   invoked = true;
  //   callback(err);
  // });

  // execute the callback once the process has finished running
  process.on('exit', function(code) {
    if (invoked) return;
    invoked = true;
    var err = code === 0 ? null : new Error('exit code ' + code);
    callback(err);
  });
}

// Now we can run a script and invoke a callback when complete, e.g.
const E2E_PATH = path.join(path.dirname('__dirname'), 'e2e');

describe('e2e tests', () => {
  describe('run e2e scripts', () => {
    it('will throw error if errors during run', () => {
      fs.readdir(E2E_PATH, (err, files) => {
        for (let i = 0; i < files.length; i++) {
          let p = path.join(E2E_PATH, files[i]);
          runScript(p, function(err) {
            if (err) throw err;
          });
        }
      });
    });
  });
});
