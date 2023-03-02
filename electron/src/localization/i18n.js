const path = require("path")
const electron = require('electron')
const fs = require('fs');
let loadedLanguage;
let app = electron.app ? electron.app : electron.remote.app

module.exports = i18n;

console.log("i18n file ")
//console.log({app})
//console.log(" app.getLocale() " +  app.getLocale())

/** */
function i18n() {
  console.log("i18n: app.getLocale() = " +  app.getLocale())
  console.log("i18n: app.getLocaleCountryCode() = " +  app.getLocaleCountryCode())
  const locale = app.getLocale();
  //locale = locale? "fr" : undefined;
  if(fs.existsSync(path.join(__dirname, locale + '.json'))) {
    loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, locale + '.json'), 'utf8'))
  }
  else {
    loadedLanguage = JSON.parse(fs.readFileSync(path.join(__dirname, 'en.json'), 'utf8'))
  }
}

i18n.prototype.msg = function(phrase) {
  let translation = loadedLanguage[phrase]
  if(translation === undefined) {
    translation = phrase
  }
  //console.log("i18n.msg: " + phrase + " => " + translation);
  return translation
}
