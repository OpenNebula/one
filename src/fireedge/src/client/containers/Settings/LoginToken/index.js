/* ------------------------------------------------------------------------- *
 * Copyright 2002-2024, OpenNebula Project, OpenNebula Systems               *
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
import { Button, Grid, Paper, Typography } from '@mui/material'
import makeStyles from '@mui/styles/makeStyles'
import { FormWithSchema } from 'client/components/Forms'
import { Tr, Translate } from 'client/components/HOC'
import EnhancedTableStyles from 'client/components/Tables/Enhanced/styles'
import { T } from 'client/constants'
import { FIELDS, SCHEMA } from 'client/containers/Settings/LoginToken/schema'
import { useAuth, useAuthApi, useViews } from 'client/features/Auth'
import { useGeneralApi } from 'client/features/General'
import { useGetGroupsQuery } from 'client/features/OneApi/group'
import {
  useLazyGetUserQuery,
  useLoginUserMutation,
  useUpdateUserMutation,
} from 'client/features/OneApi/user'
import { useClipboard } from 'client/hooks'
import { timeToString } from 'client/models/Helper'
import { Cancel, Check as CopiedIcon, Copy as CopyIcon } from 'iconoir-react'
import PropTypes from 'prop-types'
import { ReactElement, useCallback, useMemo } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { v4 as uuidv4 } from 'uuid'

const useStyles = makeStyles(() => ({
  buttonSubmit: {
    width: '100%',
  },
  buttonAction: {
    width: '100%',
    marginBottom: '.5rem',
  },
  token: {
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },
  message: {
    margin: '2rem 0 0',
  },
}))

const Row = ({ data = {}, groups = [], edit = () => undefined } = {}) => {
  const { copy, isCopied } = useClipboard()
  const classes = useStyles()
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
        <Grid container role="row">
          <Grid item xs={10}>
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
          <Grid item xs={2}>
            <Button
              variant="contained"
              size="small"
              onClick={handleCopy}
              className={classes.buttonAction}
            >
              {isCopied ? <CopiedIcon /> : <CopyIcon className="icon" />}
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => edit(TOKEN)}
              className={classes.buttonAction}
            >
              <Cancel className="icon" />
            </Button>
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
  const { user } = useAuth()
  const { LOGIN_TOKEN = [], ID, NAME } = user
  const { data: groups = [], isLoading } = useGetGroupsQuery()
  const [get, { data: lazyUserData }] = useLazyGetUserQuery()
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
  const [updateUser] = useUpdateUserMutation()
  const [addLoginToken] = useLoginUserMutation()
  const { views, view: userView } = useViews()
  const classes = useStyles()
  const classesTable = EnhancedTableStyles()

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
    <Paper
      component="form"
      onSubmit={handleSubmit(handleCreateLoginToken)}
      variant="outlined"
      sx={{ p: '1em' }}
    >
      <Typography variant="underline">
        <Translate word={T.LoginToken} />
      </Typography>
      {!isLoading && (
        <>
          {arrayLoginToken.length > 0 && (
            <div className={classesTable.rootWithoutHeight}>
              <div className={classesTable.bodyWithoutGap}>
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
          <FormProvider {...methods}>
            <FormWithSchema cy={'logintoken-ui'} fields={FIELDS(userGroups)} />
          </FormProvider>
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmit(handleCreateLoginToken)}
            className={classes.buttonSubmit}
            data-cy="addLoginToken"
          >
            {Tr(T.GetNewToken)}
          </Button>
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
    </Paper>
  )
}

export default LoginToken
