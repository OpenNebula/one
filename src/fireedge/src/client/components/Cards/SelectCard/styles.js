import { makeStyles } from '@material-ui/core'

export default makeStyles(theme => ({
  root: {
    height: '100%',
    '& $actionArea, & $mediaActionArea, & $media': {
      transition: theme.transitions.create(
        ['filter', 'background-color'],
        { duration: '0.2s' }
      )
    }
  },
  selected: {
    color: theme.palette.secondary.contrastText,
    backgroundColor: theme.palette.secondary.main,
    '& .badge': {
      color: theme.palette.secondary.main,
      backgroundColor: theme.palette.secondary.contrastText
    },
    '& $subheader': { color: 'inherit' }
  },
  actionArea: {
    height: '100%',
    minHeight: ({ minHeight = 140 }) => minHeight,
    '& $media': { filter: 'contrast(0) brightness(2)' }
  },
  mediaActionArea: {
    display: 'flex',
    height: ({ mediaHeight = 140 }) => mediaHeight,
    '& $media': { filter: 'contrast(0) brightness(2)' },
    '&:hover': {
      backgroundColor: theme.palette.primary.contrastText,
      '& $media': { filter: 'none' }
    }
  },
  media: {},
  headerRoot: { alignItems: 'end' },
  headerContent: { overflow: 'auto' },
  headerAvatar: {
    display: 'flex',
    color: theme.palette.primary.contrastText
  },
  header: {
    color: theme.palette.primary.contrastText
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
