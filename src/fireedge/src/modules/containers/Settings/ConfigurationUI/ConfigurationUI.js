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
import { Box, Link, Paper, debounce, useTheme } from '@mui/material'
import { ReactElement, useCallback, useEffect, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import {
  PATH,
  ButtonToTriggerForm,
  FormWithSchema,
  Translate,
  Tr,
  Form,
} from '@ComponentsModule'
import {
  useAuth,
  useAuthApi,
  useViews,
  useGeneralApi,
  UserAPI,
  ZoneAPI,
  SystemAPI,
} from '@FeaturesModule'
import { T, ONEADMIN_ID, SERVERADMIN_ID, AUTH_DRIVER } from '@ConstantsModule'
import {
  FIELDS,
  SCHEMA,
} from '@modules/containers/Settings/ConfigurationUI/schema'
import { jsonToXml } from '@ModelsModule'
import { Link as RouterLink, generatePath } from 'react-router-dom'
import { generateDocLink } from '@UtilsModule'
import { css } from '@emotion/css'

const useStyles = (theme) => ({
  content: css({
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
  }),
})

/**
 * Section to change user configuration about UI.
 *
 * @returns {ReactElement} Settings configuration UI
 */
const Settings = () => {
  const { user, settings: { FIREEDGE: fireedge = {} } = {} } = useAuth()
  const { data: zones = [], isLoading } = ZoneAPI.useGetZonesQuery()
  const { data: version } = SystemAPI.useGetOneVersionQuery()

  const { changeAuthUser } = useAuthApi()
  const { enqueueError, enqueueSuccess } = useGeneralApi()
  const [updateUser] = UserAPI.useUpdateUserMutation()
  const [changePassword, { isSuccess: isSuccessChangePassword }] =
    UserAPI.useChangePasswordMutation()
  const { views, view: userView } = useViews()

  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const { watch, handleSubmit, ...methods } = useForm({
    reValidateMode: 'onChange',
    defaultValues: useMemo(
      () =>
        SCHEMA({ views, userView, zones }).cast(fireedge, {
          stripUnknown: true,
        }),
      [fireedge, zones]
    ),
  })

  const handleUpdateUser = useCallback(
    debounce(async (formData) => {
      try {
        if (methods?.formState?.isSubmitting) return
        const template = jsonToXml({ FIREEDGE: formData })
        await updateUser({ id: user.ID, template, replace: 1 })
      } catch {
        enqueueError(T.SomethingWrong)
      }
    }, 1000),
    [updateUser]
  )

  // Success messages
  const successMessageChangePassword = `${Tr(T.ChangePasswordSuccess)}`
  useEffect(
    () =>
      isSuccessChangePassword && enqueueSuccess(successMessageChangePassword),
    [isSuccessChangePassword]
  )

  /**
   * Change the user's password.
   *
   * @param {object} formData - Password data
   */
  const handleChangePassword = async (formData) => {
    await changePassword({
      id: user.ID,
      password: formData.password,
    })
  }

  useEffect(() => {
    const subscription = watch((formData) => {
      // update user settings before submit
      const newSettings = { TEMPLATE: { ...user.TEMPLATE, ...formData } }
      changeAuthUser({ ...user, ...newSettings })

      handleSubmit(handleUpdateUser)()
    })

    return () => subscription.unsubscribe()
  }, [watch])

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit(handleUpdateUser)}
      variant="outlined"
      sx={{
        p: '1em',
        overflow: 'auto',
      }}
    >
      {!isLoading && (
        <FormProvider {...methods}>
          <FormWithSchema
            cy={'settings-ui'}
            fields={FIELDS({ views, userView, zones })}
            legend={T.ConfigurationUI}
          />
        </FormProvider>
      )}
      <Box className={classes.content}>
        {/* 
          Oneadmin and serveradmin users cannot change their passwords -> management_and_operations/users_groups_management/manage_users.html#change-credentials-for-oneadmin-or-serveradmin 
          LDAP users cannot change their passwords (the password is stored on the LDAP server)
        */}

        <ButtonToTriggerForm
          buttonProps={{
            'data-cy': `change-password-button`,
            label: T.ChangePassword,
            tooltip:
              user.ID === ONEADMIN_ID || user.ID === SERVERADMIN_ID
                ? T.ChangePasswordAdminWarning
                : user.AUTH_DRIVER === AUTH_DRIVER.LDAP
                ? T.ChangePasswordLdapWarning
                : undefined,
            tooltipLink:
              user.ID === ONEADMIN_ID || user.ID === SERVERADMIN_ID
                ? {
                    text: T.ChangePasswordAdminWarningLink,
                    link: generateDocLink(
                      version,
                      'management_and_operations/users_groups_management/manage_users.html#change-credentials-for-oneadmin-or-serveradmin'
                    ),
                  }
                : {},
            disabled:
              user.ID === ONEADMIN_ID ||
              user.ID === SERVERADMIN_ID ||
              user.AUTH_DRIVER === AUTH_DRIVER.LDAP,
          }}
          options={[
            {
              dialogProps: {
                title: T.ChangePassword,
                dataCy: 'change-password-form',
              },
              form: () => Form.Settings.ChangePasswordForm(),
              onSubmit: handleChangePassword,
            },
          ]}
        />
        <Link
          color="secondary"
          component={RouterLink}
          to={generatePath(PATH.SYSTEM.USERS.DETAIL, { id: user.ID })}
        >
          <Translate word={T.LinkOtherConfigurationsUser} values={user.ID} />
        </Link>
      </Box>
    </Paper>
  )
}

export { Settings }
