/* ------------------------------------------------------------------------- *
 * Copyright 2002-2025, OpenNebula Project, OpenNebula Systems               *
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
import { Stack, FormControl } from '@mui/material'
import { useFormContext } from 'react-hook-form'
import { useGeneralApi } from '@FeaturesModule'

import { FormWithSchema, Legend } from '@modules/components/Forms'
import { SSH_PUBLIC_KEY, SCRIPT_FIELDS, OTHER_FIELDS } from './schema'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import SubmitButton from '@modules/components/FormControl/SubmitButton'

import { disableFields } from '@UtilsModule'

const SSH_KEY_USER = '$USER[SSH_PUBLIC_KEY]'

/**
 * Renders the configuration section to VM Template form.
 *
 * @param {object} props - Props passed to the component
 * @param {string} [props.stepId] - ID of the step the section belongs to
 * @param {object} props.oneConfig - Config of oned.conf
 * @param {boolean} props.adminGroup - User is admin or not
 * @param {boolean} props.isUpdate - If it's an update of the form
 * @returns {ReactElement} - Configuration section
 */
const ConfigurationSection = ({ stepId, oneConfig, adminGroup, isUpdate }) => {
  const { setValue, getValues } = useFormContext()
  const { setModifiedFields, setFieldPath } = useGeneralApi()
  const SSH_PUBLIC_KEY_PATH = useMemo(
    () => [stepId, SSH_PUBLIC_KEY(isUpdate).name].filter(Boolean).join('.'),
    [stepId]
  )

  const getCyPath = useCallback(
    (cy) => [stepId, cy].filter(Boolean).join('-'),
    [stepId]
  )

  const handleClearKey = useCallback(() => {
    setValue(SSH_PUBLIC_KEY_PATH, '')

    // Set as delete
    setFieldPath('extra.Context')
    setModifiedFields({
      extra: {
        CONTEXT: {
          SSH_PUBLIC_KEY: { __delete__: true },
        },
      },
    })
  }, [setValue, SSH_PUBLIC_KEY_PATH])

  const handleAddUserKey = useCallback(() => {
    let currentKey = getValues(SSH_PUBLIC_KEY_PATH)
    currentKey &&= currentKey + '\n'

    setValue(SSH_PUBLIC_KEY_PATH, `${currentKey ?? ''}${SSH_KEY_USER}`)

    // Set as update
    setFieldPath('extra.Context')
    setModifiedFields({
      extra: {
        CONTEXT: {
          SSH_PUBLIC_KEY: true,
        },
      },
    })
  }, [getValues, setValue, SSH_PUBLIC_KEY_PATH])

  const sshPublicKeyPath = getValues(SSH_PUBLIC_KEY_PATH)
  const isDisabled = sshPublicKeyPath?.includes(SSH_KEY_USER) ?? false

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
          saveState={true}
          cy={getCyPath('context-configuration-others')}
          fields={disableFields(
            OTHER_FIELDS(isUpdate),
            'CONTEXT',
            oneConfig,
            adminGroup
          )}
        />
        <section>
          <FormWithSchema
            id={stepId}
            saveState={true}
            cy={getCyPath('context-ssh-public-key')}
            fields={disableFields(
              [SSH_PUBLIC_KEY(isUpdate)],
              'CONTEXT',
              oneConfig,
              adminGroup
            )}
          />
          <Stack direction="row" gap="1em">
            <SubmitButton
              onClick={handleAddUserKey}
              data-cy={getCyPath('add-context-ssh-public-key')}
              label={T.AddUserSshPublicKey}
              importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
              disabled={isDisabled}
            />
            <SubmitButton
              onClick={handleClearKey}
              data-cy={getCyPath('delete-context-ssh-public-key')}
              label={T.Clear}
              importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.OUTLINED}
            />
          </Stack>
        </section>
        <FormWithSchema
          id={stepId}
          saveState={true}
          cy={getCyPath('context-script')}
          fields={disableFields(
            SCRIPT_FIELDS,
            'CONTEXT',
            oneConfig,
            adminGroup
          )}
          rootProps={{ sx: { width: '100%', gridColumn: '1 / -1' } }}
        />
      </Stack>
    </FormControl>
  )
}

ConfigurationSection.propTypes = {
  stepId: PropTypes.string,
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
  isUpdate: PropTypes.bool,
}

export default ConfigurationSection
