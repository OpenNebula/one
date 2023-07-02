/* ------------------------------------------------------------------------- *
 * Copyright 2002-2023, OpenNebula Project, OpenNebula Systems               *
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
import { ReactElement, useCallback, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack, FormControl, Button } from '@mui/material'
import { useFormContext } from 'react-hook-form'

import { FormWithSchema, Legend } from 'client/components/Forms'
import { SSH_PUBLIC_KEY, SCRIPT_FIELDS, OTHER_FIELDS } from './schema'
import { T } from 'client/constants'

const SSH_KEY_USER = '$USER[SSH_PUBLIC_KEY]'

/**
 * Renders the configuration section to VM Template form.
 *
 * @param {object} props - Props passed to the component
 * @param {string} [props.stepId] - ID of the step the section belongs to
 * @returns {ReactElement} - Configuration section
 */
const ConfigurationSection = ({ stepId }) => {
  const { setValue, getValues } = useFormContext()
  const SSH_PUBLIC_KEY_PATH = useMemo(
    () => [stepId, SSH_PUBLIC_KEY.name].filter(Boolean).join('.'),
    [stepId]
  )

  const getCyPath = useCallback(
    (cy) => [stepId, cy].filter(Boolean).join('-'),
    [stepId]
  )

  const handleClearKey = useCallback(
    () => setValue(SSH_PUBLIC_KEY_PATH),
    [setValue, SSH_PUBLIC_KEY_PATH]
  )

  const handleAddUserKey = useCallback(() => {
    let currentKey = getValues(SSH_PUBLIC_KEY_PATH)
    currentKey &&= currentKey + '\n'

    setValue(SSH_PUBLIC_KEY_PATH, `${currentKey ?? ''}${SSH_KEY_USER}`)
  }, [getValues, setValue, SSH_PUBLIC_KEY_PATH])

  return (
    <FormControl component="fieldset" sx={{ width: '100%' }}>
      <Legend title={T.Configuration} />
      <Stack
        display="grid"
        gap="1em"
        sx={{ gridTemplateColumns: { sm: '1fr', md: '1fr 1fr' } }}
      >
        <FormWithSchema
          id={stepId}
          cy={getCyPath('context-configuration-others')}
          fields={OTHER_FIELDS}
        />
        <section>
          <FormWithSchema
            id={stepId}
            cy={getCyPath('context-ssh-public-key')}
            fields={[SSH_PUBLIC_KEY]}
          />
          <Stack direction="row" gap="1em">
            <Button
              onClick={handleAddUserKey}
              color="secondary"
              variant="contained"
              data-cy={getCyPath('add-context-ssh-public-key')}
            >
              {T.AddUserSshPublicKey}
            </Button>
            <Button
              onClick={handleClearKey}
              color="secondary"
              variant="outlined"
            >
              {T.Clear}
            </Button>
          </Stack>
        </section>
        <FormWithSchema
          id={stepId}
          cy={getCyPath('context-script')}
          fields={SCRIPT_FIELDS}
          rootProps={{ sx: { width: '100%', gridColumn: '1 / -1' } }}
        />
      </Stack>
    </FormControl>
  )
}

ConfigurationSection.propTypes = {
  stepId: PropTypes.string,
  hypervisor: PropTypes.string,
}

export default ConfigurationSection
