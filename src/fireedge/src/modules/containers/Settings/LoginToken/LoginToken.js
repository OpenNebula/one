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
import { SubmitButton, FormWithSchema, Tr, Translate } from '@ComponentsModule'
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { css } from '@emotion/css'
import {
  GroupAPI,
  useAuth,
  useAuthApi,
  useGeneralApi,
  UserAPI,
  useViews,
} from '@FeaturesModule'
import { useClipboard } from '@HooksModule'
import { timeToString } from '@ModelsModule'
import { FIELDS, SCHEMA } from '@modules/containers/Settings/LoginToken/schema'
import { useSettingWrapper } from '@modules/containers/Settings/Wrapper'
import { Box, Grid, Typography, useTheme } from '@mui/material'
import { Cancel, Check as CopiedIcon, Copy as CopyIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, useCallback, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'

const styles = ({ typography, palette }) => ({
  buttonPlace: css({
    textAlign: 'center',
  }),
  buttonAction: css({
    width: '100%',
    marginBottom: typography.pxToRem(8),
  }),
  token: css({
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  }),
  message: css({
    margin: `${typography.pxToRem(32)} 0 0`,
  }),
  tokenContainer: css({
    border: `1px solid ${palette.grey[300]}`,
    padding: typography.pxToRem(8),
    borderRadius: typography.pxToRem(8),
    marginBottom: typography.pxToRem(8),
  }),
})

const Row = ({ data = {}, groups = [], edit = () => undefined } = {}) => {
  const { copy, isCopied } = useClipboard()
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])
  const { TOKEN = '', EXPIRATION_TIME = 0, EGID = '' } = data
  const groupToken =
    groups.find((group) => group?.ID === EGID)?.NAME || Tr(T.None)

  const handleCopy = useCallback(
    (evt) => {
      !isCopied && copy(TOKEN)
      evt.stopPropagation()
    },
    [copy, TOKEN, isCopied]
  )

  return (
    <>
      {TOKEN && EXPIRATION_TIME && EGID && (
        <Grid container role="row" className={classes.tokenContainer}>
          <Grid item sx={{ flexGrow: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" gutterBottom sx={{ m: '1rem' }}>
                  <b>{`${Tr(T.ValidUntil)}: `}</b>
                  {timeToString(EXPIRATION_TIME)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" gutterBottom sx={{ m: '1rem' }}>
                  <b>{`${Tr(T.Group)}: `}</b>
                  {groupToken}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography
                  variant="body2"
                  gutterBottom
                  sx={{ m: '1rem' }}
                  className={classes.token}
                >
                  <b>{`${Tr(T.Token)}: `}</b>
                  {TOKEN}
                </Typography>
              </Grid>
            </Grid>
          </Grid>
          <Grid item>
            <SubmitButton
              icon={isCopied ? <CopiedIcon /> : <CopyIcon className="icon" />}
              onClick={handleCopy}
              aria-label="toggle password visibility"
            />
            <SubmitButton
              icon={<Cancel />}
              onClick={() => edit(TOKEN)}
              aria-label="delete"
            />
          </Grid>
        </Grid>
      )}
    </>
  )
}

Row.propTypes = {
  data: PropTypes.shape({
    TOKEN: PropTypes.string,
    EXPIRATION_TIME: PropTypes.string,
    EGID: PropTypes.string,
  }),
  groups: PropTypes.arrayOf(PropTypes.object),
  edit: PropTypes.func,
}

Row.displayName = 'LoginTokenRow'

/**
 * Section to change user configuration about UI.
 *
 * @returns {ReactElement} Settings configuration UI
 */
const LoginToken = () => {
  const { Legend, InternalWrapper } = useSettingWrapper()
  const { user } = useAuth()
  const { LOGIN_TOKEN = [], ID, NAME } = user
  const { data: groups = [], isLoading } = GroupAPI.useGetGroupsQuery()
  const [get, { data: lazyUserData }] = UserAPI.useLazyGetUserQuery()
  const { changeAuthUser } = useAuthApi()

  const userGroups = groups.filter((group) => {
    const arrayUsers = Array.isArray(group?.USERS?.ID)
      ? group?.USERS?.ID
      : [group?.USERS?.ID]

    return arrayUsers.includes(ID)
  })

  const arrayLoginToken = Array.isArray(LOGIN_TOKEN)
    ? LOGIN_TOKEN
    : [LOGIN_TOKEN]

  const { enqueueError } = useGeneralApi()
  const [updateUser] = UserAPI.useUpdateUserMutation()
  const [addLoginToken] = UserAPI.useLoginUserMutation()
  const { views, view: userView } = useViews()
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])

  const { handleSubmit, ...methods } = useForm({
    reValidateMode: 'onChange',
    defaultValues: useMemo(
      () =>
        SCHEMA({ views, userView }).cast(
          {},
          {
            stripUnknown: true,
          }
        ),
      [LOGIN_TOKEN]
    ),
  })

  const handleDeleteLoginToken = useCallback(
    async (token) => {
      try {
        const newToken = await addLoginToken({ user: NAME, expire: 0, token })
        if (newToken?.data) {
          const newUserData = await get({ id: ID, __: uuidv4() })
          if (newUserData?.data) {
            changeAuthUser({
              ...user,
              LOGIN_TOKEN: newUserData.data?.LOGIN_TOKEN,
            })
          }
        }
      } catch {
        enqueueError(T.SomethingWrong)
      }
    },
    [updateUser, user, lazyUserData]
  )

  const handleCreateLoginToken = useCallback(
    async ({ EXPIRE: expire, EGID: gid } = {}) => {
      try {
        const newToken = await addLoginToken({ user: NAME, expire, gid })
        if (newToken?.data) {
          const newUserData = await get({ id: ID, __: uuidv4() })
          if (newUserData?.data) {
            changeAuthUser({
              ...user,
              LOGIN_TOKEN: newUserData.data?.LOGIN_TOKEN,
            })
          }
        }
      } catch {
        enqueueError(T.SomethingWrong)
      }
    },
    [addLoginToken, user, lazyUserData]
  )

  return (
    <Box>
      <Legend title={T.LoginToken} />
      <InternalWrapper>
        {!isLoading && (
          <>
            {arrayLoginToken.length > 0 && (
              <div>
                <div>
                  {arrayLoginToken.map((itemLoginToken, i) => (
                    <Row
                      data={itemLoginToken}
                      key={i}
                      groups={groups}
                      edit={handleDeleteLoginToken}
                    />
                  ))}
                </div>
              </div>
            )}
            <Box
              component="form"
              onSubmit={handleSubmit(handleCreateLoginToken)}
            >
              <FormProvider {...methods}>
                <FormWithSchema
                  cy={'logintoken-ui'}
                  fields={FIELDS(userGroups)}
                />
              </FormProvider>
              <Box className={classes.buttonPlace}>
                <SubmitButton
                  onClick={handleSubmit(handleCreateLoginToken)}
                  importance={STYLE_BUTTONS.IMPORTANCE.MAIN}
                  size={STYLE_BUTTONS.SIZE.MEDIUM}
                  type={STYLE_BUTTONS.TYPE.FILLED}
                  data-cy="addLoginToken"
                  label={T.GetNewToken}
                />
              </Box>
            </Box>
          </>
        )}
        <Typography
          variant="body2"
          gutterBottom
          sx={{ m: '1rem' }}
          className={classes.message}
        >
          <Translate word={T.MessageLoginToken} />
        </Typography>
      </InternalWrapper>
    </Box>
  )
}

export default LoginToken
