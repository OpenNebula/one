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
import {
  ButtonGroup,
  ResourceActionConfirmation,
  SubmitButton,
  Table,
  Tag,
} from '@ComponentsV2Module'
import { useLabelTree } from '@modules/resources/resources/Settings/NestedLabelTree/reducer'
import { useModalsApi, useAuth } from '@FeaturesModule'
import { labelsToArray } from '@modules/resources/resources/Settings/NestedLabelTree/utils'
import { Component, useMemo, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Box } from '@mui/material'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import {
  Group as GroupIcon,
  User as UserIcon,
  Plus,
  Trash,
} from 'iconoir-react'
import { useLabelMutations } from '@modules/resources/resources/Settings/NestedLabelTree/handlers'
import { buildLabelTreeState } from '@UtilsModule'
import { CreateForm as CreateLabelForm } from '@modules/resources/resources/Settings/Forms'
import { getSeededLabelColor } from '@ModelsModule'
import { useTranslation } from '@ProvidersModule'

/**
 *@returns {Component} - Label table
 */
const LabelTable = () => {
  const { translate } = useTranslation()
  const auth = useAuth()
  const {
    state: { __info, ...treeState },
    actions: { setTree },
    resetInitialState,
  } = useLabelTree(auth)

  const [{ addLabel, removeLabel }] = useLabelMutations()
  const { showModal } = useModalsApi()

  const [labelType, setLabelType] = useState('user')

  const buildTree = useCallback(
    (labels) => buildLabelTreeState({ ...auth, labels }),
    [auth]
  )

  const handleRemove = async (data) => {
    const updatedTree = await removeLabel({
      formData: data,
      state: treeState,
      info: { ...__info, labelType },
    })

    const nextTree = buildTree(updatedTree)
    setTree(nextTree)
    resetInitialState(nextTree)
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

      const nextTree = buildTree(updatedTree)
      setTree(nextTree)
      resetInitialState(nextTree)
    },
    [addLabel, buildTree, treeState, __info]
  )

  const handleCreateLabel = () => {
    showModal({
      id: 'create-label',
      dialogProps: {
        title: T.CreateLabel,
        dataCy: 'modal-create-label',
        fixedWidth: '500px',
        fixedHeight: '500px',
      },
      form: CreateLabelForm,
      onSubmit: handleSubmit,
    })
  }

  const openRemoveLabelForm = (row) =>
    showModal({
      isConfirmDialog: true,
      dialogProps: {
        description: (
          <ResourceActionConfirmation
            description={
              <Box sx={{ display: 'grid', gap: 1 }}>
                <Box>{translate(T.DeleteLabelConcept)}</Box>
                <Box sx={{ display: 'grid', gap: 0.75, pl: 1 }}>
                  <Box>
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {translate(T.Name)}:{' '}
                    </Box>
                    {row.name}
                  </Box>
                  <Box>
                    <Box component="span" sx={{ fontWeight: 700 }}>
                      {translate(T.Path)}:{' '}
                    </Box>
                    {row.displayPath}
                  </Box>
                </Box>
              </Box>
            }
            resourceType={T.Labels}
          />
        ),
        title: T.DeleteLabel,
        confirmLabel: T.Delete,
        confirmButtonProps: { isDestructive: true },
        dialogWidth: '500px',
        dialogMaxWidth: '500px',
      },
      onSubmit: () => handleRemove(row),
    })

  const columns = [
    {
      id: 'name',
      accessorKey: 'name',
      header: T.Label,
      minWidth: 160,
      grow: false,
      meta: { disableCellTooltip: true },
      cell: ({ row }) => (
        <Tag
          title={row.original.name}
          status={row.original.type === 'group' ? 'information' : 'default'}
          customColor={getSeededLabelColor(row.original.displayPath)}
        />
      ),
    },
    {
      id: 'displayPath',
      accessorKey: 'displayPath',
      header: T.FullPath,
      minWidth: 240,
      truncate: true,
    },
    {
      id: 'actions',
      header: '',
      minWidth: 72,
      grow: false,
      accessorFn: (row) => row.displayPath,
      enableSorting: false,
      meta: { disableCellTooltip: true, disableHeaderTooltip: true },
      cell: ({ row }) => (
        <Box className="label-actions">
          <SubmitButton
            aria-label={T.Remove}
            iconOnly={<Trash />}
            data-cy={`remove-label-${row.original.displayPath}`}
            tooltip={T.Remove}
            type={STYLE_BUTTONS.TYPE.TRANSPARENT}
            isDestructive
            onClick={(event) => {
              event.stopPropagation()
              openRemoveLabelForm(row.original)
            }}
          />
        </Box>
      ),
    },
  ]

  const labelTypeTitle = labelType === 'user' ? T.UserLabels : T.GroupLabels
  const labelTypeConcept =
    labelType === 'user' ? T.UserLabelsConcept : T.GroupLabelsConcept

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: 'min(70vh, 760px)',
        minHeight: 420,
        minWidth: 0,
        width: '100%',
        '& .table-toolbar': {
          height: '40px',
          alignItems: 'stretch',
        },
        '& .table-toolbar-search, & .table-toolbar-custom, & .buttongroup-container':
          {
            height: '100%',
          },
        '& .table-toolbar .searchbar-slots': {
          margin: 0,
        },
        '& .table-toolbar-custom': {
          alignItems: 'stretch',
        },
        '& .table-toolbar-custom > span': {
          display: 'flex',
          height: '100%',
        },
        '& .table-toolbar-custom .MuiButton-root': {
          height: '100%',
          minHeight: 0,
        },
        '& .buttongroup-container .button-container': {
          height: '100%',
        },
        '& .label-create-button': {
          width: '40px',
          padding: '8px',
        },
      }}
    >
      <Table
        title={labelTypeTitle}
        data={tableData}
        columns={columns}
        getRowId={(row) => row.id}
        isEnableSearchBar
        isFullHeight
        defaultPageSize={10}
        pageSizeOptions={[10, 25, 50]}
        searchPlaceholder={T.SearchLabels}
        emptyContentProps={{
          title: T.NoLabels,
          subtitle: labelTypeConcept,
          action: handleCreateLabel,
          actionTitle: T.CreateLabel,
        }}
        toolbar={
          <>
            <ButtonGroup
              dataCy="label-type-selector"
              selected={labelType}
              onSelectionChange={(next) => {
                const [value] = [...(next ?? [])]
                value && setLabelType(value)
              }}
              buttons={[
                {
                  value: 'user',
                  dataCy: 'label-type-user',
                  title: T.User,
                  startIcon: <UserIcon height={16} width={16} />,
                },
                {
                  value: 'group',
                  dataCy: 'label-type-group',
                  title: T.Group,
                  startIcon: <GroupIcon height={16} width={16} />,
                },
              ]}
            />

            <SubmitButton
              aria-label={T.CreateLabel}
              data-cy={'create-label'}
              iconOnly={<Plus height={16} width={16} />}
              tooltip={T.CreateLabel}
              type={STYLE_BUTTONS.TYPE.SECONDARY}
              loadOnIcon
              onClick={handleCreateLabel}
              size="medium"
              className="label-create-button"
            />
          </>
        }
        sx={{
          '& tbody tr:not(.filler-row):not(.table-empty-row):hover': {
            cursor: 'default',
          },
          '& .label-actions': {
            display: 'flex',
            justifyContent: 'flex-end',
            opacity: 0,
            pointerEvents: 'none',
          },
          '& tbody tr:hover .label-actions, & tbody tr:focus-within .label-actions':
            {
              opacity: 1,
              pointerEvents: 'auto',
            },
        }}
      />
    </Box>
  )
}

LabelTable.propTypes = {
  treeState: PropTypes.object,
  onRemove: PropTypes.func,
}

export default LabelTable
