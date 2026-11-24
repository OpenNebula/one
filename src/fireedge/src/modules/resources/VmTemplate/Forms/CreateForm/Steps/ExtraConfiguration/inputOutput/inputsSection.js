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
import {
  ReactElement,
  useCallback,
  memo,
  useMemo,
  useLayoutEffect,
  useRef,
} from 'react'
import PropTypes from 'prop-types'
import { Box, Stack, FormControl, Divider, useTheme } from '@mui/material'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import { DeleteCircle, Plus } from 'iconoir-react'
import { useFieldArray, useForm, FormProvider } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { hasRestrictedAttributes } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

import {
  INPUTS_FIELDS,
  INPUT_SCHEMA,
  deviceTypeIcons,
  busTypeIcons,
} from '@modules/resources/VmTemplate/Forms/CreateForm/Steps/ExtraConfiguration/inputOutput/schema'
import { T, HYPERVISORS, STYLE_BUTTONS } from '@ConstantsModule'
import { SubmitButton, FormWithSchema, Legend } from '@ComponentsModule'

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
    const theme = useTheme()
    const { translate } = useTranslation()
    const inputFormRef = useRef(null)
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

    useLayoutEffect(() => {
      const form = inputFormRef.current
      const controls = form?.querySelectorAll('.textfield-input-wrapper')
      const control = controls?.[controls.length - 1]

      if (!form || !control) return

      const alignButton = () => {
        const controlRect = control.getBoundingClientRect()
        const top = controlRect.top - form.getBoundingClientRect().top

        form.style.setProperty('--io-input-control-top', `${top}px`)
        form.style.setProperty(
          '--io-input-control-height',
          `${controlRect.height}px`
        )
      }

      alignButton()

      const observer = new ResizeObserver(alignButton)
      observer.observe(form)
      observer.observe(control)

      return () => observer.disconnect()
    }, [fields])

    if (fields.length === 0) {
      return null
    }

    return (
      <FormControl component="fieldset" sx={{ width: '100%' }}>
        <Legend title={T.Inputs} />
        <FormProvider {...methods}>
          <Stack
            ref={inputFormRef}
            direction="row"
            alignItems="flex-start"
            gap="0.5rem"
            component="form"
            onSubmit={methods.handleSubmit(onSubmit)}
            sx={{ marginBottom: `${theme.scale[600]}px` }}
          >
            <FormWithSchema
              cy={getCyPath('io-inputs')}
              fields={fields}
              rootProps={{ sx: { m: 0 } }}
              saveState={true}
              fieldPath={`${stepId}.InputOutput`}
            />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                marginTop: 'var(--io-input-control-top, 0px)',
                height: 'var(--io-input-control-height, auto)',
              }}
            >
              <SubmitButton
                startIcon={<Plus />}
                data-cy={getCyPath('add-io-inputs')}
                label={T.Add}
                type={STYLE_BUTTONS.TYPE.SECONDARY}
              />
            </Box>
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
            const tooltip = !disabledAction
              ? null
              : translate(T.DetachRestricted)

            return (
              <ListItem
                key={id}
                secondaryAction={
                  <SubmitButton
                    onClick={() => onDelete(index)}
                    iconOnly=<DeleteCircle />
                    isDisabled={disabledAction}
                    tooltip={tooltip}
                    data-cy={`input-delete-${index}`}
                    type={STYLE_BUTTONS.TYPE.SECONDARY}
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
