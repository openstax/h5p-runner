import { H5P as H5PStandalone } from 'h5p-standalone';
import 'h5p-standalone/dist/frame.bundle'
import './vendor/styles/h5p.css'
import queryString from 'query-string';

declare global {
  // H5PStandalone adds this
  interface Window { H5P: any; H5PIntegration: any; }
}

const H5PIntegration = window.H5PIntegration;
const H5P = window.H5P;

// current path with a slash on the end (runner directory)
const basePath = location.pathname.replace(/\/+$/, '/');

// the H5PStandalone version of this is hardcoded to use iframe display,
// we're overriding with inline display
H5PStandalone.prototype.initElement = function(el: HTMLElement) {
  if (!(el instanceof HTMLElement)) {
    throw new Error('createH5P must be passed an element');
  }
  const parent = document.createElement('div');
  parent.classList.add('h5p-content');
  parent.setAttribute('data-content-id', `${this.id}`);

  el.append(parent);
}
H5PStandalone.prototype.initH5P = async function(generalIntegrationOptions: any, contentOptions: any, customOptions: any) {
  this.h5p = await this.getJSON(`${this.h5pJsonPath}/h5p.json`);

  const content = await this.getJSON(`${this.contentUrl}/content.json`);
  H5PIntegration.pathIncludesVersion = this.pathIncludesVersion = await this.checkIfPathIncludesVersion();

  this.mainLibrary = await this.findMainLibrary();

  const dependencies = await this.findAllDependencies();

  const { styles, scripts } = this.sortDependencies(dependencies, customOptions);

  H5PIntegration.urlLibraries = this.librariesPath;
  H5PIntegration.contents = H5PIntegration.contents ? H5PIntegration.contents : {};

  H5PIntegration.core = {
    styles: generalIntegrationOptions.coreStyles,
    scripts: generalIntegrationOptions.coreScripts
  };

  /*
   * begin added stuff to handle loading scripts for embed type `div`
   */
  for (const script of scripts) {
    await new Promise<void>(resolve => {
      var scriptTag = document.createElement('script');
      scriptTag.setAttribute('src', script);
      scriptTag.onload = () => resolve();
      document.head.appendChild(scriptTag);
    });
  }
  for (const style of styles) {
    var styleTag = document.createElement('link');
    styleTag.setAttribute('href', style);
    styleTag.setAttribute('rel', 'stylesheet');
    document.head.appendChild(styleTag);
  }
  /*
   * end added stuff
   */

  H5PIntegration.contents[`cid-${this.id}`] = {
    library: `${this.mainLibrary.machineName} ${this.mainLibrary.majorVersion}.${this.mainLibrary.minorVersion}`,
    jsonContent: JSON.stringify(content),
    styles: styles,
    scripts: scripts,
    displayOptions: contentOptions.displayOptions,
    contentUrl: this.contentUrl,
    metadata: {}
  };

  for (const key in contentOptions) {
    if (H5PIntegration.contents[`cid-${this.id}`][key] == undefined) { //this is just a guard
      H5PIntegration.contents[`cid-${this.id}`][key] = contentOptions[key];
    }
  }

  // add missing content metadata from h5p.json
  for (const key in this.h5p) {
    if (H5PIntegration.contents[`cid-${this.id}`]?.['metadata']?.[key] === undefined) {
      H5PIntegration.contents[`cid-${this.id}`]['metadata'][key] = this.h5p[key]
    }
  }

  if (!generalIntegrationOptions.preventH5PInit) {
    H5P.init();
  }
}

const el = document.getElementById('h5p-container');

const queryParams = queryString.parse(location.search)
const h5pJsonPath = queryParams.content

const options = {
  librariesPath: process.env.LIBRARIES_HOST,
  h5pJsonPath,
  frame: true, // Show frame and buttons below H5P
  copyright: true, // Display copyright button
  icon: true // Display H5P icon
}
new H5PStandalone(el, options);

const logCountElement = document.getElementById('log-count');
const logsElement = document.getElementById('logs');

let logCount = 0;
H5P.externalDispatcher.on('xAPI', function (event: any) {
  logCount++;

  logCountElement.innerText = logCount.toString();

  const codeTag = document.createElement('pre');
  codeTag.innerText = JSON.stringify(event.data.statement, null, 2);
  logsElement.append(codeTag);
});
