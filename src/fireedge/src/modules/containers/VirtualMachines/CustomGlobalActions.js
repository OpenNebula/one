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
import PropTypes from 'prop-types'
import { memo, useMemo, useEffect, useState } from 'react'
import { useTheme } from '@mui/material'
import EnhancedTableStyles from '@modules/components/Tables/Enhanced/styles'
import { GlobalActions } from '@modules/components/Tables/Enhanced/Utils'
import { VmAPI } from '@FeaturesModule'
import { VM_EXTENDED_POOL, VM_POOL_PAGINATION_SIZE } from '@ConstantsModule'

/**
 * Synchronise the information from the selected rows with what is currently in the data.
 *
 * @param {object[]} selectedRows - selected rows
 * @param {object} data - data
 * @returns {object} updated selected rows
 */
export const syncSelectedRowsWithData = (selectedRows = [], data = []) => {
  if (!Array.isArray(selectedRows) || !Array.isArray(data)) return selectedRows

  const dataMap = new Map(data.map((vm) => [String(vm.ID), vm]))

  return selectedRows.map((row) => {
    const newVm = dataMap.get(String(row.original?.ID))
    if (!newVm) return row // No hay actualización para este ID

    const updatedOriginal = { ...row.original, ...newVm }

    const updatedValues = {
      ...row.values,
      id: newVm.ID,
      name: newVm.NAME,
      state: newVm.STATE,
      owner: newVm.UNAME,
      group: newVm.GNAME,
      time: newVm.STIME,
      hostname: newVm?.HISTORY_RECORDS?.HISTORY?.HOSTNAME ?? '',
    }

    return {
      ...row,
      original: updatedOriginal,
      values: updatedValues,
    }
  })
}

const CustomGlobalActions = memo(
  ({ selectedRows, onSelectedRowsChange, actions }) => {
    const [localSelectedRows, setLocalSelectedRows] = useState(selectedRows)

    useEffect(() => {
      setLocalSelectedRows(selectedRows)
    }, [selectedRows])

    // Get styles
    const theme = useTheme()
    const styles = useMemo(
      () =>
        EnhancedTableStyles({
          ...theme,
          readOnly: false,
        }),
      [theme]
    )

    const { data: cachedData = [] } = VmAPI.useGetVmsPaginatedQuery(
      { extended: VM_EXTENDED_POOL ? 1 : 0, pageSize: VM_POOL_PAGINATION_SIZE },
      {
        refetchOnMountOrArgChange: false,
        refetchOnFocus: false,
        refetchOnReconnect: false,
        pollingInterval: 0,
      }
    )

    useEffect(() => {
      if (cachedData?.length && localSelectedRows?.length) {
        setLocalSelectedRows((prev) =>
          syncSelectedRowsWithData(prev, cachedData)
        )
      }
    }, [cachedData])

    return (
      <GlobalActions
        className={styles.actions}
        globalActions={actions}
        selectedRows={localSelectedRows}
        onSelectedRowsChange={onSelectedRowsChange}
      />
    )
  }
)

CustomGlobalActions.propTypes = {
  selectedRows: PropTypes.array,
  onSelectedRowsChange: PropTypes.func,
  actions: PropTypes.array,
}

CustomGlobalActions.displayName = 'VMSCustomGlobalActions'

export default CustomGlobalActions
