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
import DataGridTable from '@modules/components/Tables/DataGrid'
import SubmitButton from '@modules/components/FormControl/SubmitButton'
import { useLabelTree } from '@modules/components/List/NestedLabelTree/reducer'
import { useModalsApi, useAuth } from '@FeaturesModule'
import { labelsToArray } from '@modules/components/List/NestedLabelTree/utils'
import { Component, useMemo, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { Tr } from '@modules/components/HOC'
import {
  Group as GroupIcon,
  User as UserIcon,
  Plus,
  Trash,
} from 'iconoir-react'
import { useLabelMutations } from '@modules/components/List/NestedLabelTree/handlers'
import { buildLabelTreeState } from '@UtilsModule'
import { Form } from '@modules/components/Forms'
const { Labels } = Form

/**
 *@returns {Component} - Label table
 */
const LabelTable = () => {
  const {
    state: { __info, ...treeState },
    actions: { setTree },
    resetInitialState,
  } = useLabelTree({ ...useAuth() })

  const [{ addLabel, removeLabel }] = useLabelMutations()
  const { showModal } = useModalsApi()

  const [labelType, setLabelType] = useState('user')

  const handleRemove = async (data) => {
    const updatedTree = await removeLabel({
      formData: data,
      state: treeState,
      info: { ...__info, labelType },
    })

    setTree(
      buildLabelTreeState({ labels: updatedTree, user: { ID: __info?.uId } })
    )
    resetInitialState()
  }

  const labelsArray = useMemo(() => labelsToArray(treeState), [treeState])

  const fmtLabel = useCallback(
    (label) => {
      const lblPath = label?.split('/')

      return {
        id: label,
        name: lblPath?.slice(-1)?.[0]?.replace(/\$/g, ''),
        fullPath: label,
        displayPath: label?.replace(/\$/g, ''),
        type: labelType,
      }
    },
    [labelType]
  )

  const tableData = useMemo(
    () => labelsArray?.[labelType]?.map(fmtLabel) ?? [],
    [labelType, labelsArray]
  )

  const handleSubmit = useCallback(
    async (data) => {
      const updatedTree = await addLabel({
        formData: data,
        state: treeState,
        info: __info,
      })

      setTree(
        buildLabelTreeState({ labels: updatedTree, user: { ID: __info?.uId } })
      )
      resetInitialState()
    },
    [addLabel, treeState, __info]
  )

  const handleCreateLabel = () => {
    showModal({
      id: 'create-label',
      dialogProps: {
        title: 'Create Label',
        dataCy: 'modal-create-label',
        fixedWidth: '500px',
        fixedHeight: '400px',
      },
      form: Labels.CreateForm,
      onSubmit: handleSubmit,
    })
  }

  const columns = [
    {
      field: 'name',
      headerName: Tr(T.Label),
      flex: 1,
      minWidth: 120,
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: true,
      renderCell: (params) => <Box sx={{ pl: 1 }}>{params.value}</Box>,
    },
    {
      field: 'displayPath',
      headerName: Tr(T.FullPath),
      flex: 3,
      minWidth: 200,
      headerAlign: 'left',
      align: 'left',
      disableColumnMenu: true,
      renderCell: (params) => <Box sx={{ pl: 1 }}>{params.value}</Box>,
    },
    {
      field: 'actions',
      headerName: Tr(T.Actions),
      minWidth: 120,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      renderCell: (params) => (
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SubmitButton
            data-cy={'remove-label'}
            icon={<Trash />}
            tooltip={T.Remove}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.NOBORDER}
            importance={STYLE_BUTTONS.IMPORTANCE.DANGER}
            loadOnIcon
            onClick={() => handleRemove(params.row)}
          />
        </Box>
      ),
    },
  ]

  return (
    <Box
      sx={{
        height: '70vh',
        width: '100%',
      }}
    >
      <Box
        sx={{
          gap: 2,
          display: 'flex',
          alignItems: 'start',
          justifyContent: 'start',
          mb: 2,
        }}
      >
        <ToggleButtonGroup
          value={labelType}
          exclusive
          onChange={(_, newValue) => {
            if (newValue !== null) {
              setLabelType(newValue)
            }
          }}
          sx={{
            borderRadius: '100rem',
            '& .MuiToggleButton-root': {
              borderRadius: '100rem',
            },
          }}
          size="small"
        >
          <ToggleButton value="user">
            <UserIcon fontSize="small" style={{ marginRight: 3 }} />
            {T.User}
          </ToggleButton>
          <ToggleButton value="group">
            <GroupIcon fontSize="small" style={{ marginRight: 3 }} />
            {T.Group}
          </ToggleButton>
        </ToggleButtonGroup>

        <SubmitButton
          data-cy={'create-label'}
          icon={<Plus />}
          label={T.CreateLabel}
          size={STYLE_BUTTONS.SIZE.MEDIUM}
          type={STYLE_BUTTONS.TYPE.FILLED}
          importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
          loadOnIcon
          onClick={handleCreateLabel}
        />
      </Box>
      <DataGridTable
        enableToolbar
        data={[{ data: tableData }]}
        columns={columns}
      />
    </Box>
  )
}

LabelTable.propTypes = {
  treeState: PropTypes.object,
  onRemove: PropTypes.func,
}

export default LabelTable
