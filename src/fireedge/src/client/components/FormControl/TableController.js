/* ------------------------------------------------------------------------- *
 * Copyright 2002-2021, OpenNebula Project, OpenNebula Systems               *
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
import { memo } from 'react'
import PropTypes from 'prop-types'

import { Typography } from '@mui/material'
import { useController } from 'react-hook-form'

import { ErrorHelper, Tooltip } from 'client/components/FormControl'
import { Tr, labelCanBeTranslated } from 'client/components/HOC'
import { generateKey } from 'client/utils'

const defaultGetRowId = item => typeof item === 'object' ? item?.id ?? item?.ID : item

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
    formContext = {}
  }) => {
    const { clearErrors } = formContext

    const {
      field: { onChange },
      fieldState: { error }
    } = useController({ name, control })

    return (
      <>
        {error ? (
          <ErrorHelper
            data-cy={`${cy}-error`}
            label={error?.message}
            mb={2}
          />
        ) : (
          label && (
            <Typography variant='body1' mb={2}>
              {tooltip && <Tooltip title={tooltip} position='start' />}
              {labelCanBeTranslated(label) ? Tr(label) : label}
            </Typography>
          )
        )}
        <Table
          pageSize={4}
          singleSelect={singleSelect}
          onlyGlobalSearch
          onlyGlobalSelectedRows
          getRowId={getRowId}
          onSelectedRowsChange={rows => {
            const rowValues = rows?.map(({ original }) => getRowId(original))

            onChange(singleSelect ? rowValues?.[0] : rowValues)
            clearErrors(name)
          }}
        />
      </>
    )
  },
  (prevProps, nextProps) =>
    prevProps.error === nextProps.error &&
    prevProps.label === nextProps.label &&
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
  formContext: PropTypes.shape({
    setValue: PropTypes.func,
    setError: PropTypes.func,
    clearErrors: PropTypes.func,
    watch: PropTypes.func,
    register: PropTypes.func
  })
}

TableController.displayName = 'TableController'

export default TableController
