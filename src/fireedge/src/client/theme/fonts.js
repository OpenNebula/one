import { STATIC_FILES_URL } from 'client/constants'

export const UbuntuFont = {
  fontFamily: 'Ubuntu',
  fontStyle: 'normal',
  fontWeight: 400,
  src: `
    local('Ubuntu'), local('Ubuntu Regular'), local('Ubuntu-Regular'),
    url(${STATIC_FILES_URL}/fonts/Ubuntu/ubuntu.eot?#iefix) format('embedded-opentype'),
    url(${STATIC_FILES_URL}/fonts/Ubuntu/ubuntu.woff2) format('woff2'),
    url(${STATIC_FILES_URL}/fonts/Ubuntu/ubuntu.woff) format('woff'),
    url(${STATIC_FILES_URL}/fonts/Ubuntu/ubuntu.ttf) format('truetype'),
    url(${STATIC_FILES_URL}/fonts/Ubuntu/ubuntu.svg#Ubuntu) format('svg');
  `
}
