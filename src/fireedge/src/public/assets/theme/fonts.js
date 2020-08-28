import ubuntuEot from 'client/assets/fonts/Ubuntu/ubuntu.eot';
import ubuntuSvg from 'client/assets/fonts/Ubuntu/ubuntu.svg';
import ubuntuTtf from 'client/assets/fonts/Ubuntu/ubuntu.ttf';
import ubuntuWoff from 'client/assets/fonts/Ubuntu/ubuntu.woff';
import ubuntuWoffTwo from 'client/assets/fonts/Ubuntu/ubuntu.woff2';

const UbuntuFont = {
  fontFamily: 'Ubuntu',
  fontStyle: 'normal',
  fontWeight: 400,
  src: `
    local('Ubuntu'), local('Ubuntu Regular'), local('Ubuntu-Regular'),
    url(/static/${ubuntuEot}?#iefix) format('embedded-opentype'),
    url(/static/${ubuntuWoffTwo}) format('woff2'),
    url(/static/${ubuntuWoff}) format('woff'),
    url(/static/${ubuntuTtf}) format('truetype'),
    url(/static/${ubuntuSvg}#Ubuntu) format('svg');
  `
};

export default UbuntuFont;

/*
  src: url('webfont.eot?#iefix') format('embedded-opentype'), -> IE6-IE8
  url('webfont.woff2') format('woff2')                        -> Super Modern Browsers
  url('webfont.woff') format('woff')                          -> Pretty Modern Browsers
  url('webfont.ttf')  format('truetype')                      -> Safari, Android, iOS
  url('webfont.svg#svgFontName') format('svg')                -> Legacy iOS
 */
