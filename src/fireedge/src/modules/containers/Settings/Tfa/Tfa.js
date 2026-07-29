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
import { Translate, useTranslation } from '@ProvidersModule'
import { Button, SubmitButton } from '@ComponentsV2Module'
import { AUTH_APPS, STYLE_BUTTONS, T } from '@ConstantsModule'
import {
  TfaAPI,
  UserAPI,
  useAuth,
  useAuthApi,
  useGeneralApi,
} from '@FeaturesModule'
import { css } from '@emotion/css'
import { FIELDS } from '@modules/containers/Settings/Tfa/schema'
import { useSettingWrapper } from '@modules/containers/Settings/Wrapper'
import {
  Box,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  useTheme,
} from '@mui/material'
import { Cancel, Trash } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Fragment, ReactElement, useCallback, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'

const styles = ({
  borderRadius,
  borderWidth,
  palette,
  spacing,
  typography,
}) => ({
  buttonPlace: css({
    width: '100%',
    textAlign: 'center',
  }),
  buttonAction: css({
    width: '100%',
    marginTop: spacing(1),
  }),
  rowContent: css({
    flexGrow: 1,
  }),
  qr: css({
    width: '100%',
    height: 'auto',
  }),
  qrContainer: css({
    border: `${borderWidth.sm}px solid ${palette.border.primary}`,
    color: palette.text.body,
    backgroundColor: palette.surface.primary,
    padding: spacing(1),
    borderRadius: '12px',
    marginBottom: spacing(1),
  }),
  bold: css({
    fontWeight: typography.fontWeightBold,
  }),
  enabled: css({
    border: `${borderWidth.sm}px solid ${palette.border.primary}`,
    color: palette.text.body,
    backgroundColor: palette.surface.primary,
    marginTop: spacing(2),
    borderRadius: '12px',
  }),
  verificationCodeForm: css({
    paddingRight: spacing(1),

    '& > fieldset': {
      margin: 0,

      '& .MuiTextField-root': {
        margin: 0,
      },
    },
  }),
})

const Qr = ({
  cancelFn = () => undefined,
  refreshUserData = () => undefined,
}) => {
  const { translate } = useTranslation()
  const { data = '', isSuccess } = TfaAPI.useGetQrQuery()
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])
  const { enqueueError, enqueueSuccess } = useGeneralApi()
  const [enableTfa] = TfaAPI.useEnableTfaMutation()

  const { handleSubmit, ...methods } = useForm({
    reValidateMode: 'onChange',
  })

  const handleEnableTfa = useCallback(
    async ({ TOKEN: token }) => {
      try {
        await enableTfa({ token }).unwrap()
        await refreshUserData()
        cancelFn()
        enqueueSuccess(T.SetupTFASuccesful)
      } catch (error) {
        enqueueError(T.SetupTFAError)
      }
    },
    [data, enableTfa]
  )

  return (
    <div className={classes.qrContainer}>
      <Grid container role="row">
        <Grid item className={classes.rowContent}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              {data && isSuccess && (
                <img
                  className={classes.qr}
                  src={data}
                  alt={translate(T.ScanThisQr)}
                  data-cy="qrTfa"
                />
              )}
            </Grid>
            <Grid item xs={6} className={classes.verificationCodeForm}>
              <FormProvider {...methods}>
                <FormWithSchema cy={'2fa-ui'} fields={FIELDS} />
              </FormProvider>
              <Box className={classes.buttonAction}>
                <SubmitButton
                  onClick={handleSubmit(handleEnableTfa)}
                  type={STYLE_BUTTONS.TYPE.PRIMARY}
                  data-cy="addTfa"
                  label={T.Add}
                />
              </Box>
            </Grid>
          </Grid>
        </Grid>
        <Grid item>
          <SubmitButton
            iconOnly={<Cancel />}
            onClick={cancelFn}
            aria-label="delete"
            type={STYLE_BUTTONS.TYPE.PRIMARY}
          />
        </Grid>
        <Grid item xs={12}>
          <List>
            <ListItemText>
              <Translate word={T.GetAuthenticatorApp} />
              {AUTH_APPS.map(({ text, url }) => (
                <Fragment key={text}>
                  <Link href={url} color="info.main" className={classes.bold}>
                    {text}
                  </Link>{' '}
                </Fragment>
              ))}
            </ListItemText>
            <ListItemText>
              <Translate word={T.ScanThisQr} />
            </ListItemText>
            <ListItemText>
              <Translate word={T.EnterVerificationCode} />
            </ListItemText>
          </List>
        </Grid>
      </Grid>
    </div>
  )
}
Qr.propTypes = {
  cancelFn: PropTypes.func,
  refreshUserData: PropTypes.func,
}

/**
 * Section to change user configuration about UI.
 *
 * @returns {ReactElement} Settings configuration UI
 */
const Tfa = () => {
  const { Legend, InternalWrapper } = useSettingWrapper()
  const { enqueueError, enqueueSuccess } = useGeneralApi()
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])
  const [displayQr, setDisplayQr] = useState(false)
  const {
    user,
    settings: { FIREEDGE: fireedge = {}, SUNSTONE: sunstone = {} } = {},
  } = useAuth()
  const { ID } = user
  const [removeTfa] = TfaAPI.useRemoveTfaMutation()
  const [get, { data: lazyUserData }] = UserAPI.useLazyGetUserQuery()
  const { changeAuthUser } = useAuthApi()

  const refreshUserData = useCallback(async () => {
    const newUserData = await get({ id: ID, __: uuidv4() })
    if (newUserData?.data) {
      changeAuthUser({
        ...user,
        TEMPLATE: newUserData.data?.TEMPLATE,
      })
    }
  }, [get, lazyUserData])

  const handleRemoveTfa = useCallback(async () => {
    try {
      await removeTfa().unwrap()
      await refreshUserData()
      setDisplayQr(false)
      enqueueSuccess(T.SetupTFASuccesfulDeleted)
    } catch {
      enqueueError(T.SetupTFASuccesfulDeletedError)
    }
  }, [removeTfa, fireedge])

  return (
    <Box component="form">
      <Legend title={T.TwoFactorAuthentication} />
      <InternalWrapper>
        {displayQr && (
          <Qr
            cancelFn={() => setDisplayQr(false)}
            refreshUserData={refreshUserData}
          />
        )}
        {(sunstone?.TWO_FACTOR_AUTH_SECRET ||
          fireedge?.TWO_FACTOR_AUTH_SECRET) && (
          <List className={classes.enabled}>
            {sunstone?.TWO_FACTOR_AUTH_SECRET && (
              <ListItem
                secondaryAction={
                  <Button
                    iconOnly={<Trash />}
                    type={STYLE_BUTTONS.TYPE.PRIMARY}
                    onClick={handleRemoveTfa}
                    data-cy="removeTfa"
                  />
                }
              >
                <Translate word={T.AuthenticatorAppSunstone} />
              </ListItem>
            )}
            {fireedge?.TWO_FACTOR_AUTH_SECRET && (
              <ListItem
                secondaryAction={
                  <Button
                    iconOnly={<Trash />}
                    type={STYLE_BUTTONS.TYPE.PRIMARY}
                    onClick={handleRemoveTfa}
                    data-cy="removeTfa"
                  />
                }
              >
                <Translate word={T.AuthenticatorApp} />
              </ListItem>
            )}
          </List>
        )}
        {!displayQr && !fireedge?.TWO_FACTOR_AUTH_SECRET && (
          <Box className={classes.buttonPlace}>
            <SubmitButton
              onClick={() => setDisplayQr(true)}
              type={STYLE_BUTTONS.TYPE.PRIMARY}
              data-cy="addTfa"
              label={T.RegisterAuthenticationApp}
            />
          </Box>
        )}
      </InternalWrapper>
    </Box>
  )
}

export default Tfa
