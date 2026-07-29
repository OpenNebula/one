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
import { Component, useEffect, useState } from 'react'
import { Box } from '@mui/material'
import { Cancel, Check, Copy, EditPencil } from 'iconoir-react'

import { T } from '@ConstantsModule'
import {
  Button,
  InputField,
  Table,
  ToggleGroup,
  Tooltip,
} from '@ComponentsV2Module'
import { useClipboard } from '@HooksModule'
import { getFooterStyles } from './styles'

const OPTIONS = ['auto', '-']

/**
 * Render a v2 panel for editing the image serial attribute.
 *
 * @param {object} props - Props
 * @param {Function} props.handleEditAttribute - Function to edit the attribute
 * @param {boolean} props.isDisabled - Whether actions are disabled
 * @param {string} props.value - Current serial value
 * @returns {Component} Serial panel
 */
const SerialPanel = ({
  handleEditAttribute,
  isDisabled = false,
  value = '',
}) => {
  const { copy, isCopied } = useClipboard()
  const [isEditing, setIsEditing] = useState(false)
  const [serial, setSerial] = useState(value ?? '')

  useEffect(() => {
    setSerial(value ?? '')
  }, [value])

  const handleCancel = () => {
    setSerial(value ?? '')
    setIsEditing(false)
  }

  const handleSubmit = async () => {
    const nextSerial = serial === '-' ? '' : serial
    const normalizedSerial = OPTIONS.includes(nextSerial?.toLowerCase?.())
      ? nextSerial.toLowerCase()
      : nextSerial

    await handleEditAttribute?.('SERIAL', normalizedSerial)
    setIsEditing(false)
  }

  const columns = [
    { accessorKey: 'key', header: '', grow: false },
    {
      id: 'value',
      header: '',
      cell: ({ row }) => (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            alignItems: 'center',
          }}
        >
          <Tooltip title={row?.original?.value} followCursor>
            <Box
              component="span"
              data-cy="serial"
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {row?.original?.value ?? '-'}
            </Box>
          </Tooltip>
          <ToggleGroup
            size="small"
            isOutlined={false}
            isSelectable={false}
            sx={(theme) => ({
              bgcolor: 'transparent',
              padding: '0px',
              gap: `${theme.scale[100]}px`,
              justifyContent: 'flex-end',
              display: 'none',
            })}
            options={[
              [
                {
                  startIcon: <Copy width="16px" height="16px" />,
                  onClick: () => copy(`"SERIAL": "${value ?? ''}"`),
                  value: 'copy',
                  tooltip: !isCopied ? T.Copy : T.Copied,
                  sx: {
                    padding: '0 0 0 8px',
                    bgcolor: 'transparent',
                    '&:hover': {
                      color: 'icon.actionHover',
                    },
                  },
                },
                {
                  startIcon: <EditPencil width="16px" height="16px" />,
                  onClick: () => setIsEditing(true),
                  tooltip: T.Edit,
                  value: 'edit',
                  isDisabled,
                  sx: {
                    padding: '0 0 0 8px',
                    bgcolor: 'transparent',
                    '&:hover': {
                      color: 'icon.actionHover',
                    },
                  },
                },
              ],
            ]}
          />
        </Box>
      ),
    },
  ]

  return (
    <Table
      title={T.Serial}
      data={[{ key: T.Serial, value: value || '-' }]}
      columns={columns}
      size="medium"
      sx={{
        '& tbody tr:hover': {
          '& .toggle-group-container': {
            display: 'flex',
          },
        },
      }}
      isDisabled={isDisabled}
      isDisablePagination
      isFullHeight={false}
      footer={
        isEditing && (
          <Box sx={(theme) => getFooterStyles({ theme })}>
            <InputField
              placeholder={T.Serial}
              value={serial}
              onChange={(nextValue) => setSerial(nextValue)}
            />
            <Button
              size="medium"
              type="primary"
              onClick={handleSubmit}
              iconOnly={<Check width="16px" height="16px" />}
              isDisabled={isDisabled}
              sx={{
                height: '40px',
                width: '40px',
                padding: '8px',
                flex: '0 0 40px',
              }}
            />
            <Button
              size="medium"
              type="transparent"
              onClick={handleCancel}
              iconOnly={<Cancel width="16px" height="16px" />}
              sx={{
                height: '40px',
                width: '40px',
                padding: '8px',
                flex: '0 0 40px',
              }}
            />
          </Box>
        )
      }
    />
  )
}

SerialPanel.propTypes = {
  handleEditAttribute: PropTypes.func,
  isDisabled: PropTypes.bool,
  value: PropTypes.string,
}

SerialPanel.displayName = 'SerialPanel'

export default SerialPanel
