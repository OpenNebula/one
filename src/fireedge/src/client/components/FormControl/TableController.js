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
import { memo, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useController } from 'react-hook-form'

import Legend from 'client/components/Forms/Legend'
import { ErrorHelper } from 'client/components/FormControl'
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
    getRowId = defaultGetRowId,
    formContext = {},
    readOnly = false,
    fieldProps: { initialState, ...fieldProps } = {},
  }) => {
    const { clearErrors } = formContext

    const {
      field: { value, onChange },
      fieldState: { error },
    } = useController({ name, control })

    const [initialRows, setInitialRows] = useState(() =>
      getSelectedRowIds(value)
    )

    useEffect(() => {
      onChange(singleSelect ? undefined : [])
      setInitialRows({})
    }, [Table])

    return (
      <>
        <Legend title={label} tooltip={tooltip} />
        {error && (
          <ErrorHelper data-cy={`${cy}-error`} label={error?.message} mb={2} />
        )}
        <Table
          pageSize={5}
          disableGlobalSort
          displaySelectedRows
          disableRowSelect={readOnly}
          singleSelect={singleSelect}
          getRowId={getRowId}
          initialState={{ ...initialState, selectedRowIds: initialRows }}
          onSelectedRowsChange={(rows) => {
            if (readOnly) return

            const rowValues = rows?.map(({ original }) => getRowId(original))

            onChange(singleSelect ? rowValues?.[0] : rowValues)
            clearErrors(name)
          }}
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
  singleSelect: PropTypes.bool,
  Table: PropTypes.any,
  getRowId: PropTypes.func,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  fieldProps: PropTypes.object,
  readOnly: PropTypes.bool,
  formContext: PropTypes.shape({
    setValue: PropTypes.func,
    setError: PropTypes.func,
    clearErrors: PropTypes.func,
    watch: PropTypes.func,
    register: PropTypes.func,
  }),
}

TableController.displayName = 'TableController'

export default TableController
