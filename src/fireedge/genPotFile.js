const { createReadStream, generateFile } = require('fireedge-genpotfile');
const constants = require('./src/utils/constants');
const clientConstants = require('./src/public/constants');

const testFolder = './src/public';
const exportFile = 'test.po';
const definitions = { ...constants, ...clientConstants };

// function Tr()
const optsFunc = {
  regex: /Tr(\("|\('|\()[a-zA-Z0-9_ ]*("\)|'\)|\))/g,
  removeStart: /Tr(\()/g,
  removeEnd: /(\))/g,
  regexTextCaptureIndex: 0,
  definitions
};

// React component <Translate word="word"/>
const optsComponent = {
  regex: /<Translate word=('|"|{|{'|{")[a-zA-Z0-9_ ]*('|"|}|'}|"}) \/>/g,
  removeStart: /<Translate word=('|"|{|{'|{")/g,
  removeEnd: /('|"|}|'}|"}) \/>/g,
  regexTextCaptureIndex: 0,
  definitions
};

createReadStream(testFolder, optsFunc);
createReadStream(testFolder, optsComponent);

generateFile(exportFile);
