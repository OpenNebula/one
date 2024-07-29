/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
 *                                                                           *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may   *
 * not use this file except in compliance with the License. You may obtain   *
 * a copy of the License at                                                  *
 *                                                                           *
 * http://www.apache.org/licenses/LICENSE-2.0                                *
 *                                                                           *
 * Unless required by applicable law or agreed to in writing, software       *
 * distributed under the License is distributed on an "AS IS" BASIS,         *
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  *
 * See the License for the specific language governing permissions and       *
 * limitations under the License.                                            *
 * ------------------------------------------------------------------------- */
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
  `,
}
