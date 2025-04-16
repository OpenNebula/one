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
import { STYLE_BUTTONS, T } from '@ConstantsModule'
import { css } from '@emotion/css'
import { useAuth, useGeneralApi, UserAPI } from '@FeaturesModule'
import { jsonToXml } from '@ModelsModule'
import SubmitButton from '@modules/components/FormControl/SubmitButton'
import { Translate } from '@modules/components/HOC'
import { Avatar, Box, Typography, useTheme } from '@mui/material'
import { Edit as EditIcon } from 'iconoir-react'
import { ReactElement, useCallback, useMemo } from 'react'

const styles = ({ palette, typography }) => ({
  root: css({
    textAlign: 'center',
    padding: `${typography.pxToRem(32)} 0 ${typography.pxToRem(16)}`,
  }),
  imagePlace: css({
    width: typography.pxToRem(96),
    height: typography.pxToRem(96),
    position: 'relative',
    display: 'inline-block',
  }),
  image: css({
    width: typography.pxToRem(96),
    height: typography.pxToRem(96),
    border: `${typography.pxToRem(2)} solid ${palette.info.dark}`,
  }),
  uploadIcon: css({
    position: 'absolute',
    bottom: '0px',
    right: '0px',
    backgroundColor: palette.secondary.contrastText,
    border: `${typography.pxToRem(2)} solid ${palette.info.dark}`,
    borderRadius: '50%',
    '& > button, & > button:hover, & > button:active': {
      color: `${palette.info.dark} !important`,
    },
  }),
  userName: css({
    textAlign: 'center',
    padding: `0 ${typography.pxToRem(32)} ${typography.pxToRem(16)}`,
    '& > *': {
      color: palette.info.main,
      display: 'inline',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
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

  return (
    <>
      <Box className={classes.root}>
        <Box className={classes.imagePlace}>
          <Avatar
            src={user?.TEMPLATE?.FIREEDGE?.IMAGE_PROFILE}
            className={classes.image}
          />
          <Box className={classes.uploadIcon}>
            <SubmitButton
              icon={<EditIcon />}
              importance={STYLE_BUTTONS.IMPORTANCE.SECONDARY}
              size={STYLE_BUTTONS.SIZE.MEDIUM}
              type={STYLE_BUTTONS.TYPE.OUTLINED}
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
      <Typography variant="h6" zIndex={2} noWrap className={classes.userName}>
        <Translate word={T.Greetings} />
        <div> {`${user?.NAME || ''}!`} </div>
      </Typography>
    </>
  )
}

export default ProfileImage
