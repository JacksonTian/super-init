'use strict';

const readline = require('readline');
const cp = require('child_process');

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

exports.finish = function (writable) {
  return new Promise((resolve, reject) => {
    const onfinish = () => {
      cleanup();
      resolve();
    };

    const onerror = (err) => {
      cleanup();
      reject(err);
    };

    function cleanup() {
      writable.removeListener('error', onerror);
      writable.removeListener('finish', onfinish);
    }

    writable.on('finish', onfinish);
    writable.on('error', onerror);
  });
};
