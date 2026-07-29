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
/* eslint-disable jsdoc/require-jsdoc */

import React, { useEffect, useState } from 'react'
import {
  Box,
  Autocomplete,
  TextField,
  Checkbox,
  FormControlLabel,
  Button,
} from '@mui/material'
import * as iconoir from 'iconoir-react'
import { RESOURCE_NAMES } from '@ConstantsModule'
import { useResourceSingleView } from '@modules/containers/ResourceSingleView'

export const TestComponents = () => {
  const [module, setModule] = useState(null)
  const [selected, setSelected] = useState(null)
  const [props, setProps] = useState(null)
  const { ResourceSingleView, openResourceSingleView } = useResourceSingleView()

  useEffect(() => {
    import('@ComponentsV2Module').then((mod) => {
      setModule(mod)
    })
  }, [])
  const options = ['All-Iconoir-Icons'].concat(Object.keys(module ?? {})).flat()

  const tableData = [
    {
      id: '1',
      name: 'Andres',
      email: 'Andres@email.com',
    },
    {
      id: '2',
      name: 'Victor',
      email: 'Victor@email.com',
    },
    {
      id: '3',
      name: 'David',
      email: 'David@email.com',
    },
    {
      id: '4',
      name: 'Jorge',
      email: 'Jorge@email.com',
    },
    {
      id: '5',
      name: 'Miguel',
      email: 'Miguel@email.com',
    },
  ]

  const tableColumns = [
    {
      accessorKey: 'id',
      header: 'ID',
      width: '10%',
    },
    {
      accessorKey: 'name',
      header: 'Name',
      width: '35%',
    },
    {
      accessorKey: 'email',
      header: 'Email',
      width: '55%',
    },
  ]

  const acompleteOptions = {
    options: [
      {
        label: 'Accordion options',
        value: [
          { title: 'Title', description: 'Hello World, This is a accordion' },
          { title: 'Hello', description: 'Hello World, This is a accordion' },
          { title: 'Hello', description: 'Hello World, This is a accordion' },
        ],
      },
      {
        label: 'Checkbox options',
        value: [
          { text: 'text', value: 1 },
          { text: 'text', value: 2, checked: true },
          { text: 'text', value: 3, checked: true, disabled: true },
        ],
      },
      {
        label: 'Dropdown options',
        value: [
          { text: 'text', value: 1 },
          { text: 'text', value: 2, checked: true },
          { text: 'text', value: 3, startIcon: iconoir.Accessibility },
          {
            text: 'text',
            value: 4,
            startIcon: iconoir.Accessibility,
            endIcon: iconoir.Accessibility,
          },
        ],
      },
      {
        label: 'List options/children',
        value: <Box>Child</Box>,
      },
      {
        label: 'Radio options',
        value: [
          { text: 'text', value: 1 },
          { text: 'text', value: 2 },
          { text: 'text', value: 3 },
        ],
      },
    ],

    direction: [
      {
        label: 'Row',
        value: 'row',
      },
      {
        label: 'Column',
        value: 'column',
      },
    ],

    status: [
      {
        label: 'Default',
        value: 'default',
      },
      {
        label: 'Success',
        value: 'success',
      },
      {
        label: 'Error',
        value: 'error',
      },
      {
        label: 'Information',
        value: 'information',
      },
      {
        label: 'Warning',
        value: 'warning',
      },

      {
        label: 'Disabled',
        value: 'disabled',
      },
      {
        label: 'Miscellaneous',
        value: 'miscellaneous',
      },
      {
        label: 'Miscellaneous2',
        value: 'miscellaneous2',
      },
      {
        label: 'Miscellaneous3',
        value: 'miscellaneous3',
      },
      {
        label: 'Miscellaneous4',
        value: 'miscellaneous4',
      },
      {
        label: 'Miscellaneous5',
        value: 'miscellaneous5',
      },
    ],

    type: [
      {
        label: 'Primary',
        value: 'primary',
      },
      {
        label: 'Secondary',
        value: 'secondary',
      },
      {
        label: 'Inline',
        value: 'inline',
      },
      {
        label: 'Ordered (list only)',
        value: 'ordered',
      },
    ],

    size: [
      {
        label: 'Extra Small',
        value: 'extraSmall',
      },
      {
        label: 'Small',
        value: 'small',
      },
      {
        label: 'Medium',
        value: 'medium',
      },
      {
        label: 'Large',
        value: 'large',
      },
    ],
    icon: [].concat(Object.keys(iconoir ?? {})).flat(),
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', gap: 1, p: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onClick={() => openResourceSingleView(RESOURCE_NAMES.HOST, 0)}
        >
          Open Host #0
        </Button>
        <Button
          size="small"
          variant="outlined"
          onClick={() => openResourceSingleView(RESOURCE_NAMES.VM, 0)}
        >
          Open VM #0
        </Button>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1,
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              zIndex: 99999,
              mb: 2,
            }}
          >
            <Autocomplete
              size="small"
              options={options}
              value={selected}
              onChange={(_, value) => {
                if (value === 'Table') {
                  setProps({
                    data: tableData,
                    columns: tableColumns,
                  })
                } else {
                  setProps(null)
                }
                setSelected(value)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Pick component"
                  variant="outlined"
                  sx={{
                    width: '200px',
                  }}
                />
              )}
            />
          </Box>
          {[]
            .concat(Object.entries(module?.[selected]?.propTypes ?? {}))
            ?.filter(([name]) => !/^on[A-Z]/.test(name)) // Remove handler functions
            ?.map(([name]) => {
              const getOptionType = () => {
                const match = name.match(
                  /(?<icon>icon|startIcon|endIcon|iconOnly)|^(?<boolean>is[A-Z].*)$|^(?<size>size)$|^(?<status>status|variant)$|^(?<type>type)$|^(?<compoptions>options|children)$|^(?<direction>direction)$/i
                )

                if (!match?.groups) return null

                const {
                  icon,
                  boolean,
                  size,
                  status,
                  type,
                  compoptions,
                  direction,
                } = match.groups

                if (icon) return 'icon'
                if (boolean) return 'boolean'
                if (size) return 'size'
                if (status) return 'status'
                if (type) return 'type'
                if (compoptions) return 'options'
                if (direction) return 'direction'

                return null
              }

              const oType = getOptionType()
              const isBoolean = oType === 'boolean'
              const isIcon = oType === 'icon'

              const aOptions = acompleteOptions?.[oType] ?? []

              return isBoolean ? (
                <FormControlLabel
                  value="left"
                  label={name}
                  control={
                    <Checkbox
                      onChange={(_, value) =>
                        setProps((prev) =>
                          Object.fromEntries(
                            Object.entries({
                              ...prev,
                              [name]: isIcon ? iconoir?.[value] : value,
                            }).filter(([, v]) => v != null)
                          )
                        )
                      }
                    />
                  }
                />
              ) : (
                <Autocomplete
                  size="small"
                  freeSolo
                  options={aOptions}
                  value={props?.[name]}
                  onChange={(_, value) =>
                    setProps((prev) =>
                      Object.fromEntries(
                        Object.entries({
                          ...prev,
                          [name]: isIcon
                            ? iconoir?.[value]
                            : value?.value ?? value,
                        }).filter(([, v]) => v != null)
                      )
                    )
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={name}
                      variant="outlined"
                      sx={{
                        width: '200px',
                      }}
                    />
                  )}
                />
              )
            })}
        </Box>
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '0.5rem solid #888',
            borderRadius: '2px',
          }}
        >
          {module && selected ? (
            selected === 'All-Iconoir-Icons' ? (
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 1,
                  height: '100%',
                  overflowY: 'auto',
                  width: '100%',
                  paddingBottom: '20px',
                }}
              >
                {Object.entries(iconoir)
                  .filter(
                    ([name]) =>
                      ![
                        'IconoirProvider',
                        'IconoirContext',
                        'IconoirContextValue',
                      ].includes(name)
                  )
                  .map(([name, Icon]) => (
                    <Box
                      key={name}
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: 80,
                      }}
                    >
                      <Icon width={22} height={22} />
                      <Box
                        sx={{
                          fontSize: 10,
                          textAlign: 'center',
                          wordBreak: 'break-all',
                        }}
                      >
                        {name}
                      </Box>
                    </Box>
                  ))}
              </Box>
            ) : (
              <Box>{React.createElement(module[selected], props)}</Box>
            )
          ) : (
            <Box sx={{ color: '#888' }}>Select a component to preview</Box>
          )}
        </Box>
      </Box>
      <ResourceSingleView />
    </Box>
  )
}
