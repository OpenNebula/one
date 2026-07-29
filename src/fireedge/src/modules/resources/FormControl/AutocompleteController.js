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
import { memo, useCallback, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'

import { Dropdown } from '@ComponentsV2Module'
import { useController, useWatch, useFormContext } from 'react-hook-form'
import { sentenceCase, generateKey, isTranslationInput } from '@UtilsModule'
import { useTranslation } from '@ProvidersModule'

const AutocompleteController = memo(
  ({
    control,
    cy = `autocomplete-${generateKey()}`,
    name = '',
    label = '',
    multiple = false,
    values = [],
    fieldProps = {},
    optionsOnly = false,
    clearInvalid = false,
    onConditionChange,
    watcher,
    dependencies,
    defaultValue,
  }) => {
    const { translate } = useTranslation()
    const { hint, placeholder, menuTitle, rowsDisplayed = 4 } = fieldProps
    const trLabel = isTranslationInput(label) ? translate(label) : label

    const {
      field: { value: renderValue, onBlur, onChange },
      fieldState: { error },
    } = useController({ name, control, defaultValue })

    const formContext = useFormContext()

    const watch = useWatch({
      name: dependencies,
      disabled: dependencies == null,
      defaultValue: Array.isArray(dependencies) ? [] : undefined,
    })

    const handleChange = useCallback(
      (options) =>
        onChange(
          multiple
            ? options?.map((option) =>
                typeof option === 'object' ? option.value : option
              )
            : options && typeof options === 'object'
            ? options.value
            : options
        ),
      [onChange, onConditionChange, multiple, renderValue]
    )

    useEffect(() => {
      if (!watcher || !dependencies || !watch) return

      const watcherValue = watcher(watch, { name, formContext })

      watcherValue !== undefined && onChange(watcherValue)
    }, [watch, watcher, dependencies])

    const resolvedValue = useMemo(() => {
      if (renderValue === undefined || renderValue === null) return renderValue

      if (multiple) {
        return []
          ?.concat(renderValue)
          ?.map(
            (val) =>
              values?.find((opt) =>
                typeof opt === 'object' ? opt?.value === val : opt === val
              ) ?? val
          )
      }

      return (
        values?.find((opt) =>
          typeof opt === 'object'
            ? opt?.value === renderValue
            : opt === renderValue
        ) ?? renderValue
      )
    }, [renderValue, values, multiple, defaultValue])

    return (
      <Dropdown
        onBlur={onBlur}
        initialValue={resolvedValue}
        onChange={handleChange}
        isMultipleSelectable={multiple}
        label={trLabel}
        hint={hint}
        placeholder={placeholder || 'Placeholder'}
        menuTitle={menuTitle}
        options={values}
        rowsDisplayed={rowsDisplayed}
        error={sentenceCase(
          [error?.message]
            ?.flat()
            ?.map((s) => s?.trim())
            ?.join(' ')
        )}
      />
    )
  },
  (prevProps, nextProps) => prevProps.values === nextProps.values
)

AutocompleteController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  multiple: PropTypes.bool,
  disableEnter: PropTypes.bool,
  values: PropTypes.arrayOf(PropTypes.object),
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
  optionsOnly: PropTypes.bool,
  clearInvalid: PropTypes.bool,
  onConditionChange: PropTypes.func,
  watcher: PropTypes.func,
  dependencies: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  defaultValue: PropTypes.string,
}

AutocompleteController.displayName = 'AutocompleteController'

export default AutocompleteController
