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
import { ReactElement, useCallback, memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack, FormControl, Divider, Button } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { DeleteCircledOutline, AddCircledOutline } from 'iconoir-react'
import { useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'

import { FormWithSchema, Legend } from 'client/components/Forms'
import { Tr, Translate } from 'client/components/HOC'

import {
  INPUTS_FIELDS,
  INPUT_SCHEMA,
  deviceTypeIcons,
  busTypeIcons,
} from 'client/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput/schema'
import { T, HYPERVISORS } from 'client/constants'
import SubmitButton from 'client/components/FormControl/SubmitButton'

import { hasRestrictedAttributes } from 'client/utils'
export const SECTION_ID = 'INPUT'

const InputsSection = memo(
  /**
   * @param {object} props - Props
   * @param {string} [props.stepId] - ID of the step the section belongs to
   * @param {HYPERVISORS} props.hypervisor - VM hypervisor
   * @param {object} props.oneConfig - Config of oned.conf
   * @param {boolean} props.adminGroup - User is admin or not
   * @returns {ReactElement} - Inputs section
   */
  ({ stepId, hypervisor, oneConfig, adminGroup }) => {
    const fields = useMemo(
      () => INPUTS_FIELDS(hypervisor, oneConfig, adminGroup),
      [hypervisor]
    )

    const {
      fields: inputs,
      append,
      remove,
    } = useFieldArray({
      name: useMemo(
        () => [stepId, SECTION_ID].filter(Boolean).join('.'),
        [stepId]
      ),
    })

    const getCyPath = useCallback(
      (cy) => [stepId, cy].filter(Boolean).join('-'),
      [stepId]
    )

    const methods = useForm({
      defaultValues: INPUT_SCHEMA.default(),
      resolver: yupResolver(INPUT_SCHEMA),
    })

    const onSubmit = (newInput) => {
      append(newInput)
      methods.reset()
    }

    if (fields.length === 0) {
      return null
    }

    return (
      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <Legend title={T.Inputs} />
        <FormProvider {...methods}>
          <Stack
            direction="row"
            alignItems="flex-start"
            gap="0.5rem"
            component="form"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormWithSchema
              cy={getCyPath('io-inputs')}
              fields={fields}
              rootProps={{ sx: { m: 0 } }}
            />
            <Button
              variant="contained"
              type="submit"
              color="secondary"
              startIcon={<AddCircledOutline />}
              data-cy={getCyPath('add-io-inputs')}
              sx={{ mt: '1em' }}
            >
              <Translate word={T.Add} />
            </Button>
          </Stack>
        </FormProvider>
        <Divider />
        <List>
          {inputs?.map(({ id, TYPE, BUS }, index) => {
            const deviceIcon = deviceTypeIcons[TYPE]
            const deviceInfo = `${TYPE}`
            const busIcon = busTypeIcons[BUS]
            const busInfo = `${BUS}`

            // Disable action if the nic has a restricted attribute on the template
            const disabledAction =
              !adminGroup &&
              hasRestrictedAttributes(
                { id, TYPE, BUS },
                'INPUT',
                oneConfig?.VM_RESTRICTED_ATTR
              )
            const tooltip = !disabledAction ? null : Tr(T.DetachRestricted)

            return (
              <ListItem
                key={id}
                secondaryAction={
                  <SubmitButton
                    onClick={() => remove(index)}
                    icon=<DeleteCircledOutline />
                    disabled={disabledAction}
                    tooltip={tooltip}
                  />
                }
                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
              >
                <ListItemText
                  primary={
                    <Stack
                      component="span"
                      direction="row"
                      spacing={2}
                      sx={{ '& > *': { width: 36 } }}
                    >
                      {deviceIcon}
                      <span>{deviceInfo}</span>
                      <Divider orientation="vertical" flexItem />
                      {busIcon}
                      <span>{busInfo}</span>
                    </Stack>
                  }
                  primaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
            )
          })}
        </List>
      </FormControl>
    )
  }
)

InputsSection.propTypes = {
  stepId: PropTypes.string,
  hypervisor: PropTypes.string,
  oneConfig: PropTypes.object,
  adminGroup: PropTypes.bool,
}

InputsSection.displayName = 'InputsSection'

export default InputsSection
