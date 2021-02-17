import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  root: ({ isSelected, disableFilterImage }) => ({
    height: '100%',
    transition: theme.transitions.create(
      ['background-color', 'box-shadow'], { duration: '0.2s' }
    ),
    '&:hover': {
      boxShadow: theme.shadows['5']
    },
    ...(isSelected && {
      color: theme.palette.secondary.contrastText,
      backgroundColor: theme.palette.secondary.main,
      '& .badge': {
        color: theme.palette.secondary.main,
        backgroundColor: theme.palette.secondary.contrastText
      },
      '& $subheader': { color: 'inherit' }
    })
  }),
  actionArea: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    minHeight: ({ minHeight = 140 }) => minHeight,
    '&:disabled': {
      filter: 'brightness(0.5)'
    }
  },
  mediaActionArea: {
    display: 'flex',
    height: ({ mediaHeight = 140 }) => mediaHeight,
    '&:hover': {
      backgroundColor: theme.palette.secondary.contrastText,
      '& $media': { filter: 'none' }
    }
  },
  media: {
    '& img': {
      width: '100%',
      objectFit: 'cover',
      maxHeight: ({ mediaHeight = 140 }) => mediaHeight
    },
    flexGrow: 1,
    transition: theme.transitions.create('filter', { duration: '0.2s' }),
    filter: ({ isSelected, disableFilterImage }) => {
      return disableFilterImage
        ? 'none'
        : (theme.palette.type === 'dark' || isSelected)
          ? 'contrast(0) brightness(2)'
          : 'contrast(0) brightness(0.8)'
    }
  },
  headerRoot: {
    alignItems: 'end',
    alignSelf: 'stretch'
  },
  headerContent: { overflow: 'auto' },
  headerAvatar: {
    display: 'flex',
    color: ({ isSelected }) => isSelected
      ? theme.palette.secondary.contrastText
      : theme.palette.text.primary
  },
  subheader: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'initial',
    display: '-webkit-box',
    lineClamp: 2,
    boxOrient: 'vertical'
  }
}))
