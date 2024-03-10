/* config.h.  Generated from config.h.in by configure.  */
/* config.h.in.  Generated from configure.ac by autoheader.  */

/* Whether support for the common SSH core is enabled */
#define ENABLE_COMMON_SSH /**/

/* Whether support for Ogg Vorbis is enabled */
#define ENABLE_OGG /**/

/* Whether PulseAudio support is enabled */
#define ENABLE_PULSE /**/

/* Whether agent forwarding support for SSH is enabled */
/* #undef ENABLE_SSH_AGENT */

/* Whether SSL-related support is enabled */
#define ENABLE_SSL /**/

/* Whether support for generic VNC credentials is available. */
#define ENABLE_VNC_GENERIC_CREDENTIALS /**/

/* Whether support for listen-mode VNC connections is enabled. */
#define ENABLE_VNC_LISTEN /**/

/* Whether support for VNC repeaters is enabled. */
#define ENABLE_VNC_REPEATER /**/

/* Whether support for TLS locking within VNC is enabled. */
#define ENABLE_VNC_TLS_LOCKING /**/

/* Whether WebP support is enabled */
#define ENABLE_WEBP /**/

/* Whether Windows Socket API support is enabled */
/* #undef ENABLE_WINSOCK */

/* Whether Bitmap_Free() frees the rdpBitmap and its image data */
/* #undef FREERDP_BITMAP_FREE_FREES_BITMAP */

/* Whether CLIPRDR callbacks require const for the final parameter */
#define FREERDP_CLIPRDR_CALLBACKS_REQUIRE_CONST /**/

/* Whether rdpGlyph callbacks accept INT32 integer parameters */
#define FREERDP_GLYPH_CALLBACKS_ACCEPT_INT32 /**/

/* Whether RAIL callbacks require const for the final parameter */
#define FREERDP_RAIL_CALLBACKS_REQUIRE_CONST /**/

/* Whether pVirtualChannelWriteEx() frees the wStream upon completion */
/* #undef FREERDP_SVC_CORE_FREES_WSTREAM */

/* The full path to the guacd config file */
#define GUACD_CONF_FILE "/etc/guacamole/guacd.conf"

/* Define to 1 if you have the <cairo/cairo.h> header file. */
#define HAVE_CAIRO_CAIRO_H 1

/* Whether cairo_format_stride_for_width() is defined */
#define HAVE_CAIRO_FORMAT_STRIDE_FOR_WIDTH /**/

/* Define to 1 if you have the `clock_gettime' function. */
#define HAVE_CLOCK_GETTIME 1

/* Define to 1 if you have the <dlfcn.h> header file. */
#define HAVE_DLFCN_H 1

/* Define to 1 if you have the <fcntl.h> header file. */
#define HAVE_FCNTL_H 1

/* Whether FreeRDPConvertColor() is defined */
#define HAVE_FREERDPCONVERTCOLOR /**/

/* Define to 1 if `VerifyCertificateEx' is a member of `freerdp'. */
#define HAVE_FREERDP_VERIFYCERTIFICATEEX 1

/* Define to 1 if you have the `gettimeofday' function. */
#define HAVE_GETTIMEOFDAY 1

/* Define to 1 if you have the <inttypes.h> header file. */
#define HAVE_INTTYPES_H 1

/* Whether LCCSCF_USE_SSL is defined */
/* #undef HAVE_LCCSCF_USE_SSL */

/* Whether libpthread was found */
#define HAVE_LIBPTHREAD /**/

/* Whether libuuid is available */
#define HAVE_LIBUUID /**/

/* Whether LWS_CALLBACK_CLIENT_CLOSED is defined */
/* #undef HAVE_LWS_CALLBACK_CLIENT_CLOSED */

/* Whether lws_callback_http_dummy() is defined */
/* #undef HAVE_LWS_CALLBACK_HTTP_DUMMY */

/* Whether LWS_SERVER_OPTION_DO_SSL_GLOBAL_INIT is defined */
/* #undef HAVE_LWS_SERVER_OPTION_DO_SSL_GLOBAL_INIT */

/* Define to 1 if you have the `memmove' function. */
#define HAVE_MEMMOVE 1

/* Define to 1 if you have the `memset' function. */
#define HAVE_MEMSET 1

/* Define to 1 if you have the `nanosleep' function. */
#define HAVE_NANOSLEEP 1

/* Define to 1 if you have the <ossp/uuid.h> header file. */
/* #undef HAVE_OSSP_UUID_H */

/* Define to 1 if you have the <pngstruct.h> header file. */
/* #undef HAVE_PNGSTRUCT_H */

/* Whether png_get_io_ptr() is defined */
#define HAVE_PNG_GET_IO_PTR /**/

/* Whether poll() is defined */
#define HAVE_POLL /**/

/* Define to 1 if `AllowUnanouncedOrdersFromServer' is a member of
   `rdpSettings'. */
#define HAVE_RDPSETTINGS_ALLOWUNANOUNCEDORDERSFROMSERVER 1

/* Define to 1 if `destHost' is a member of `rfbClient'. */
#define HAVE_RFBCLIENT_DESTHOST 1

/* Define to 1 if `destPort' is a member of `rfbClient'. */
#define HAVE_RFBCLIENT_DESTPORT 1

/* Define to 1 if `GetCredential' is a member of `rfbClient'. */
#define HAVE_RFBCLIENT_GETCREDENTIAL 1

/* Define to 1 if `LockWriteToTLS' is a member of `rfbClient'. */
#define HAVE_RFBCLIENT_LOCKWRITETOTLS 1

/* Define to 1 if `UnlockWriteToTLS' is a member of `rfbClient'. */
#define HAVE_RFBCLIENT_UNLOCKWRITETOTLS 1

/* Define to 1 if you have the `select' function. */
#define HAVE_SELECT 1

/* Define to 1 if you have the <stdint.h> header file. */
#define HAVE_STDINT_H 1

/* Define to 1 if you have the <stdio.h> header file. */
#define HAVE_STDIO_H 1

/* Define to 1 if you have the <stdlib.h> header file. */
#define HAVE_STDLIB_H 1

/* Define to 1 if you have the `strdup' function. */
#define HAVE_STRDUP 1

/* Define to 1 if you have the <strings.h> header file. */
#define HAVE_STRINGS_H 1

/* Define to 1 if you have the <string.h> header file. */
#define HAVE_STRING_H 1

/* Whether strlcat() is defined */
/* #undef HAVE_STRLCAT */

/* Whether strlcpy() is defined */
/* #undef HAVE_STRLCPY */

/* Whether strnstr() is defined */
/* #undef HAVE_STRNSTR */

/* Define to 1 if you have the <syslog.h> header file. */
#define HAVE_SYSLOG_H 1

/* Define to 1 if you have the <sys/socket.h> header file. */
#define HAVE_SYS_SOCKET_H 1

/* Define to 1 if you have the <sys/stat.h> header file. */
#define HAVE_SYS_STAT_H 1

/* Define to 1 if you have the <sys/time.h> header file. */
#define HAVE_SYS_TIME_H 1

/* Define to 1 if you have the <sys/types.h> header file. */
#define HAVE_SYS_TYPES_H 1

/* Define to 1 if you have the <time.h> header file. */
#define HAVE_TIME_H 1

/* Define to 1 if you have the <unistd.h> header file. */
#define HAVE_UNISTD_H 1

/* Whether libssh2 was built against libgcrypt */
/* #undef LIBSSH2_USES_GCRYPT */

/* Define to the sub-directory where libtool stores uninstalled libraries. */
#define LT_OBJDIR ".libs/"

/* Whether OpenSSL requires explicit threading callbacks for threadsafety */
/* #undef OPENSSL_REQUIRES_THREADING_CALLBACKS */

/* Name of package */
#define PACKAGE "guacamole-server"

/* Define to the address where bug reports for this package should be sent. */
#define PACKAGE_BUGREPORT ""

/* Define to the full name of this package. */
#define PACKAGE_NAME "guacamole-server"

/* Define to the full name and version of this package. */
#define PACKAGE_STRING "guacamole-server 1.5.4"

/* Define to the one symbol short name of this package. */
#define PACKAGE_TARNAME "guacamole-server"

/* Define to the home page for this package. */
#define PACKAGE_URL ""

/* Define to the version of this package. */
#define PACKAGE_VERSION "1.5.4"

/* Define to 1 if all of the C90 standard headers exist (not just the ones
   required in a freestanding environment). This macro is provided for
   backward compatibility; new code need not use it. */
#define STDC_HEADERS 1

/* Version number of package */
#define VERSION "1.5.4"

/* Uses X/Open and POSIX APIs */
#define _XOPEN_SOURCE 700

/* Uses BSD-specific APIs (if available) */
#define __BSD_VISIBLE 1

/* Define to `unsigned int' if <sys/types.h> does not define. */
/* #undef size_t */

/* Define to `int' if <sys/types.h> does not define. */
/* #undef ssize_t */
