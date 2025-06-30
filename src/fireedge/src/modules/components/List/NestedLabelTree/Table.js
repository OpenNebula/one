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
import ButtonToTriggerForm from '@modules/components/Forms/ButtonToTriggerForm'
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
      if (labelType === 'group') {
        if (lblPath?.length <= 1) {
          return // Exclude groups without labels
        }
      }

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
    () => labelsArray?.[labelType]?.map(fmtLabel)?.filter(Boolean) ?? [],
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
        fixedHeight: '500px',
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
          <ButtonToTriggerForm
            buttonProps={{
              importance: STYLE_BUTTONS.IMPORTANCE.SECONDARY,
              size: STYLE_BUTTONS.SIZE.MEDIUM,
              type: STYLE_BUTTONS.TYPE.NOBORDER,
              icon: <Trash />,
              'data-cy': `remove-label-${params.row.displayPath}`,
              tooltip: T.Remove,
            }}
            options={[
              {
                isConfirmDialog: true,
                dialogProps: {
                  children: (
                    <div style={{ padding: '8px' }}>
                      <h2
                        style={{
                          fontSize: '18px',
                          fontWeight: 'bold',
                          marginBottom: '12px',
                        }}
                      >
                        {T.DeleteLabelConcept}
                      </h2>
                      <p style={{ marginBottom: '8px' }}>
                        {T.DeleteTheFollowingLabel}:
                      </p>
                      <div style={{ paddingLeft: '12px' }}>
                        <div style={{ marginBottom: '6px' }}>
                          <span style={{ fontWeight: 'bold' }}>Name: </span>
                          <span>{params.row.name}</span>
                        </div>
                        <div>
                          <span style={{ fontWeight: 'bold' }}>Path: </span>
                          <span>{params.row.displayPath}</span>
                        </div>
                      </div>
                    </div>
                  ),
                  title: <p>{T.DeleteLabel}</p>,
                  fixedWidth: '500px',
                  fixedHeight: '400px',
                },
                onSubmit: () => handleRemove(params.row),
              },
            ]}
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
          data-cy={'label-type-selector'}
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
          <ToggleButton data-cy="label-type-user" value="user">
            <UserIcon fontSize="small" style={{ marginRight: 3 }} />
            {T.User}
          </ToggleButton>
          <ToggleButton data-cy="label-type-group" value="group">
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
