'use strict';

const fs = require('fs');
const readline = require('readline');
const cp = require('child_process');

function promisify(fn) {
  return function (...args) {
    return new Promise((resolve, reject) => {
      fn(...args, function (err, data) {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    });
  };
}

exports.question = function (prompt) {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

exports.mkdirp = promisify(require('mkdirp'));
exports.writeFile = promisify(fs.writeFile);
exports.appendFile = promisify(fs.appendFile);

exports.exec = function(...args) {
  return new Promise((resolve, reject) => {
    cp.exec(...args, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }
      resolve([stdout, stderr]);
    });
  });
};
