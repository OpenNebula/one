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
import PropTypes from 'prop-types'
import { memo, useCallback } from 'react'
import { useController, useFormContext } from 'react-hook-form'
import { ErrorHelper } from '@modules/resources/FormControl'
import { Table, Legend } from '@ComponentsV2Module'
import { generateKey } from '@UtilsModule'

const defaultGetRowId = (item) =>
  typeof item === 'object' ? item?.id ?? item?.ID : item

const TableController = memo(
  ({
    control,
    cy = `table-${generateKey()}`,
    name = '',
    label = '',
    tooltip,
    model,
    singleSelect = true,
    getRowId = defaultGetRowId,
    readOnly = false,
    onConditionChange,
    fieldProps = {},
  }) => {
    const { clearErrors } = useFormContext()

    const {
      field: { value, onChange },
      fieldState: { error },
    } = useController({ name, control })
    const { data = [], isFetching } = model.useData()
    const { dataCy: fieldDataCy, ...tableProps } = fieldProps
    const tableDataCy = fieldDataCy ?? model.dataCy

    const rowSelection = [value ?? []]
      .flat()
      .reduce((acc, id) => ({ ...acc, [id]: true }), {})

    const handleRowSelectionChange = useCallback(
      (updater) => {
        if (readOnly) return
        const next =
          typeof updater === 'function' ? updater(rowSelection) : updater
        const ids = Object.keys(next)
        const selected = singleSelect ? ids[ids.length - 1] : ids
        onChange(selected)
        clearErrors(name)
        onConditionChange?.(selected)
      },
      [rowSelection, singleSelect, readOnly]
    )

    return (
      <>
        <Legend title={label} tooltip={tooltip} />
        {error && (
          <ErrorHelper data-cy={`${cy}-error`} label={error?.message} mb={2} />
        )}
        <Table
          columns={model.columns()}
          data={[].concat(data)}
          isLoading={isFetching}
          dataCy={tableDataCy}
          isRowsSelectable={!readOnly}
          isMultiRowSelection={!singleSelect}
          getRowId={getRowId}
          rowSelection={rowSelection}
          onRowSelectionChange={handleRowSelectionChange}
          {...tableProps}
        />
      </>
    )
  }
)

TableController.propTypes = {
  control: PropTypes.object,
  cy: PropTypes.string,
  name: PropTypes.string.isRequired,
  label: PropTypes.any,
  tooltip: PropTypes.any,
  model: PropTypes.shape({
    columns: PropTypes.func.isRequired,
    dataCy: PropTypes.string,
    useData: PropTypes.func.isRequired,
  }).isRequired,
  singleSelect: PropTypes.bool,
  getRowId: PropTypes.func,
  readOnly: PropTypes.bool,
  onConditionChange: PropTypes.func,
  fieldProps: PropTypes.object,
}

TableController.displayName = 'TableController'
export default TableController
