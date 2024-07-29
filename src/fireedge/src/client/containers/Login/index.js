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

import OpenNebula from 'client/containers/Login/Opennebula'
import Remote from 'client/containers/Login/Remote'
import { ReactElement } from 'react'

/**
 * Displays the login form and handles the login process.
 *
 * @returns {ReactElement} The login form.
 */
const Login = () =>
  window?.__REMOTE_AUTH__?.remote ? (
    <Remote data={window?.__REMOTE_AUTH__} />
  ) : (
    <OpenNebula />
  )

export default Login
