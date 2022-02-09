/* ------------------------------------------------------------------------- *
 * Copyright 2002-2022, OpenNebula Project, OpenNebula Systems               *
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
import { useMemo, JSXElementConstructor } from 'react'
import { Stack, FormControl, Button } from '@mui/material'
import { useFormContext } from 'react-hook-form'

import { FormWithSchema, Legend } from 'client/components/Forms'

import { STEP_ID as EXTRA_ID } from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration'
import { SSH_PUBLIC_KEY, SCRIPT_FIELDS, OTHER_FIELDS } from './schema'
import { T } from 'client/constants'

const SSH_KEY_USER = '$USER[SSH_PUBLIC_KEY]'

/** @returns {JSXElementConstructor} - Configuration section */
const ConfigurationSection = () => {
  const { setValue, getValues } = useFormContext()
  const SSH_PUBLIC_KEY_PATH = useMemo(
    () => `${EXTRA_ID}.${SSH_PUBLIC_KEY.name}`,
    []
  )

  const handleClearKey = () => setValue(SSH_PUBLIC_KEY_PATH)

  const handleAddUserKey = () => {
    let currentKey = getValues(SSH_PUBLIC_KEY_PATH)
    currentKey &&= currentKey + '\n'

    setValue(SSH_PUBLIC_KEY_PATH, `${currentKey ?? ''}${SSH_KEY_USER}`)
  }

  return (
    <FormControl component="fieldset" sx={{ width: '100%' }}>
      <Legend title={T.Configuration} />
      <Stack
        display="grid"
        gap="1em"
        sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
      >
        <FormWithSchema
          cy={`${EXTRA_ID}-context-configuration-others`}
          fields={OTHER_FIELDS}
          id={EXTRA_ID}
        />
        <div>
          <FormWithSchema
            cy={`${EXTRA_ID}-context-ssh-public-key`}
            fields={[SSH_PUBLIC_KEY]}
            id={EXTRA_ID}
          />
          <Stack direction="row" gap="1em">
            <Button
              onClick={handleAddUserKey}
              variant="contained"
              data-cy={`${EXTRA_ID}-add-context-ssh-public-key`}
            >
              {T.AddUserSshPublicKey}
            </Button>
            <Button onClick={handleClearKey} variant="outlined">
              {T.Clear}
            </Button>
          </Stack>
        </div>
        <FormWithSchema
          cy={`${EXTRA_ID}-context-script`}
          fields={SCRIPT_FIELDS}
          id={EXTRA_ID}
          rootProps={{ sx: { width: '100%', gridColumn: '1 / -1' } }}
        />
      </Stack>
    </FormControl>
  )
}

export default ConfigurationSection
