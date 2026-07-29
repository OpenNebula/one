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
/* eslint-disable jsdoc/require-param-description, jsdoc/require-param-type */

import PropTypes from 'prop-types'
import { useEffect, useMemo, useState } from 'react'
import { Box, Typography } from '@mui/material'
import { Cancel } from 'iconoir-react'
import { object, string } from 'yup'

import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { Checkbox } from '@modules/componentsv2/primitives/Buttons/Checkbox'
import { Dialog } from '@modules/componentsv2/primitives/Dialog'
import { Dropdown } from '@modules/componentsv2/primitives/Dropdown/Default'
import { InputField } from '@modules/componentsv2/primitives/Fields/Default'
import {
  getCreateFormStyles,
  getDialogContentStyles,
} from '@modules/componentsv2/composed/LabelPanel/styles'
import { getParentOptions } from '@modules/componentsv2/composed/LabelPanel/utils'

const NAME_SCHEMA = object({
  name: string()
    .matches(/^[a-zA-Z0-9_-]+$/, T.LabelNameFormat)
    .required(T.NewLabelName),
})

const getInitialValues = (row) => ({
  name: row?.name ?? '',
  visibility: row?.scope ?? 'user',
  nest: row?.scope === 'user' ? (row?.rawPath?.length ?? 0) > 1 : false,
  parent: row
    ? [row?.groupName, ...row.rawPath.slice(0, -1)].filter(Boolean).join('/')
    : '',
})

/**
 * Form dialog used to create or edit a label.
 *
 * @param {object} props - Dialog props
 * @param props.open
 * @param props.labels
 * @param props.getLabels
 * @param props.auth
 * @param props.row
 * @param props.isLoading
 * @param props.onClose
 * @param props.onSubmit
 * @returns {object} Create label dialog
 */
export const CreateLabelForm = ({
  open,
  labels,
  getLabels,
  auth,
  row,
  isLoading = false,
  onClose,
  onSubmit,
}) => {
  const { translate } = useTranslation()
  const isEdit = !!row
  const currentLabels = getLabels?.() ?? labels
  const [values, setValues] = useState(() => getInitialValues(row))
  const [errors, setErrors] = useState({})
  const parentOptions = useMemo(
    () => getParentOptions(currentLabels, auth, values.visibility, row),
    [auth, currentLabels, row, values.visibility]
  )
  const groupParentOptions = useMemo(
    () => getParentOptions(currentLabels, auth, 'group', row),
    [auth, currentLabels, row]
  )
  const selectedParent = useMemo(
    () => parentOptions.find(({ value }) => value === values.parent) ?? null,
    [parentOptions, values.parent]
  )
  const parentLabel = translate(T.Parent)
  const requiresParent = values.nest || values.visibility === 'group'
  const selectedGroup =
    (values.visibility === 'group' && values.parent?.split('/')?.[0]) ||
    groupParentOptions?.[0]?.value ||
    translate(T.YourGroup)

  useEffect(() => {
    if (!open) return

    setValues(getInitialValues(row))
    setErrors({})
  }, [open, row])

  useEffect(() => {
    if (!requiresParent) {
      values.parent && setValues((current) => ({ ...current, parent: '' }))

      return
    }

    const parentExists = parentOptions.some(
      ({ value }) => value === values.parent
    )
    const nextParent = parentOptions?.[0]?.value ?? ''

    if (!parentExists && values.parent !== nextParent) {
      setValues((current) => ({
        ...current,
        parent: nextParent,
      }))
    }
  }, [parentOptions, requiresParent, values.parent])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrors({})

    try {
      await NAME_SCHEMA.validate(values, { abortEarly: false })
      if (requiresParent && !values.parent) {
        setErrors({ parent: translate(T.SelectParentLabel) })

        return
      }

      await onSubmit?.(values)
    } catch (error) {
      const validationErrors = Object.fromEntries(
        []
          .concat(error?.inner ?? [])
          .filter(({ path }) => path)
          .map(({ path, message }) => [path, message])
      )

      setErrors(
        Object.keys(validationErrors).length
          ? validationErrors
          : { form: error?.message ?? String(error) }
      )
    }
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose}>
      <Box sx={(theme) => getDialogContentStyles(theme)}>
        <Box className="label-dialog-header">
          <Box className="label-dialog-heading">
            <Typography component="h2" className="label-dialog-title">
              {isEdit ? translate(T.EditLabel) : translate(T.AddNewLabel)}
            </Typography>
            <Typography className="label-dialog-description">
              {translate(T.LabelsConcept)}
            </Typography>
          </Box>
          <Button
            type="transparent"
            iconOnly={<Cancel />}
            aria-label={translate(T.Close)}
            tooltip={T.Close}
            isDisabled={isLoading}
            onClick={onClose}
          />
        </Box>

        <Box
          component="form"
          id="label-create-form"
          className="label-dialog-body"
          onSubmit={handleSubmit}
          sx={(theme) => getCreateFormStyles(theme)}
        >
          <InputField
            label={translate(T.Name)}
            placeholder={translate(T.ExampleProduction)}
            value={values.name}
            error={errors.name}
            isRequired
            isDisabled={isLoading}
            inputProps={{ autoFocus: true, 'data-cy': 'label-name' }}
            onChange={(name) => setValues((current) => ({ ...current, name }))}
          />

          <Checkbox
            className="label-form-nest"
            text={translate(T.NestLabelUnder)}
            checked={values.nest}
            isDisabled={isLoading}
            onChange={(nest) => setValues((current) => ({ ...current, nest }))}
          />

          {requiresParent && (
            <Dropdown
              key={`${values.visibility}-${selectedParent?.value ?? 'empty'}`}
              label={parentLabel}
              placeholder={translate(T.ExampleProduction)}
              options={parentOptions}
              initialValue={selectedParent}
              error={errors.parent}
              isDisabled={isLoading || parentOptions.length === 0}
              isSearchable
              rowsDisplayed={5}
              dataCy="label-parent"
              onChange={(option) =>
                setValues((current) => ({
                  ...current,
                  parent: option?.value ?? '',
                }))
              }
            />
          )}

          <Box className="label-form-visibility">
            <Typography className="label-form-visibility-title">
              {translate(T.Visibility)}
            </Typography>
            <Typography className="label-form-visibility-description">
              {translate(T.ChooseLabelVisibility)}
            </Typography>
            <Box className="label-form-visibility-options">
              <Box
                component="button"
                type="button"
                className="label-form-visibility-option"
                aria-pressed={values.visibility === 'user'}
                disabled={isLoading}
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    visibility: 'user',
                    parent: '',
                  }))
                }
              >
                <Box
                  className={`label-form-radio ${
                    values.visibility === 'user' ? 'selected' : ''
                  }`}
                />
                <Box className="label-form-option-copy">
                  <Typography className="label-form-option-title">
                    {translate(T.Private)}
                  </Typography>
                  <Typography className="label-form-option-description">
                    {translate(T.PrivateLabelConcept)}
                  </Typography>
                </Box>
              </Box>

              <Box
                component="button"
                type="button"
                className="label-form-visibility-option"
                aria-pressed={values.visibility === 'group'}
                disabled={isLoading || !groupParentOptions.length}
                onClick={() =>
                  setValues((current) => ({
                    ...current,
                    visibility: 'group',
                  }))
                }
              >
                <Box
                  className={`label-form-radio ${
                    values.visibility === 'group' ? 'selected' : ''
                  }`}
                />
                <Box className="label-form-option-copy">
                  <Typography className="label-form-option-title">
                    {translate(T.Group)}
                  </Typography>
                  <Typography className="label-form-option-description">
                    {translate(T.GroupLabelVisibilityConcept, [selectedGroup])}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {errors.form && (
            <Typography color="error" role="alert">
              {errors.form}
            </Typography>
          )}
        </Box>

        <Box className="label-dialog-actions">
          <Button type="secondary" isDisabled={isLoading} onClick={onClose}>
            {translate(T.Cancel)}
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            form="label-create-form"
            isDisabled={isLoading}
          >
            {isEdit ? translate(T.Save) : translate(T.Create)}
          </Button>
        </Box>
      </Box>
    </Dialog>
  )
}

CreateLabelForm.propTypes = {
  open: PropTypes.bool,
  labels: PropTypes.object,
  getLabels: PropTypes.func,
  auth: PropTypes.object,
  row: PropTypes.object,
  isLoading: PropTypes.bool,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
}

CreateLabelForm.displayName = 'CreateLabelForm'
