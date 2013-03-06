({
  appDir: ".",
  baseUrl: ".",
  dir: "../out",

//  optimize: "uglify2",
//  generateSourceMaps: true,
//  preserveLicenseComments: false,

  optimize: "none",
  useSourceUrl: true,

  fileExclusionRegExp: /(^\.)|(~$)/,
  findNestedDependencies: true,
  optimizeAllPluginResources: true,

  text: {
    env: "node"
  },

  paths: {
    "jquery": "require-jquery",
    "jquery-cookie": "../lib/jquery.cookie",
    "jquery-ui": "../lib/jquery-ui-1.10.0.custom",
    "jquery-iframe-transport": "../lib/jquery.iframe-transport",
    "bootstrap": "../lib/bootstrap.min",
    "gridster": "../lib/jquery.gridster",
    "marked": "../lib/marked",
    "util": "../../../patter/git/src/js/util",
    "appnet": "../../../patter/git/src/js/appnet",
    "appnet-api": "../../../patter/git/src/js/appnet-api",
    "appnet-note": "../../../patter/git/src/js/appnet-note"
  },

  shim: {
    "jquery-cookie": ["jquery"],
    "jquery-ui": ["jquery"],
    "jquery-iframe-transport": ["jquery"],
    "bootstrap": ["jquery"],
    "gridster": ["jquery"],
    "marked": {
      exports: 'marked'
    }
  },

  modules: [
    //Optimize the application files. jQuery is not 
    //included since it is already in require-jquery.js
    {
      name: "js/main",
      exclude: ["jquery"]
    },
    {
      name: "js/embed",
      exclude: ["jquery"]
    }
  ]
})
