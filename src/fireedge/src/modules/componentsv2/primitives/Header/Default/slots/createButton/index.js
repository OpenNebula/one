/* ------------------------------------------------------------------------- *
 * Copyright 2002-2026, OpenNebula Project, OpenNebula Systems               *
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

import { forwardRef, Component } from 'react'
import { Box } from '@mui/material'
import { getStyles } from '@modules/componentsv2/primitives/Header/Default/slots/createButton/styles'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { Plus } from 'iconoir-react'
import { useFunctionality } from '@FeaturesModule'
import { useHistory } from 'react-router-dom'

/**
 * CreateButtonSlot component.
 *
 * @returns {Component} - CreateButtonSlot component
 */
export const CreateButtonSlot = forwardRef((_, ref) => {
  const { createPath } = useFunctionality()
  const history = useHistory()
  const { label = '', path = '' } = createPath

  if (!label || !path) return null

  return (
    <Box
      sx={(theme) =>
        getStyles({
          theme,
        })
      }
      ref={ref}
    >
      <Button
        startIcon={<Plus />}
        type="primary"
        size="small"
        className="create-button"
        data-cy="action-create_dialog"
        onClick={() => history.push(path)}
        title={label}
      />
    </Box>
  )
})

CreateButtonSlot.displayName = 'CreateButtonSlot'
