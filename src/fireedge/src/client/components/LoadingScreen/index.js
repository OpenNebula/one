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
import { ReactElement } from 'react'

import { Box } from '@mui/material'
import { OpenNebulaLogo } from 'client/components/Icons'

/**
 * Component with OpenNebula logo as spinner in full width and height.
 *
 * @returns {ReactElement} Container with logo inside
 */
const LoadingScreen = () => (
  <Box className="loading_screen">
    <OpenNebulaLogo width={360} height={360} spinner withText />
  </Box>
)

export default LoadingScreen
