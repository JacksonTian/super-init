'use strict';

const path = require('path');
const fs = require('fs');
const {
  mkdirp,
  question,
  writeFile,
  appendFile,
  exec
} = require('./helper');

const questionPatt = /{{([^}]+)}}/g;

class Skeleton {
  constructor(rootDir) {
    this.rootDir = '';
    this.snippets = [];
    this.files = [];
    this.dirs = [];
    this.execs = [];
  }

  setRoot(dir) {
    this.rootDir = dir;
  }

  snippet(filePath, content, type) {
    this.snippets.push({
      target: filePath,
      content: content,
      type
    });
  }

  append(filePath, content) {
    this.snippet(filePath, content, 'append');
  }

  exec(action) {
    this.execs.push({
      cmd: action
    });
  }

  dir(targetDir, source) {
    this.dirs.push({
      target: targetDir,
      source: source
    });
  }

  async ensureRoot(rootDir) {
    if (!rootDir) {
      rootDir = await question(`未指定应用根目录，请输入路径(默认: ${process.cwd()})：`);
      rootDir = rootDir || process.cwd();
    }

    rootDir = path.resolve(rootDir);
    var exists = fs.existsSync(rootDir);
    if (!exists) {
      var answer = await question(`目录${rootDir}不存在，将创建该目录，并以此作为根目录？Y/n? `);
      if (answer === 'Y' || answer === '') {
        this.setRoot(rootDir);
        await mkdirp(this.rootDir);
      } else {
        await this.ensureRoot();
      }
    } else {
      var answer = await question(`目录${rootDir}已存在，以此作为根目录？Y/n? `);
      if (answer === 'Y' || answer === '') {
        this.setRoot(rootDir);
      } else {
        await this.ensureRoot();
      }
    }
  }

  async run() {
    var argv = process.argv.slice(2);
    var rootDir = argv[0];

    await this.ensureRoot(rootDir);

    for (let i = 0; i < this.snippets.length; i++) {
      let snippet = this.snippets[i];
      let target = path.join(this.rootDir, snippet.target);
      let dir = path.dirname(target);
      var made = await mkdirp(dir);
      let content = snippet.content.trimLeft();

      if (!content.endsWith('\n')) {
        content = content + '\n';
      }

      let matched;
      let index = 0;
      let parts = [];
      while ((matched = questionPatt.exec(content))) {
        let prompt = matched[0];
        parts.push(content.substring(index, matched.index));
        var answer = await question(matched[1]);
        parts.push(answer);
        index += matched.index + prompt.length;
      }

      if (parts.length) {
        parts.push(content.substring(index));
        content = parts.join('');
      }

      if (snippet.type === 'append') {
        content = '\n' + content;
        // eof blank line
        await appendFile(target, content);
      } else {
        if (fs.existsSync(target)) {
          var answer = await question(`文件${target}已存在，覆盖？y/N? `);
          if (answer === 'y') {
            await writeFile(target, content);
          } else {
            console.log(`跳过文件：${target}`)
          }
        } else {
          await writeFile(target, content);
        }
      }
    }

    for (let i = 0; i < this.dirs.length; i++) {
      let action = this.dirs[i];
      let targetDir = path.join(this.rootDir, action.target);
      await mkdirp(targetDir);
      if (action.source) {
        this.exec(`cp -rf ${action.source}/* ${targetDir}/`);
      }
    }

    for (let i = 0; i < this.execs.length; i++) {
      let action = this.execs[i];
      await exec(action.cmd, {
        cwd: this.rootDir
      });
    }
  }
}

module.exports = Skeleton;
