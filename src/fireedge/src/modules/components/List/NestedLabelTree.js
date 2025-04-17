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
import {
  AddCircledOutline as AddIcon,
  Plus,
  Trash as RemoveIcon,
  NavArrowDown as ExpandMoreIcon,
  NavArrowRight as ChevronRightIcon,
} from 'iconoir-react'
import { getColorFromString } from '@ModelsModule'
import { Component, useState, useMemo, useCallback, useEffect } from 'react'
import { TreeView, TreeItem } from '@mui/lab'
import { T, STYLE_BUTTONS } from '@ConstantsModule'
import { get, merge, debounce, partition } from 'lodash'
import { Box, TextField, Stack, useTheme } from '@mui/material'
import { sentenceCase } from '@UtilsModule'
import StatusChip from '@modules/components/Status/Chip'
import { GroupAPI, UserAPI, useAuth, useGeneralApi } from '@FeaturesModule'
import AddLabelDialog from '@modules/components/List/AddLabelDialog'
import SubmitButton from '@modules/components/FormControl/SubmitButton'

const renderTree = (
  defaultLabels,
  nodes,
  selectedLabels = [],
  editableGroups,
  handleSelect,
  handleNodeClick,
  handleRemoveLabel,
  handleOpenAddModal,
  parentId = '',
  labelType
) => {
  const theme = useTheme()

  const isResource = Array.isArray(nodes)
  const formatNode = isResource ? nodes : Object.keys(nodes)

  return formatNode.map((key) => {
    const nodeType = labelType ?? key ?? 'resource'
    const isGroup = nodeType === 'group' && parentId?.split('/')?.length === 1
    const isUser = nodeType === 'user' && labelType == null
    const selectedGroup = selectedLabels?.[nodeType]
    const nodeId = parentId ? `${parentId}/${key}` : key
    const labelText = !isResource
      ? sentenceCase(key?.replace(/\$/g, ''))
      : `#${key}`
    const inPath = selectedGroup?.some((label) => label.includes(nodeId))
    const isMainSelection = selectedGroup?.includes(nodeId)
    const isResourceParent =
      !isResource && !key?.includes('$') && !Array.isArray(nodes)
    const isEditable =
      nodeType === 'user' ||
      editableGroups?.[parentId?.split('/')?.[1]] ||
      false
    const isSelectable = isEditable && parentId !== '' && !isResourceParent

    return (
      <TreeItem
        key={nodeId}
        nodeId={nodeId}
        onClick={() => handleNodeClick(nodeId)}
        sx={{
          '& .MuiTreeItem-content.Mui-selected': {
            backgroundColor: 'transparent !important',
          },
          '& .MuiTreeItem-content.Mui-selected:hover': {
            backgroundColor: 'transparent !important',
          },
          '&:hover .MuiTreeItem-content': {
            backgroundColor: 'transparent !important',
          },
        }}
        label={
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mt: 1,
              pl: inPath ? 1 : 0,
              borderLeft: inPath
                ? '0.25rem solid'
                : '0.25rem solid transparent',
              borderColor: isMainSelection
                ? theme.palette.primary.main
                : inPath
                ? theme.palette.grey[400]
                : 'transparent',
              borderBottom: isResourceParent
                ? `2px solid ${theme.palette.divider}`
                : '2px solid transparent',
            }}
          >
            <StatusChip
              className="status-chip"
              noWrap
              onClick={
                isSelectable
                  ? () => handleSelect(nodeId, nodeType)
                  : () => handleNodeClick(nodeId)
              }
              dataCy={nodeId}
              text={
                <Box component="span" sx={{ fontSize: '1rem' }}>
                  {isGroup || isUser || isResourceParent ? (
                    <strong>{labelText}</strong>
                  ) : (
                    labelText
                  )}
                </Box>
              }
              stateColor={
                isSelectable && !isResource && !isResourceParent
                  ? getColorFromString(labelText)
                  : theme.palette.background.paper
              }
            />

            {isEditable && !isUser && !isGroup && !isResourceParent && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  marginLeft: 1,
                }}
              >
                {isEditable && !isResource && !isResourceParent && (
                  <SubmitButton
                    data-cy={'add-' + nodeId}
                    icon={<AddIcon />}
                    tooltip={T.Add}
                    onClick={(event) => {
                      event.stopPropagation()
                      handleOpenAddModal(
                        nodeId?.split('/')?.slice(1)?.join('/'),
                        nodeType
                      )
                    }}
                  />
                )}

                {isEditable && isSelectable && (
                  <SubmitButton
                    data-cy={'remove-' + nodeId}
                    icon={<RemoveIcon />}
                    tooltip={T.Remove}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemoveLabel(nodeId, nodeType)
                    }}
                  />
                )}
              </Box>
            )}
          </Box>
        }
      >
        {!isResource &&
          Object.keys(nodes[key])?.length > 0 &&
          renderTree(
            defaultLabels,
            nodes[key],
            selectedLabels,
            editableGroups,
            handleSelect,
            handleNodeClick,
            handleRemoveLabel,
            handleOpenAddModal,
            nodeId,
            nodeType
          )}
      </TreeItem>
    )
  })
}

/**
 * Component for displaying a nested label tree.
 *
 * @param {object} root0 - Component props
 * @param {Array} root0.selectedRows - Selected table rows
 * @param {string} root0.resourceType - Resource type being rendered
 * @param {boolean} root0.enableAddDialog - Enables add new label button
 * @returns {Component} - Nested tree view of labels
 */
const NestedLabelTree = ({
  selectedRows = [],
  resourceType,
  enableAddDialog = true,
}) => {
  const [expanded, setExpanded] = useState([])
  const { enqueueSuccess, enqueueError } = useGeneralApi()
  const [selectedLabels, setSelectedLabels] = useState({})
  const [search, setSearch] = useState('')

  const [addLabelModalOpen, setAddLabelModalOpen] = useState(false)
  const [addLabelParentNodeId, setAddLabelParentNodeId] = useState(null)
  const [addLabelType, setAddLabelType] = useState(null)

  const [
    addGroupLabel,
    { isLoading: applyingGroupLabel, isSuccess: successGroupAddLabel },
  ] = GroupAPI.useAddGroupLabelMutation()

  const [removeGroupLabel] = GroupAPI.useRemoveGroupLabelMutation()

  const [removeUserLabel] = UserAPI.useRemoveUserLabelMutation()

  const [
    addUserLabel,
    { isLoading: applyingUserLabel, isSuccess: successAddLabel },
  ] = UserAPI.useAddUserLabelMutation()

  const apiLookup = {
    group: addGroupLabel,
    user: addUserLabel,
  }

  const apiRemoveLookup = {
    user: removeUserLabel,
    group: removeGroupLabel,
  }

  useEffect(() => {
    ;(successAddLabel || successGroupAddLabel) &&
      enqueueSuccess(`${T.AddedNewLabel}!`)
  }, [successAddLabel, successGroupAddLabel])

  const {
    user: { ID: uId } = {},
    groups,
    isOneAdmin = false,
    labels: fetchedLabels = {},
    defaultLabels = {},
  } = useAuth()

  const groupIdMap = useMemo(
    () =>
      groups?.reduce((acc, group) => {
        acc[group?.NAME] = group?.ID

        return acc
      }, {}),
    [groups]
  )

  const fmtDefaultLabels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(defaultLabels).map(([type, paths]) => {
          const root = {}

          const validPaths = paths.filter((path) => {
            if (type !== 'group') return true

            const segments = path.split('/').filter(Boolean)

            return (
              segments.length === 0 || Object.hasOwn(groupIdMap, segments?.[0])
            )
          })

          for (const path of validPaths) {
            path
              .split('/')
              .filter(Boolean)
              .reduce((acc, segment, idx) => {
                const shouldPrefix =
                  (type === 'group' && idx > 0) || type === 'user'

                const key = shouldPrefix ? `$${segment}` : segment

                acc[key] ??= {}

                return acc[key]
              }, root)
          }

          return [type, root]
        })
      ),
    [defaultLabels, groupIdMap]
  )

  const parsedLabels = useMemo(
    () => ({
      user: merge(
        {},
        get(fmtDefaultLabels, 'user', {}),
        get(fetchedLabels, 'user', {})
      ),
      group: merge(
        {},
        get(fmtDefaultLabels, 'group', {}),
        get(fetchedLabels, 'group', {})
      ),
    }),
    [fetchedLabels, fmtDefaultLabels]
  )

  const editableGroups = useMemo(
    () =>
      groups?.reduce((acc, group) => {
        const groupName = group?.NAME
        const groupAdmins = [].concat(group?.ADMINS).filter(Boolean)

        if (!groupName) return acc

        if (isOneAdmin) {
          acc[groupName] = true
        } else {
          if (!groupAdmins) return acc
          const adminIDs =
            groupAdmins?.map(({ ID }) => ID).filter(Boolean) ?? []
          acc[groupName] = adminIDs.includes(uId)
        }

        return acc
      }, {}),
    [uId, groups]
  )

  const handleOpenAddModal = (parentNodeId = null, nodeType = 'user') => {
    setAddLabelParentNodeId(parentNodeId)
    setAddLabelType(nodeType)
    setAddLabelModalOpen(true)
  }

  const handleRemoveLabel = async (nodeId, type) => {
    const [label, id] = formatLabel(nodeId, type)

    await apiRemoveLookup?.[type]?.({ id, label })
  }

  const formatLabel = (label, type) => {
    const [splitPath, id] = partition(label.split('/'), (l) =>
      l?.startsWith('$')
    )

    return [
      [...splitPath, ...id?.slice(type === 'user' ? 1 : 2)].join('.'),
      (type === 'user' ? uId : groupIdMap?.[id?.[1]]) ?? -1,
    ]
  }

  const rowIds = useMemo(
    () => selectedRows?.map((row) => row?.original?.ID ?? row?.id),
    [selectedRows]
  )

  const filteredLabels = useMemo(() => {
    if (!search) return parsedLabels

    const filterNodes = (nodes) =>
      Object.keys(nodes).reduce((acc, key) => {
        if (key.toLowerCase()?.includes(search.toLowerCase())) {
          acc[key] = nodes[key]
        } else if (
          nodes[key] &&
          typeof nodes[key] === 'object' &&
          !Array.isArray(nodes[key])
        ) {
          const subTree = filterNodes(nodes[key])
          if (Object.keys(subTree)?.length) {
            acc[key] = subTree
          }
        }

        return acc
      }, {})

    return filterNodes(parsedLabels)
  }, [parsedLabels, search])

  const getAllNodeIds = useCallback(
    (nodes, searchTerm, parentId = '') =>
      Object.keys(nodes).reduce((acc, key) => {
        const nodeId = parentId ? `${parentId}/${key}` : key
        acc.push(nodeId)
        if (
          searchTerm &&
          key?.toLowerCase()?.includes(searchTerm?.toLowerCase())
        ) {
          return acc
        } else {
          if (
            !Array.isArray(nodes[key]) &&
            Object.keys(nodes[key]).length > 0
          ) {
            acc.push(...getAllNodeIds(nodes[key], searchTerm, nodeId))
          }
        }

        return acc
      }, []),
    []
  )

  /* Click handlers */
  const handleNodeClick = useCallback(
    (nodeId) => {
      setExpanded((prevExpanded) =>
        prevExpanded.includes(nodeId)
          ? prevExpanded.filter((id) => id !== nodeId)
          : [...prevExpanded, nodeId]
      )
    },
    [setExpanded]
  )

  const handleSelect = (label, type) => {
    setSelectedLabels((prev) => {
      const newState = { ...prev }

      if (!newState[type]) {
        newState[type] = []
      }

      newState[type] = newState[type].includes(label)
        ? newState[type].filter((node) => node !== label)
        : [...newState[type], label]

      return newState
    })
  }

  const handleExpandAll = () => {
    setExpanded(getAllNodeIds(filteredLabels))
  }

  const handleCollapseAll = () => {
    setExpanded([])
  }

  const handleClearSelections = () => {
    setSelectedLabels([])
  }

  const debouncedExpand = useMemo(
    () =>
      debounce(
        (filtered, searchTerm) =>
          setExpanded(getAllNodeIds(filtered, searchTerm)),
        300
      ),
    []
  )

  useEffect(() => {
    if (search) {
      debouncedExpand(filteredLabels, search)
    } else {
      handleCollapseAll()
    }

    return () => debouncedExpand.cancel()
  }, [search])

  const handleApplySelection = () => {
    if (!resourceType || !selectedRows || !rowIds) return

    const handleUpdate = async () => {
      try {
        await Promise.all(
          Object.entries(selectedLabels).map(async ([type, labels]) => {
            const results = await Promise.all(
              labels?.map(async (label) => {
                const [formattedLabel, id] = formatLabel(label, type)

                return apiLookup?.[type]?.({
                  id,
                  label: formattedLabel,
                  data: { [resourceType]: rowIds },
                })
              })
            )

            return results
          })
        )

        handleClearSelections()
      } catch (error) {
        enqueueError(`${T.FailedApplyLabel}: ${error}`)
      }
    }

    handleUpdate()
  }

  const handleCloseModal = () => {
    setAddLabelParentNodeId(null)
    setAddLabelModalOpen(false)
    setAddLabelType(null)
  }

  const handleSubmitLabel = async (formData) => {
    const { groupId, name, parentNodeId, type } = formData
    // eslint-disable-next-line no-useless-escape
    const sanitizeName = name.replace(/[^a-zA-Z.\/0-9]/g, '')
    const fmtLabel =
      parentNodeId != null
        ? `${parentNodeId}/$${sanitizeName}`
        : `$${sanitizeName}`

    const sanitizeLabel = fmtLabel.replace(/\//g, '.')

    await apiLookup?.[type]?.({
      id: type === 'user' ? uId : groupId,
      label: sanitizeLabel,
    })

    setAddLabelParentNodeId(null)
    setAddLabelType(null)
    setAddLabelModalOpen(false)
  }

  return (
    <>
      <Stack
        spacing={1}
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        <TextField
          size="small"
          placeholder={`${T.Search}...`}
          variant="outlined"
          fullWidth
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            paddingLeft: 1,
            paddingRight: 1,
          }}
        />
        <Stack direction="row" spacing={1} pl={1}>
          <SubmitButton
            data-cy={'expand-all'}
            onClick={handleExpandAll}
            isSubmitting={applyingUserLabel || applyingGroupLabel}
            importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
            label={T.Expand}
            disabled={applyingUserLabel || applyingGroupLabel}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
          />
          <SubmitButton
            data-cy={'collapse-all'}
            onClick={handleCollapseAll}
            isSubmitting={applyingUserLabel || applyingGroupLabel}
            importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
            label={T.Collapse}
            disabled={applyingUserLabel || applyingGroupLabel}
            size={STYLE_BUTTONS.SIZE.MEDIUM}
            type={STYLE_BUTTONS.TYPE.FILLED}
          />
          {Object.values(selectedLabels)?.flat()?.length > 0 && (
            <SubmitButton
              data-cy={'clear-all'}
              onClick={handleClearSelections}
              isSubmitting={applyingUserLabel || applyingGroupLabel}
              importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
              label={T.ClearSelection}
              disabled={applyingUserLabel || applyingGroupLabel}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
            />
          )}
          {resourceType &&
            selectedRows?.length > 0 &&
            Object.values(selectedLabels)?.flat()?.length > 0 && (
              <SubmitButton
                data-cy={'apply-selected-all'}
                onClick={handleApplySelection}
                importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
                isSubmitting={applyingUserLabel || applyingGroupLabel}
                label={T.Apply}
                disabled={applyingUserLabel || applyingGroupLabel}
                size={STYLE_BUTTONS.SIZE.MEDIUM}
                type={STYLE_BUTTONS.TYPE.FILLED}
              />
            )}
        </Stack>
        <Stack direction="row" spacing={1} pl={1}>
          {enableAddDialog && (
            <SubmitButton
              data-cy={'add-new-label-modal'}
              onClick={() => setAddLabelModalOpen((prev) => !prev)}
              icon={<Plus />}
              isSubmitting={applyingUserLabel || applyingGroupLabel}
              disabled={applyingUserLabel || applyingGroupLabel}
              importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
              label={T.AddNewLabel}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.FILLED}
            />
          )}
        </Stack>
        <TreeView
          data-cy={'labels-tree'}
          expanded={expanded}
          defaultCollapseIcon={<ExpandMoreIcon />}
          defaultExpandIcon={<ChevronRightIcon />}
          sx={{ overflow: 'auto', flexGrow: 1 }}
        >
          {renderTree(
            fmtDefaultLabels,
            filteredLabels,
            selectedLabels,
            editableGroups,
            handleSelect,
            handleNodeClick,
            handleRemoveLabel,
            handleOpenAddModal
          )}
        </TreeView>
      </Stack>
      <AddLabelDialog
        open={addLabelModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitLabel}
        parentNodeId={addLabelParentNodeId}
        addLabelType={addLabelType}
        groupIdMap={groupIdMap}
        groups={groups?.filter(({ NAME }) => editableGroups?.[NAME])}
        isLoading={applyingUserLabel || applyingGroupLabel}
      />
    </>
  )
}

NestedLabelTree.propTypes = {
  selectedRows: PropTypes.array,
  resourceType: PropTypes.string,
  enableAddDialog: PropTypes.bool,
}

export default NestedLabelTree
