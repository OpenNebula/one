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
import { FormWithSchema, PATH, Translate } from '@ComponentsModule'
import { RESOURCE_NAMES, SERVER_CONFIG, T } from '@ConstantsModule'
import {
  UserAPI,
  ZoneAPI,
  useAuth,
  useAuthApi,
  useGeneralApi,
  useViews,
} from '@FeaturesModule'
import { jsonToXml } from '@ModelsModule'
import { css } from '@emotion/css'
import {
  FIELDS_ANIMATIONS,
  FIELDS_DATATABLE,
  FIELDS_OTHERS,
  FIELDS_THEME,
  SCHEMA,
} from '@modules/containers/Settings/ConfigurationUI/schema'
import { useSettingWrapper } from '@modules/containers/Settings/Wrapper'
import { Box, Link, debounce, gridClasses } from '@mui/material'
import { ReactElement, useCallback, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { Link as RouterLink, generatePath } from 'react-router-dom'

const { USER } = RESOURCE_NAMES

const style = () => ({
  content: css({
    [`& .${gridClasses.item}`]: {
      paddingLeft: 0,
      paddingTop: 0,
    },
  }),
  linkPlace: css({
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  }),
  internalLegend: css({
    marginTop: '9px',
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

  const { data: zones = [], isLoading } = ZoneAPI.useGetZonesQuery()

  const { changeAuthUser } = useAuthApi()
  const { enqueueError, setTableViewMode, setFullMode, fixMenu } =
    useGeneralApi()
  const [updateUser] = UserAPI.useUpdateUserMutation()
  const { views, view: userView, hasAccessToResource } = useViews()
  const userAccess = useMemo(() => hasAccessToResource(USER), [userView])
  const { rowStyle, fullViewMode } = SERVER_CONFIG

  const classes = useMemo(() => style())
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
        const template = jsonToXml({ FIREEDGE: { ...fireedge, ...formData } })
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
      const newSettings = { TEMPLATE: { ...user.TEMPLATE, ...formData } }
      changeAuthUser({ ...user, ...newSettings })

      handleSubmit(handleUpdateUser)()

      // update sidebar
      fixMenu(formData?.SIDEBAR)

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
        <Box className={classes.content}>
          <FormProvider {...methods}>
            <InternalWrapper
              title={T.ThemeMode}
              innerClassName={classes.internalLegend}
            >
              <FormWithSchema cy={'settings-ui'} fields={FIELDS_THEME} />
            </InternalWrapper>
            <InternalWrapper
              title={T.DataTablesStyles}
              innerClassName={classes.internalLegend}
            >
              <FormWithSchema cy={'settings-ui'} fields={FIELDS_DATATABLE} />
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
              <FormWithSchema
                cy={'settings-ui'}
                fields={FIELDS_OTHERS({ views, userView, zones })}
              />
            </InternalWrapper>
          </FormProvider>
        </Box>
      )}
      {userAccess && (
        <InternalWrapper>
          <Box className={classes.linkPlace}>
            <Link
              color="secondary"
              component={RouterLink}
              to={generatePath(PATH.SYSTEM.USERS.DETAIL, { id: user.ID })}
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
