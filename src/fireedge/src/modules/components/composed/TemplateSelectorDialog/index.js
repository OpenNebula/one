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

import { Dialog, DialogContent, DialogTitle, Stack } from '@mui/material'
import { Cancel } from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement } from 'react'

import { Button } from '@modules/components/primitives/Buttons'
import { Table } from '@modules/components/primitives/Tables'
import { Text } from '@modules/components/primitives/Text'
import { T, TEXT_VARIANTS, TEXT_WEIGHTS } from '@ConstantsModule'

/**
 * Displays a searchable template selector dialog.
 *
 * @param {object} props - Dialog and table configuration
 * @param {string} props.title - Dialog title
 * @param {object} props.table - Template table model
 * @param {object[]} props.data - Templates to display
 * @param {boolean} props.isRefreshing - Whether templates are loading
 * @param {Function} props.onRefresh - Refreshes the templates
 * @param {Function} props.onClose - Closes the dialog
 * @param {Function} props.onSelect - Opens the selected template
 * @returns {ReactElement} Template selector dialog
 */
export function TemplateSelectorDialog({
  title,
  table,
  data,
  isRefreshing,
  onRefresh,
  onClose,
  onSelect,
}) {
  return (
    <Dialog
      open
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      PaperProps={{
        sx: {
          width: 'min(1120px, calc(100vw - 64px))',
          maxWidth: 'none',
          minHeight: '620px',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
        >
          <Text
            value={title}
            variant={TEXT_VARIANTS.H6}
            weight={TEXT_WEIGHTS.SEMIBOLD}
          />
          <Button
            iconOnly={<Cancel />}
            type="secondary"
            title={T.Close}
            onClick={onClose}
          />
        </Stack>
      </DialogTitle>
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          pb: 3,
        }}
      >
        <Table
          columns={table.columns()}
          data={data}
          dataCy={table.dataCy}
          isLoading={isRefreshing}
          isRowsSelectable
          getRowId={(row) => String(row.ID)}
          onRowClick={onSelect}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          isEnableSearchBar
          isEnableSort
          isEnableFilters
          searchPlaceholder={T.SearchTemplates}
          defaultPageSize={5}
          pageSizeOptions={[5, 10, 25, 50, 100]}
          skeletonRows={4}
          size="medium"
        />
      </DialogContent>
    </Dialog>
  )
}

TemplateSelectorDialog.propTypes = {
  title: PropTypes.string.isRequired,
  table: PropTypes.shape({
    columns: PropTypes.func.isRequired,
    dataCy: PropTypes.string,
  }).isRequired,
  data: PropTypes.array.isRequired,
  isRefreshing: PropTypes.bool,
  onRefresh: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
}
