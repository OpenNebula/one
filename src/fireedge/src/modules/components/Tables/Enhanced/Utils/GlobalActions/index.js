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
import { ReactElement } from 'react'

import { Checkbox, Stack } from '@mui/material'
import { RefreshDouble } from 'iconoir-react'
import {
  UseRowSelectInstanceProps,
  UseTableInstanceProps,
} from 'opennebula-react-table'

import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { SubmitButton } from '@modules/components/FormControl'
import { Tr } from '@modules/components/HOC'
import {
  Action,
  GlobalAction,
} from '@modules/components/Tables/Enhanced/Utils/GlobalActions/Action'

/**
 * Render bulk actions.
 *
 * @param {object} props - Props
 * @param {function():Promise} props.refetch - Function to refetch data
 * @param {object} [props.className] - Class name for the container
 * @param {boolean} props.isLoading - The data is fetching
 * @param {boolean} props.singleSelect - If true, only one row can be selected
 * @param {boolean} props.disableRowSelect - Rows can't select
 * @param {GlobalAction[]} props.globalActions - Possible bulk actions
 * @param {UseTableInstanceProps} props.useTableProps - Table props
 * @param {object[]} props.selectedRows - Selected Rows
 * @param {Function} props.onSelectedRowsChange - Sets the state of the containers selected rows
 * @param {object} props.styles - Styles
 * @returns {ReactElement} Component JSX with all actions
 */
const GlobalActions = ({
  refetch,
  className,
  isLoading,
  singleSelect = false,
  disableRowSelect = false,
  globalActions = [],
  selectedRows,
  onSelectedRowsChange,
  useTableProps = {},
  styles = {},
}) => {
  /** @type {UseRowSelectInstanceProps} */
  const { getToggleAllPageRowsSelectedProps, getToggleAllRowsSelectedProps } =
    useTableProps

  return (
    <Stack
      className={className}
      direction="row"
      flexWrap="wrap"
      alignItems="center"
      gap="0.5em"
    >
      {!singleSelect &&
        !disableRowSelect &&
        getToggleAllPageRowsSelectedProps &&
        getToggleAllRowsSelectedProps && (
          <Checkbox
            {...getToggleAllPageRowsSelectedProps()}
            title={Tr(T.ToggleAllSelectedCardsCurrentPage)}
            indeterminate={getToggleAllRowsSelectedProps().indeterminate}
          />
        )}
      {refetch && (
        <SubmitButton
          data-cy="refresh"
          icon={<RefreshDouble />}
          tooltip={Tr(T.Refresh)}
          isSubmitting={isLoading}
          onClick={refetch}
          importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
          type={STYLE_BUTTONS.TYPE.OUTLINED_ICON}
          size={STYLE_BUTTONS.SIZE.MEDIUM}
          className={styles.refreshIcon}
        />
      )}
      {globalActions?.map((item, idx) => {
        if ((singleSelect || disableRowSelect) && item.selected) return null

        const key = item.accessor ?? item.label ?? item.tooltip ?? idx

        return (
          <Action
            key={key}
            item={item}
            selectedRows={selectedRows}
            onSelectedRowsChange={onSelectedRowsChange}
          />
        )
      })}
    </Stack>
  )
}

GlobalActions.propTypes = {
  refetch: PropTypes.func,
  className: PropTypes.string,
  isLoading: PropTypes.bool,
  singleSelect: PropTypes.bool,
  disableRowSelect: PropTypes.bool,
  globalActions: PropTypes.array,
  useTableProps: PropTypes.object,
  selectedRows: PropTypes.array,
  onSelectedRowsChange: PropTypes.func,
  styles: PropTypes.object,
}

export default GlobalActions
