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
import { Cancel, EditPencil, Search, Trash } from 'iconoir-react'

import { T } from '@ConstantsModule'
import { useTranslation } from '@ProvidersModule'
import { Badge } from '@modules/componentsv2/primitives/Badge/Default'
import { Button } from '@modules/componentsv2/primitives/Buttons/Default'
import { Dialog } from '@modules/componentsv2/primitives/Dialog'
import { ToggleGroup } from '@modules/componentsv2/primitives/Buttons/Toggle/Group'
import { InputField } from '@modules/componentsv2/primitives/Fields/Default'
import { Table } from '@modules/componentsv2/primitives/Tables/Default'
import {
  ACTION_GROUP_STYLES,
  ACTION_STYLES,
  DESTRUCTIVE_ACTION_STYLES,
} from '@modules/componentsv2/composed/Panels/Attributes/styles'
import {
  getDialogContentStyles,
  getManageStyles,
} from '@modules/componentsv2/composed/LabelPanel/styles'
import {
  filterLabelRows,
  getLabelRows,
} from '@modules/componentsv2/composed/LabelPanel/utils'

/**
 * Form dialog to search and manage all available labels.
 *
 * @param {object} props - Dialog props
 * @param props.open
 * @param props.labels
 * @param props.getLabels
 * @param props.auth
 * @param props.isEmbedded
 * @param props.isLoading
 * @param props.onClose
 * @param props.onCreate
 * @param props.onEdit
 * @param props.onDelete
 * @returns {object} Manage labels dialog
 */
export const ManageLabelForm = ({
  open,
  labels,
  getLabels,
  auth,
  isEmbedded = false,
  isLoading = false,
  onClose,
  onCreate,
  onEdit,
  onDelete,
}) => {
  const { translate } = useTranslation()
  const [search, setSearch] = useState('')
  const [currentLabels, setCurrentLabels] = useState(
    () => getLabels?.() ?? labels
  )
  const rows = useMemo(
    () => filterLabelRows(getLabelRows(currentLabels, auth).all, search),
    [auth, currentLabels, search]
  )
  const nameHeader = translate(T.Name)

  useEffect(() => {
    if (!open) return

    setSearch('')
    setCurrentLabels(getLabels?.() ?? labels)
  }, [getLabels, labels, open])

  const columns = useMemo(
    () => [
      {
        id: 'name',
        accessorKey: 'displayPath',
        header: nameHeader,
        width: '34%',
        minWidth: 180,
        meta: { disableCellTooltip: true },
        cell: ({ row }) => (
          <Box className="label-manage-name">
            <Box className="label-panel-dot" />
            <Box component="span">{row.original.displayPath}</Box>
          </Box>
        ),
      },
      {
        id: 'visibility',
        accessorKey: 'visibility',
        header: translate(T.Visibility),
        width: '28%',
        minWidth: 130,
        meta: { disableCellTooltip: true },
        cell: ({ row }) => (
          <Badge
            type="tag"
            status={row.original.scope === 'group' ? 'information' : 'default'}
          >
            {translate(row.original.visibility)}
          </Badge>
        ),
      },
      {
        id: 'items',
        accessorKey: 'items',
        header: translate(T.Items),
        width: '18%',
        minWidth: 90,
      },
      {
        id: 'actions',
        header: '',
        width: '96px',
        minWidth: 96,
        enableSorting: false,
        meta: { disableCellTooltip: true, disableHeaderTooltip: true },
        cell: ({ row }) =>
          row.original.editable ? (
            <Box className="label-manage-actions">
              <ToggleGroup
                size="small"
                isOutlined={false}
                isSelectable={false}
                sx={ACTION_GROUP_STYLES}
                options={[
                  [
                    {
                      startIcon: <EditPencil width="16px" height="16px" />,
                      onClick: (event) => {
                        event.stopPropagation()
                        onClose?.()
                        onEdit?.(row.original)
                      },
                      tooltip: T.Edit,
                      value: 'edit',
                      sx: ACTION_STYLES,
                    },
                    {
                      startIcon: <Trash width="16px" height="16px" />,
                      onClick: (event) => {
                        event.stopPropagation()
                        onDelete?.(row.original, setCurrentLabels)
                      },
                      tooltip: T.Delete,
                      value: 'delete',
                      sx: DESTRUCTIVE_ACTION_STYLES,
                    },
                  ],
                ]}
              />
            </Box>
          ) : null,
      },
    ],
    [nameHeader, onClose, onDelete, onEdit, translate]
  )

  const content = (
    <Box
      sx={[
        (theme) => getDialogContentStyles(theme),
        (theme) => getManageStyles(theme),
      ]}
    >
      <Box className="label-dialog-header">
        <Box className="label-dialog-heading">
          <Typography component="h2" className="label-dialog-title">
            {translate(T.ManageLabels)}
          </Typography>
          <Typography className="label-dialog-description">
            {translate(T.ManageLabelsConcept)}
          </Typography>
        </Box>
        {!isEmbedded && (
          <Button
            type="transparent"
            iconOnly={<Cancel />}
            aria-label={translate(T.Close)}
            tooltip={T.Close}
            isDisabled={isLoading}
            onClick={onClose}
          />
        )}
      </Box>

      <Box className="label-dialog-body">
        <Box className="label-manage-toolbar">
          <InputField
            className="label-manage-search"
            placeholder={`${translate(T.SearchLabelsInput)}...`}
            startIcon={<Search width="16px" height="16px" />}
            value={search}
            inputProps={{ 'aria-label': translate(T.SearchLabelsInput) }}
            onChange={setSearch}
          />
          <Button
            className="label-manage-create"
            type="primary"
            isDisabled={isLoading}
            onClick={() => {
              onClose?.()
              onCreate?.()
            }}
          >
            {translate(T.Create)}
          </Button>
        </Box>

        <Table
          data={rows}
          columns={columns}
          getRowId={(row) => row.id}
          isFullHeight={false}
          {...(isEmbedded && { size: 'medium', defaultPageSize: 25 })}
          isEmptyContentEnabled
          emptyContentProps={{
            size: 'small',
            title: T.NoLabels,
            subtitle: T.UserLabelsConcept,
          }}
        />
      </Box>

      {!isEmbedded && (
        <Box className="label-dialog-actions with-border">
          <Button type="secondary" isDisabled={isLoading} onClick={onClose}>
            {translate(T.Done)}
          </Button>
        </Box>
      )}
    </Box>
  )

  return isEmbedded ? (
    content
  ) : (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : onClose}
      PaperProps={{
        style: {
          width: 'min(736px, calc(100vw - 28px))',
          maxWidth: 'none',
        },
      }}
    >
      {content}
    </Dialog>
  )
}

ManageLabelForm.propTypes = {
  open: PropTypes.bool,
  labels: PropTypes.object,
  getLabels: PropTypes.func,
  auth: PropTypes.object,
  isEmbedded: PropTypes.bool,
  isLoading: PropTypes.bool,
  onClose: PropTypes.func,
  onCreate: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
}

ManageLabelForm.displayName = 'ManageLabelForm'
