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
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { SubmitButton } from '@ComponentsV2Module'
import { css } from '@emotion/css'
import { useAuth, useGeneralApi, UserAPI } from '@FeaturesModule'
import { jsonToXml } from '@UtilsModule'
import { Translate } from '@ProvidersModule'

import { Avatar, Box, Tooltip, Typography, useTheme } from '@mui/material'
import { Edit as EditIcon } from 'iconoir-react'
import { ReactElement, useCallback, useMemo } from 'react'

const styles = ({ palette, borderWidth, borderRadius, scale, typography }) => ({
  root: css({
    paddingBottom: scale[400],
    display: 'flex',
    flexDirection: 'column',
    gap: scale[400],
    borderBottom: `${borderWidth.sm}px solid ${palette.border.primary}`,
  }),
  imagePlace: css({
    width: scale[1100],
    height: scale[1100],
    position: 'relative',
    display: 'inline-block',

    '&:hover .upload-icon': {
      visibility: 'initial',
      transform: 'translate(25%, 25%)',
    },
  }),
  image: css({
    width: scale[1100],
    height: scale[1100],
    borderRadius: borderRadius.lg,
  }),
  uploadIcon: css({
    position: 'absolute',
    bottom: 0,
    right: 0,
    visibility: 'hidden',
    transition: 'transform 0.3s ease',
    transform: 'translate(25%, 50%)',

    '&:hover .upload-icon': {
      visibility: 'initial',
      transform: 'translate(25%, 25%)',
    },
  }),
  userName: css({
    textAlign: 'left',
    fontSize: typography.h6.fontSize,
    fontWeight: typography.fontWeightBold,
    paddingRight: scale[600],
    color: palette.text.headings,
    marginTop: scale[150],

    '& div': {
      display: 'inline',
    },
  }),
})

/**
 * Profile Image Component.
 *
 * @returns {ReactElement} ProfileImage component
 */
const ProfileImage = () => {
  const theme = useTheme()
  const classes = useMemo(() => styles(theme), [theme])
  const { user } = useAuth()
  const [updateUser] = UserAPI.useUpdateUserMutation()
  const { enqueueError } = useGeneralApi()

  const handleImageChange = useCallback(
    (event) => {
      const file = event.target.files[0]
      if (!file) return

      if (file.size > 2 * 1024 ** 2) {
        enqueueError(T.LimitProfileImage)

        return
      }

      const reader = new FileReader()
      reader.onloadend = async () => {
        const userData = {
          ...(user?.TEMPLATE?.FIREEDGE || {}),
          IMAGE_PROFILE: reader.result,
        }

        const template = jsonToXml({ FIREEDGE: userData })
        await updateUser({ id: user.ID, template, replace: 1 })
        event.target.value = null
      }
      reader.readAsDataURL(file)
    },
    [updateUser, user]
  )

  const userName = `${user?.NAME || ''}!`

  return (
    <Box className={classes.root}>
      <Box>
        <Box className={classes.imagePlace}>
          <Avatar
            src={user?.TEMPLATE?.FIREEDGE?.IMAGE_PROFILE}
            className={classes.image}
          />
          <Box className={`upload-icon ${classes.uploadIcon}`}>
            <SubmitButton
              iconOnly={<EditIcon />}
              type={STYLE_BUTTONS.TYPE.PRIMARY}
              onClick={() =>
                document.getElementById('file-upload-input').click()
              }
            />
            <input
              id="file-upload-input"
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />
          </Box>
        </Box>
      </Box>
      <Tooltip arrow placement="top" title={userName}>
        <Typography variant="h6" zIndex={2} noWrap className={classes.userName}>
          <Translate word={T.Greetings} />
          <div> {userName} </div>
        </Typography>
      </Tooltip>
    </Box>
  )
}

export default ProfileImage
