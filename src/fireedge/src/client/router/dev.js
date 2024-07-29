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
import { Code as DevIcon } from 'iconoir-react'
import loadable from '@loadable/component'

const TestApi = loadable(() => import('client/containers/TestApi'), {
  ssr: false,
})
const TestForm = loadable(() => import('client/containers/TestForm'), {
  ssr: false,
})

export const PATH = {
  TEST_API: '/test-api',
  TEST_FORM: '/test-form',
}

export const ENDPOINTS = [
  {
    title: 'Test API', // no need to translate
    path: PATH.TEST_API,
    devMode: true,
    sidebar: true,
    icon: DevIcon,
    Component: TestApi,
  },
  {
    title: 'Test Form', // no need to translate
    path: PATH.TEST_FORM,
    devMode: true,
    sidebar: true,
    icon: DevIcon,
    Component: TestForm,
  },
]

export default { PATH, ENDPOINTS }
