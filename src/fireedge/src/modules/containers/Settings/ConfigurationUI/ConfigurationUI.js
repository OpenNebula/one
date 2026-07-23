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
import { FormWithSchema } from '@ResourcesModule'
import { Translate, useResourceSingleViewContext } from '@ProvidersModule'
import { jsonToXml } from '@UtilsModule'
import { ButtonGroup } from '@ComponentsV2Module'
import {
  RESOURCE_NAMES,
  SCHEMES,
  SERVER_CONFIG,
  T,
  TABLE_VIEW_MODE,
} from '@ConstantsModule'
import {
  UserAPI,
  ZoneAPI,
  useAuth,
  useAuthApi,
  useGeneralApi,
  useViews,
} from '@FeaturesModule'

import { css } from '@emotion/css'
import {
  SystemShut,
  HalfMoon,
  List as ListIcon,
  SunLight,
  ViewGrid,
} from 'iconoir-react'
import {
  FIELDS_ANIMATIONS,
  FIELDS_DATATABLE,
  FIELDS_OTHERS,
  SCHEMA,
} from '@modules/containers/Settings/ConfigurationUI/schema'
import { useSettingWrapper } from '@modules/containers/Settings/Wrapper'
import { Box, Link, debounce, useTheme } from '@mui/material'
import { ReactElement, useCallback, useEffect, useMemo } from 'react'
import {
  FormProvider,
  useController,
  useForm,
  useFormContext,
} from 'react-hook-form'

const { USER } = RESOURCE_NAMES

const THEME_MODES = [
  { icon: HalfMoon, label: T.Dark, value: SCHEMES.DARK },
  { icon: SunLight, label: T.Light, value: SCHEMES.LIGHT },
  { icon: SystemShut, label: T.System, value: SCHEMES.SYSTEM },
]

const TABLE_VIEW_MODES = [
  { icon: ViewGrid, label: T.Card, value: TABLE_VIEW_MODE.CARD },
  { icon: ListIcon, label: T.List, value: TABLE_VIEW_MODE.LIST },
]

const DATATABLE_SETTINGS_FIELDS = FIELDS_DATATABLE.filter(
  ({ name }) => name !== 'ROW_STYLE'
)

const OTHER_TWO_COLUMN_FIELDS = ['DEFAULT_ZONE_ENDPOINT', 'DEFAULT_VIEW']
const OTHER_TWO_COLUMN_LAYOUT = OTHER_TWO_COLUMN_FIELDS.map((name) => [name])
const isTwoColumnOtherField = ({ name }) =>
  OTHER_TWO_COLUMN_FIELDS.includes(name)

/**
 * Theme mode field rendered as a segmented button group.
 *
 * @returns {ReactElement} Theme mode selector
 */
const ThemeModeButtonGroup = () => {
  const { control } = useFormContext()
  const {
    field: { value: selectedScheme, onBlur, onChange },
  } = useController({ name: 'SCHEME', control })

  return (
    <ButtonGroup
      buttons={THEME_MODES.map(({ icon, label, value }) => ({
        title: <Translate word={label} />,
        startIcon: icon,
        dataCy: `settings-ui-SCHEME-${value}`,
        selected: value === selectedScheme,
        onClick: () => {
          onBlur()
          onChange(value)
        },
      }))}
    />
  )
}

/**
 * Data table view mode field rendered as a segmented button group.
 *
 * @returns {ReactElement} Data table view mode selector
 */
const TableViewModeButtonGroup = () => {
  const { control } = useFormContext()
  const {
    field: { value: selectedViewMode, onBlur, onChange },
  } = useController({ name: 'ROW_STYLE', control })

  return (
    <ButtonGroup
      buttons={TABLE_VIEW_MODES.map(({ icon, label, value }) => ({
        title: label,
        startIcon: icon,
        dataCy: `settings-ui-ROW_STYLE-${value}`,
        selected: value === selectedViewMode,
        onClick: () => {
          onBlur()
          onChange(value)
        },
      }))}
    />
  )
}

const style = ({ scale }) => ({
  buttonGroup: css({
    '& .buttongroup-container': { width: '100%' },
    '& .button-container': { flex: 1, justifyContent: 'center' },
    '& .buttongroup-button-icon': { paddingRight: 0 },
    '& .buttongroup-button': { paddingLeft: scale[200] },
  }),
  dataTableSettings: css({
    display: 'flex',
    flexDirection: 'column',
    gap: scale[600],
  }),
  linkPlace: css({
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  }),
  internalLegend: css({
    marginTop: scale[200],
  }),
})

/**
 * Section to change user configuration about UI.
 *
 * @returns {ReactElement} Settings configuration UI
 */
const Settings = () => {
  const { Legend, InternalWrapper } = useSettingWrapper()
  const { user, settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { openResourceSingleView } = useResourceSingleViewContext()

  const { data: zones = [], isLoading } = ZoneAPI.useGetZonesQuery()

  const { changeAuthUser } = useAuthApi()
  const { enqueueError, setTableViewMode, setFullMode } = useGeneralApi()
  const [updateUser] = UserAPI.useUpdateUserMutation()
  const { views, view: userView, hasAccessToResource } = useViews()
  const userAccess = useMemo(() => hasAccessToResource(USER), [userView])
  const { rowStyle, fullViewMode } = SERVER_CONFIG

  const otherFields = useMemo(
    () => FIELDS_OTHERS({ views, userView, zones }),
    [views, userView, zones]
  )
  const otherSingleColumnFields = useMemo(
    () => otherFields.filter((field) => !isTwoColumnOtherField(field)),
    [otherFields]
  )
  const otherTwoColumnFields = useMemo(
    () => otherFields.filter(isTwoColumnOtherField),
    [otherFields]
  )
  const theme = useTheme()
  const classes = useMemo(() => style(theme), [theme])
  const { watch, handleSubmit, ...methods } = useForm({
    reValidateMode: 'onChange',
    defaultValues: useMemo(() => {
      const tablesMode = fireedge?.ROW_STYLE || rowStyle
      const fullMode = fireedge?.FULL_SCREEN_INFO || fullViewMode

      const fireedgeDefault = {
        ...fireedge,
        ROW_STYLE: tablesMode,
        FULL_SCREEN_INFO: fullMode,
      }

      return SCHEMA({ views, userView, zones }).cast(fireedgeDefault, {
        stripUnknown: true,
      })
    }, [fireedge, zones]),
  })

  const handleUpdateUser = useCallback(
    debounce(async (formData = {}) => {
      try {
        if (methods?.formState?.isSubmitting) return
        const formatTemplate = { FIREEDGE: { ...fireedge, ...formData } }
        delete formatTemplate.FIREEDGE.SIDEBAR
        if (
          !formatTemplate?.FIREEDGE?.FULL_SCREEN_INFO ||
          formatTemplate?.FIREEDGE?.FULL_SCREEN_INFO === 'false'
        ) {
          delete formatTemplate?.FIREEDGE?.FULL_SCREEN_INFO
        }
        const template = jsonToXml(formatTemplate)
        await updateUser({ id: user.ID, template, replace: 1 })
      } catch {
        enqueueError(T.SomethingWrong)
      }
    }, 1000),
    [updateUser, fireedge]
  )

  useEffect(() => {
    const subscription = watch((formData) => {
      // update user settings before submit
      const newSettings = {
        TEMPLATE: {
          ...user.TEMPLATE,
          FIREEDGE: {
            ...fireedge,
            ...formData,
          },
        },
      }
      changeAuthUser({ ...user, ...newSettings })

      handleSubmit(handleUpdateUser)()

      // Update full mode and table mode
      setFullMode(formData?.FULL_SCREEN_INFO)
      setTableViewMode(formData?.ROW_STYLE)
    })

    return () => subscription.unsubscribe()
  }, [watch, fireedge])

  return (
    <Box component="form" onSubmit={handleSubmit(handleUpdateUser)}>
      <Legend title={T.ConfigurationUI} />
      {!isLoading && (
        <Box>
          <FormProvider {...methods}>
            <InternalWrapper
              title={T.ThemeMode}
              innerClassName={classes.internalLegend}
            >
              <Box className={classes.buttonGroup}>
                <ThemeModeButtonGroup />
              </Box>
            </InternalWrapper>
            <InternalWrapper
              title={T.DataTablesStyles}
              innerClassName={classes.internalLegend}
            >
              <Box className={classes.dataTableSettings}>
                <Box className={classes.buttonGroup}>
                  <TableViewModeButtonGroup />
                </Box>
                <FormWithSchema
                  cy={'settings-ui'}
                  fields={DATATABLE_SETTINGS_FIELDS}
                />
              </Box>
            </InternalWrapper>
            <InternalWrapper
              title={T.Animations}
              innerClassName={classes.internalLegend}
            >
              <FormWithSchema cy={'settings-ui'} fields={FIELDS_ANIMATIONS} />
            </InternalWrapper>
            <InternalWrapper
              title={T.Others}
              innerClassName={classes.internalLegend}
            >
              <Box className={classes.dataTableSettings}>
                <FormWithSchema
                  cy={'settings-ui'}
                  fields={otherSingleColumnFields}
                />
                <FormWithSchema
                  cy={'settings-ui'}
                  fields={otherTwoColumnFields}
                  columns={OTHER_TWO_COLUMN_LAYOUT}
                />
              </Box>
            </InternalWrapper>
          </FormProvider>
        </Box>
      )}
      {userAccess && (
        <InternalWrapper>
          <Box className={classes.linkPlace}>
            <Link
              color="primary"
              component="button"
              type="button"
              onClick={() => openResourceSingleView(USER, user)}
            >
              <Translate
                word={T.LinkOtherConfigurationsUser}
                values={user.ID}
              />
            </Link>
          </Box>
        </InternalWrapper>
      )}
    </Box>
  )
}

export { Settings }
