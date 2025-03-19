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

import {
  EnhancedTableStyles,
  FormWithSchema,
  Tr,
  Translate,
  TranslateProvider,
} from '@ComponentsModule'
import { AUTH_APPS, T } from '@ConstantsModule'
import {
  TfaAPI,
  UserAPI,
  useAuth,
  useAuthApi,
  useGeneralApi,
} from '@FeaturesModule'
import { css } from '@emotion/css'
import { FIELDS } from '@modules/containers/Settings/Tfa/schema'
import {
  Button,
  Grid,
  Link,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
  useTheme,
} from '@mui/material'
import { Cancel, Trash } from 'iconoir-react'
import PropTypes from 'prop-types'
import { Fragment, ReactElement, useCallback, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'

const useStyles = () => ({
  buttonSubmit: css({
    width: '100%',
    marginTop: '1rem',
  }),
  buttonClose: css({
    width: '100%',
    marginBottom: '.5rem',
  }),
  buttonAction: css({
    width: '100%',
    marginTop: '.5rem',
  }),
  qr: css({
    width: '100%',
    height: 'auto',
  }),
  bold: css({
    fontWeight: 'bold',
  }),
  enabled: css({
    border: '1px solid rgba(255, 255, 255, 0.12)',
    marginTop: '1rem',
    borderRadius: '.5rem',
  }),
  verificationCodeForm: css({
    paddingRight: '.5rem',

    '& > fieldset': {
      margin: '0px',

      '& .MuiTextField-root': {
        margin: '0px',
      },
    },
  }),
})

const Qr = ({
  cancelFn = () => undefined,
  refreshUserData = () => undefined,
}) => {
  const { data = '', isSuccess } = TfaAPI.useGetQrQuery()
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
  const classesTable = useMemo(() => EnhancedTableStyles(theme), [theme])
  const { enqueueError } = useGeneralApi()
  const [enableTfa] = TfaAPI.useEnableTfaMutation()

  const { handleSubmit, ...methods } = useForm({
    reValidateMode: 'onChange',
  })

  const handleEnableTfa = useCallback(
    async ({ TOKEN: token }) => {
      try {
        await enableTfa({ token })
        await refreshUserData()
        cancelFn()
      } catch {
        enqueueError(T.SomethingWrong)
      }
    },
    [data, enableTfa]
  )

  return (
    <TranslateProvider>
      <div className={classesTable.rootWithoutHeight}>
        <div className={classesTable.bodyWithoutGap}>
          <Grid container role="row">
            <Grid item xs={10}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  {data && isSuccess && (
                    <img
                      className={classes.qr}
                      src={data}
                      alt={Tr(T.ScanThisQr)}
                      data-cy="qrTfa"
                    />
                  )}
                </Grid>
                <Grid item xs={6} className={classes.verificationCodeForm}>
                  <FormProvider {...methods}>
                    <FormWithSchema cy={'2fa-ui'} fields={FIELDS} />
                  </FormProvider>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleSubmit(handleEnableTfa)}
                    className={classes.buttonAction}
                    data-cy="addTfa"
                  >
                    <Translate word={T.Add} />
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={2}>
              <Button
                variant="contained"
                size="small"
                onClick={cancelFn}
                className={classes.buttonClose}
              >
                <Cancel className="icon" />
              </Button>
            </Grid>
            <Grid item xs={12}>
              <List>
                <ListItemText>
                  <Translate word={T.GetAuthenticatorApp} />
                  {AUTH_APPS.map(({ text, url }) => (
                    <Fragment key={text}>
                      <Link
                        href={url}
                        color="info.main"
                        className={classes.bold}
                      >
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
      </div>
    </TranslateProvider>
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
  const { enqueueError } = useGeneralApi()
  const theme = useTheme()
  const classes = useMemo(() => useStyles(theme), [theme])
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
      await removeTfa()
      await refreshUserData()
      setDisplayQr(false)
    } catch {
      enqueueError(T.SomethingWrong)
    }
  }, [removeTfa, fireedge])

  return (
    <Paper component="form" variant="outlined" sx={{ p: '1em' }}>
      <Typography variant="underline">
        <Translate word={T.TwoFactorAuthentication} />
      </Typography>
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
                  variant="contained"
                  size="small"
                  onClick={handleRemoveTfa}
                  data-cy="removeTfa"
                >
                  <Trash className="icon" />
                </Button>
              }
            >
              <Translate word={T.AuthenticatorAppSunstone} />
            </ListItem>
          )}
          {fireedge?.TWO_FACTOR_AUTH_SECRET && (
            <ListItem
              secondaryAction={
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleRemoveTfa}
                  data-cy="removeTfa"
                >
                  <Trash className="icon" />
                </Button>
              }
            >
              <Translate word={T.AuthenticatorApp} />
            </ListItem>
          )}
        </List>
      )}
      {!displayQr && !fireedge?.TWO_FACTOR_AUTH_SECRET && (
        <Button
          variant="contained"
          size="small"
          onClick={() => setDisplayQr(true)}
          className={classes.buttonSubmit}
          data-cy="addTfa"
        >
          <Translate word={T.RegisterAuthenticationApp} />
        </Button>
      )}
    </Paper>
  )
}

export default Tfa
