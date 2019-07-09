    
'use strict';

const chalk = require('chalk');
const Task = require('ember-cli/lib/models/task');
const Builder = require('../models/builder');
const path = require('path');
const fs = require('fs');
const rimraf = require('rimraf');

const TARGET_LEGACY = 'LEGACY';
const TARGET_MODERN = 'MODERN';
//
// A task that builds out the Ember app shimmed to run in electron,
// optionally assembles the app into an electron forge-compatible project, and
// optionally symlinks node_modules to the project's node_modules.
//


function patchVendorNode(fileName) {
  const text = fs.readFileSync(fileName, { encoding: 'utf8'});
  var crypto = require('crypto');

  const hash_sha256 = crypto.createHash('sha256');
  const hash_sha512 = crypto.createHash('sha512');

  const append = `
  ;window.mainContext = window;
  `

  let result = text.split('=this.Ember=this.Ember').join('=window.Ember=window.Ember');

  const prepend = `
  ;
  window.define = define;
  window.runningTests = runningTests;
  window.require = require;
  `;

  const data = append.trim() + result + prepend.trim();
  hash_sha256.update(data);
  hash_sha512.update(data);

  fs.writeFileSync(fileName, data);
  const integrityString = `sha256-${hash_sha256.digest('base64')} sha512-${hash_sha512.digest('base64')}`;

  return integrityString;
}

function extractFallbackScripts(entry) {
  const parse5 = require('parse5');

  const legacyIndex = fs.readFileSync(path.join(entry, 'index.fb.html'), { encoding: 'utf8' });
  const document = parse5.parse(legacyIndex);

  const scripts = [];
  document.childNodes.forEach((node)=>{
    if (node.tagName === 'html') {
      node.childNodes.forEach((nod)=>{
        if (nod.tagName === 'body') {
          nod.childNodes.forEach((n)=>{
            if (n.tagName === 'script') {
              n.attrs.forEach((attr)=>{
                if (attr.name === "src") {
                  attr.value = attr.value.replace('.js','.fb.js');
                }
              });
              n.attrs.push({
                name: 'nomodule',
                value: ''
              })
              scripts.push(n);
            }
          });
        }
      })
    }
  });

  return scripts;
}

function dropUnusedFiles(entry) {
  fs.unlinkSync(path.join(entry, 'index.fb.html'));
}

function cleanupOutputPath(entry) {
  rimraf.sync(entry);
}

function syncIndex(entry) {
  // return '2eqdsadsda');
  const parse5 = require('parse5');

  const fallbackScripts = extractFallbackScripts(entry);
  const index = fs.readFileSync(path.join(entry, 'index.html'), { encoding: 'utf8' });
  const document = parse5.parse(index);

  document.childNodes.forEach((nod)=>{
    if (nod.tagName === 'html') {
      nod.childNodes.forEach((node) => {
        if (node.tagName === 'body') {
          node.childNodes.forEach((n)=>{
            if (n.tagName === 'script') {
              let newIntegrity = null;
              n.attrs.forEach((attr)=>{
                if (attr.name === 'src') {
                  if (attr.value.includes('/vendor-')) {
                    newIntegrity = patchVendorNode(path.join(entry, attr.value));
                  }
                }
              });
              if (newIntegrity) {
                n.attrs.forEach((attr)=>{
                  if (attr.name === 'integrity') {
                    attr.value = newIntegrity;
                  }
                });
              }
              n.attrs.push({
                name: 'type',
                value: 'module'
              })
            }
          });
          fallbackScripts.forEach((scr) => {
            node.childNodes.push(scr);
          })
        }
      })
    }
  });

  const html = parse5.serialize(document);
  const fixedHtml = html.split('nomodule=""').join('nomodule');

  // 
  fs.writeFileSync(path.join(entry, 'index.html'), require('js-beautify').html(fixedHtml));
}

function createDummyBuilder() {
  const tmp = require('tmp');
  var tmpobj = tmp.dirSync();
  // console.log('Dir: ', tmpobj.name);
  // Manual cleanup
  tmpobj.removeCallback();
  tmpobj.outputPath = tmpobj.name;
  tmpobj.cleanup = function() {
    return new Promise((resolve)=>{
      tmpobj.removeCallback();
      resolve();
    });
  }
  return tmpobj;
}

function buildsMerger({outputPath}) {
  const { Builder } = require('broccoli');
  const Merge = require('broccoli-merge-trees');
  

  const Funnel = require('broccoli-funnel');
  const legacyTree = path.join(outputPath, 'legacy');
  const modernTree = path.join(outputPath, 'modern');
  const { rename } = require('broccoli-stew');

  const legacyNonJsFiles = new Funnel(legacyTree, {
    exclude: ['**/*.js', '**/index.html']
  });

  const legacyIndexHtml = new Funnel(legacyTree, {
    include: ['**/index.html']
  });
  const legacyJs = new Funnel(legacyTree, {
    include: ['**/*.js']
  });
  const renamedLagacyJs = rename(legacyJs, '.js', '.fb.js');
  const renamedLagacyHtml = rename(legacyIndexHtml, '.html', '.fb.html');

  const modernNonJsFiles = new Funnel(modernTree, {
    exclude: ['**/*.js', '**/index.html']
  });

  const modernIndexHtml = new Funnel(modernTree, {
    include: ['**/index.html']
  });

  const modernJs = new Funnel(modernTree, {
    include: ['**/*.js']
  });

  const tree = new Merge([legacyNonJsFiles, modernNonJsFiles, renamedLagacyJs, modernIndexHtml,  modernJs, renamedLagacyHtml], { overwrite: true });
  const builder = new Builder(tree);
  return builder;
}

class BuildTask extends Task {
  // platform is only used when assembling
  run({ outputPath, environment, symlinkNodeModules }) {
    
    let { ui, project } = this;

    let progressMessage;
    let successMessage;

    progressMessage = 'Building';
    successMessage = 'Built';

    ui.startProgress(chalk.green(progressMessage), chalk.green('.'));
    const dummyBuilder = createDummyBuilder();

    let builder = new Builder({
      ui,
      outputPath: path.join(dummyBuilder.outputPath, 'legacy'),
      environment,
      buildTarget: TARGET_LEGACY,
      symlinkNodeModules,
      project,
    });

    return builder.build()
      .then(() => {
        return builder.cleanup().then(()=>{
          builder = new Builder({
            ui,
            outputPath: path.join(dummyBuilder.outputPath, 'modern'),
            environment,
            buildTarget: TARGET_MODERN,
            symlinkNodeModules,
            project,
          });
          return builder.build().then(()=>{
           return builder.cleanup().then(()=>{
              const bd = buildsMerger({outputPath: dummyBuilder.outputPath});
              const TreeSync = require('tree-sync');

              return bd.build().then(()=>{
                syncIndex(bd.outputPath);
                dropUnusedFiles(bd.outputPath);
                cleanupOutputPath(outputPath);
                // rimraf.sync(outputPath);
                const outputTree = new TreeSync(bd.outputPath, path.join(outputPath));
                outputTree.sync()
                ui.writeLine();
                ui.stopProgress();
                ui.writeLine(chalk.green(`${successMessage} multibuild project successfully. Stored in "${outputPath}".`));   
                return dummyBuilder.cleanup().then(()=>{
                  return bd.cleanup();
                });
              });
            })
          }).catch((err) => {
            ui.stopProgress();
            ui.writeLine(chalk.red('Build failed.'));
            
            throw err;
          });
        })
      })
      .catch((err) => {
        ui.stopProgress();
        ui.writeLine(chalk.red('Build failed.'));
        
        throw err;
      });
  }
}

module.exports = BuildTask;