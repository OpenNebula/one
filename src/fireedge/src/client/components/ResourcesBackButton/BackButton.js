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

import { Grid, IconButton } from '@mui/material'
import NavArrowLeft from 'iconoir-react/dist/NavArrowLeft'
import { ReactElement, useCallback } from 'react'
import { useHistory } from 'react-router-dom'

/**
 * Back Button.
 *
 * @returns {ReactElement} BackButton rendered
 */
const BackButton = () => {
  const history = useHistory()

  const handleBackClick = useCallback(() => {
    history.goBack()
  })

  return (
    <Grid container>
      <Grid item>
        <IconButton onClick={handleBackClick}>
          <NavArrowLeft />
        </IconButton>
      </Grid>
    </Grid>
  )
}

export default BackButton
