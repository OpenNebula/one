import { FONTS_URL } from 'client/constants'

export const UbuntuFont = {
  fontFamily: 'Ubuntu',
  fontStyle: 'normal',
  fontWeight: 400,
  src: `
    local('Ubuntu'), local('Ubuntu Regular'), local('Ubuntu-Regular'),
    url(${FONTS_URL}/Ubuntu/ubuntu.eot?#iefix) format('embedded-opentype'),
    url(${FONTS_URL}/Ubuntu/ubuntu.woff2) format('woff2'),
    url(${FONTS_URL}/Ubuntu/ubuntu.woff) format('woff'),
    url(${FONTS_URL}/Ubuntu/ubuntu.ttf) format('truetype'),
    url(${FONTS_URL}/Ubuntu/ubuntu.svg#Ubuntu) format('svg');
  `
}
