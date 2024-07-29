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
import PropTypes from 'prop-types'
import { memo, useCallback, useEffect, useState } from 'react'
import { useController, useFormContext } from 'react-hook-form'

import { ErrorHelper } from 'client/components/FormControl'
import Legend from 'client/components/Forms/Legend'
import { sortStateTables } from 'client/components/Tables/Enhanced/Utils/DataTableUtils'
import { generateKey } from 'client/utils'

const defaultGetRowId = (item) =>
  typeof item === 'object' ? item?.id ?? item?.ID : item

const getSelectedRowIds = (value) =>
  [value ?? []]
    .flat()
    .reduce(
      (initialSelected, rowId) => ({ ...initialSelected, [rowId]: true }),
      {}
    )

const TableController = memo(
  ({
    control,
    cy = `table-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    Table,
    singleSelect = true,
    displaySelectedRows = true,
    getRowId = defaultGetRowId,
    readOnly = false,
    onConditionChange,
    zoneId,
    dependOf,
    fieldProps: { initialState, preserveState, ...fieldProps } = {},
  }) => {
    const { clearErrors } = useFormContext()

    const {
      field: { value, onChange },
      fieldState: { error },
    } = useController({ name, control })

    const [initialRows, setInitialRows] = useState(() =>
      getSelectedRowIds(value)
    )

    const reSelectRows = (newValues = []) => {
      const sortedNewValues = sortStateTables(newValues)
      onChange(sortedNewValues)
      setInitialRows(getSelectedRowIds(sortedNewValues))
    }

    useEffect(() => {
      if (preserveState) {
        onChange(value)
        setInitialRows(initialRows)
      } else {
        onChange(singleSelect ? undefined : [])
        setInitialRows({})
      }
    }, [Table])

    const handleSelectedRowsChange = useCallback(
      (rows) => {
        if (readOnly) return

        const rowValues = rows?.map(({ original }) => getRowId(original))

        onChange(singleSelect ? rowValues?.[0] : rowValues)
        clearErrors(name)

        if (typeof onConditionChange === 'function') {
          onConditionChange(singleSelect ? rowValues?.[0] : rowValues)
        }
      },
      [
        onChange,
        clearErrors,
        name,
        onConditionChange,
        readOnly,
        getRowId,
        singleSelect,
      ]
    )

    return (
      <>
        <Legend title={label} tooltip={tooltip} />
        {error && (
          <ErrorHelper data-cy={`${cy}-error`} label={error?.message} mb={2} />
        )}
        <Table
          pageSize={5}
          disableGlobalSort
          displaySelectedRows={displaySelectedRows}
          disableRowSelect={readOnly}
          singleSelect={singleSelect}
          getRowId={getRowId}
          zoneId={zoneId}
          dependOf={dependOf}
          initialState={{ ...initialState, selectedRowIds: initialRows }}
          onSelectedRowsChange={handleSelectedRowsChange}
          value={value ?? []}
          reSelectRows={reSelectRows}
          {...fieldProps}
        />
      </>
    )
  },
  (prevProps, nextProps) =>
    prevProps.label === nextProps.label &&
    prevProps.Table === nextProps.Table &&
    prevProps.tooltip === nextProps.tooltip
)

TableController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  type: PropTypes.string,
  zoneId: PropTypes.string,
  singleSelect: PropTypes.bool,
  displaySelectedRows: PropTypes.bool,
  Table: PropTypes.any,
  getRowId: PropTypes.func,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
  onConditionChange: PropTypes.func,
  dependOf: PropTypes.oneOfType([PropTypes.array, PropTypes.string]),
}

TableController.displayName = 'TableController'

export default TableController
