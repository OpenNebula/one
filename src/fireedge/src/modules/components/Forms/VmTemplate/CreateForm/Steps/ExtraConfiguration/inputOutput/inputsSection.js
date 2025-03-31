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
import { ReactElement, useCallback, memo, useMemo } from 'react'
import PropTypes from 'prop-types'
import { Stack, FormControl, Divider } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { DeleteCircledOutline, Plus } from 'iconoir-react'
import { useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { FormWithSchema, Legend } from '@modules/components/Forms'
import { Tr } from '@modules/components/HOC'

import {
  INPUTS_FIELDS,
  INPUT_SCHEMA,
  deviceTypeIcons,
  busTypeIcons,
} from '@modules/components/Forms/VmTemplate/CreateForm/Steps/ExtraConfiguration/inputOutput/schema'
import { T, HYPERVISORS, STYLE_BUTTONS } from '@ConstantsModule'
import SubmitButton from '@modules/components/FormControl/SubmitButton'

import { hasRestrictedAttributes } from '@UtilsModule'

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

    const onDelete = (index) => {
      remove(index)
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
            alignItems="center"
            gap="0.5rem"
            component="form"
            onSubmit={methods.handleSubmit(onSubmit)}
          >
            <FormWithSchema
              cy={getCyPath('io-inputs')}
              fields={fields}
              rootProps={{ sx: { m: 0 } }}
              saveState={true}
              fieldPath={`${stepId}.InputOutput`}
            />
            <SubmitButton
              startIcon={<Plus />}
              data-cy={getCyPath('add-io-inputs')}
              label={T.Add}
              importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
            ></SubmitButton>
          </Stack>
        </FormProvider>
        <Divider />
        <List>
          {inputs?.map(({ id, TYPE, BUS }, index) => {
            const deviceIcon = deviceTypeIcons[TYPE]
            const deviceInfo = `${TYPE}`
            const busIcon = busTypeIcons[BUS]
            const busInfo = `${BUS}`

            // Disable action if the input has a restricted attribute on the template
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
                    onClick={() => onDelete(index)}
                    icon=<DeleteCircledOutline />
                    disabled={disabledAction}
                    tooltip={tooltip}
                    data-cy={`input-delete-${index}`}
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
