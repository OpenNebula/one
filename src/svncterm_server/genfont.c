/*

     Copyright (C) 2007 Proxmox Server Solutions GmbH

     Copyright: vzdump is under GNU GPL, the GNU General Public License.

     This program is free software; you can redistribute it and/or modify
     it under the terms of the GNU General Public License as published by
     the Free Software Foundation; version 2 dated June, 1991.

     This program is distributed in the hope that it will be useful,
     but WITHOUT ANY WARRANTY; without even the implied warranty of
     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     GNU General Public License for more details.

     You should have received a copy of the GNU General Public License
     along with this program; if not, write to the Free Software
     Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA
     02111-1307, USA.

     Author: Dietmar Maurer <dietmar@proxmox.com>

     Copyright 2002-2024, OpenNebula Project, OpenNebula Systems

     - Update psf loader to PSFv2
     - Added command line options & usage
     - Other minor code changes

     contact@opennebula.io
*/

#include <stdio.h>
#include <stdlib.h>
#include <zlib.h>
#include <string.h>
#include <linux/limits.h>
#include <getopt.h>
#include <stdint.h>

/* -------------------------------------------------------------------------- */
/* Font glyph storage array and map pointer                                   */
/* -------------------------------------------------------------------------- */
/* map unicode to font */
static unsigned short vt_fontmap[65536];

/* font glyph storage */
static unsigned char * vt_font_data = NULL;

static int vt_font_size    = 0; //Index to current glyph
static int vt_font_maxsize = 0; //Max size of fontmap

/* -------------------------------------------------------------------------- */
/* PC Screen Font v2 data (PSFv2) Header & Constants                          */
/* -------------------------------------------------------------------------- */
#define PSF2_MAGIC0     0x72
#define PSF2_MAGIC1     0xb5
#define PSF2_MAGIC2     0x4a
#define PSF2_MAGIC3     0x86

/* bits used in flags */
#define PSF2_HAS_UNICODE_TABLE 0x01

/* max version recognized so far */
#define PSF2_MAXVERSION 0

/* UTF8 separators */
#define PSF2_SEPARATOR  0xFF
#define PSF2_STARTSEQ   0xFE

struct psf2_header
{
    unsigned char magic[4];
    unsigned int version;
    unsigned int headersize;    /* offset of bitmaps in file */
    unsigned int flags;
    unsigned int length;        /* number of glyphs */
    unsigned int charsize;      /* number of bytes for each character */
    unsigned int height, width; /* max dimensions of glyphs */
    /* charsize = height * ((width + 7) / 8) */
};

/* -------------------------------------------------------------------------- */
/* Font map management                                                        */
/* -------------------------------------------------------------------------- */

/**
 *  Copy the glyph to the font map array
 *      @param data, the glyph bitmap
 *      @param gzise, size of glyph
 */
static int font_add_glyph (const char *data, unsigned int gsize)
{
    if (vt_font_size >= vt_font_maxsize)
    {
        vt_font_maxsize += 256;
        vt_font_data = realloc (vt_font_data, vt_font_maxsize * gsize);
    }

    memcpy(vt_font_data + vt_font_size * gsize, data, gsize);

    return vt_font_size++;
}

/**
 *  Convert UTF8 to (1, 2 & 3 bytes) Unicode char
 *  Return 0 success, -1 not ucode, -2 EOU (end of unicode)
 */
static int utf8_2_unicode(gzFile stream, char s, uint16_t * ucode)
{
    char  s1, s2;

    *ucode = (uint16_t) s;

    if (*ucode == 0xFFFF)
    {
        return -2;
    }

    if (*ucode == 0xFFFE)
    {
        return -1;
    }

    if (!(*ucode & 0x80))
    {
        return 0;
    }

    *ucode = 0;

    if ((s & 0xE0) == 0xC0)
    {
        gzread(stream, &s1, 1);

        *ucode = (s & 0x1F) << 6;
        *ucode |= (s1 & 0x3F);
    }
    else if ((s & 0xF0) == 0xE0)
    {
        gzread(stream, &s1, 1);
        gzread(stream, &s2, 1);

        *ucode = (s & 0x0F) << 12;
        *ucode |= (s1 & 0x3F) << 6;
        *ucode |= (s2 & 0x3F);
    }

    return 0;
}

/**
 *  Load the PSF font file
 */
static int load_psf_font (const char *filename, int is_default)
{
    struct psf2_header psf2hdr;

    size_t psf2hdr_len = sizeof(struct psf2_header);

    gzFile f = gzopen(filename, "rb");

    if (f == NULL)
    {
        fprintf (stderr, "unable to read file %s\n", filename);
        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /* Load PSF2 header and check consistency                                 */
    /* ---------------------------------------------------------------------- */
    if (gzread(f, &psf2hdr, psf2hdr_len) != psf2hdr_len)
    {
        fprintf(stderr, "Wrong header in psf2 font file (%s)\n", filename);
        gzclose(f);

        return -1;
    }

    if (psf2hdr.magic[0] != PSF2_MAGIC0 || psf2hdr.magic[1] != PSF2_MAGIC1 ||
            psf2hdr.magic[2] != PSF2_MAGIC2 ||  psf2hdr.magic[3] != PSF2_MAGIC3 )
    {
        fprintf(stderr, "File %s not in PSFv2 format\n", filename);
        gzclose(f);

        return -1;
    }

    if (!(psf2hdr.flags & PSF2_HAS_UNICODE_TABLE))
    {
        fprintf(stderr, "File %s does not include Unicode glyphs\n", filename);
        gzclose(f);

        return -1;
    }

    if ( psf2hdr.height != 16 && psf2hdr.width != 8 )
    {
        fprintf(stderr, "File %s does not include 8x16 font\n", filename);
        gzclose(f);

        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /* Read the bitmaps                                                       */
    /* ---------------------------------------------------------------------- */
    int gsize = psf2hdr.charsize;
    int font_size  = gsize * psf2hdr.length;

    char *chardata = (char *) malloc (font_size);

    if (gzread(f, chardata, font_size)!= font_size)
    {
        fprintf (stderr, "Cannot read font character data from %s\n", filename);
        gzclose (f);

        free(chardata);

        return -1;
    }

    /* ---------------------------------------------------------------------- */
    /* Read the Unicode description of the glyphs                             */
    /* ---------------------------------------------------------------------- */
    for (int glyph = 0 ;glyph < psf2hdr.length ;glyph++)
    {
        int fi = 0;
        char s;

        while (gzread(f, &s, 1) == 1)
        {
            uint16_t uchar;

            int rc = utf8_2_unicode(f, s, &uchar);

            if ( rc == -1 )
            {
                continue;
            }
            else if ( rc == -2 )
            {
                break;
            }

            if (!vt_fontmap[uchar] && uchar != 0)
            {
                if (!fi)
                {
                    fi = font_add_glyph(chardata + glyph * gsize, gsize);
                }

                vt_fontmap[uchar] = fi;
            }

            if (is_default && fi && glyph < 256)
            {
                vt_fontmap[0xf000 + glyph] = fi;
            }
        }
    }

    free(chardata);
    gzclose(f);

    return 0;
}

/* -------------------------------------------------------------------------- */
/* Print the include file                                                     */
/* -------------------------------------------------------------------------- */

void print_glyphs ()
{
    printf ("static int vt_font_size = %d;\n\n", vt_font_size);

    printf ("static unsigned char vt_font_data[] = {\n");

    for (int i = 0; i < vt_font_size; i++)
    {
        printf("\t/* %d 0x%02x */\n", i, i);

        for (int j = 0; j < 16; j++) //glyph size == 16
        {
            unsigned char d = vt_font_data[i*16+j];

            printf ("\t0x%02X, /* ", d);

            for (int k = 128; k > 0; k = k>>1)
            {
                printf ("%c", (d & k) ? '1': '0');
            }

            printf (" */\n");
        }

        printf ("\n");
    }

    printf ("};\n\n");

    printf ("static unsigned short vt_fontmap[65536] = {\n");

    for (int i = 0; i < 0x0ffff; i++)
    {
        printf ("\t/* 0x%04X => */ %d,\n", i, vt_fontmap[i]);
    }

    printf ("};\n\n");
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static void print_usage()
{
   fprintf(stderr, "Usage: genfont [-d font_path] [font1 font2...]\n");
   fprintf(stderr, "Generate Glyph Bitmaps and associated Unicode mapping\n\n");
   fprintf(stderr, "\tfont1... List of fonts, the first one is the default\n\n");
   fprintf(stderr, "\t-d path: Font path defaults to /usr/share/consolefonts\n\n");
   fprintf(stderr, "Example: genfont default8x16.psf.gz lat1u-16.psf.gz"
           " lat2u-16.psf.gz\n");
}

int main (int argc, char** argv)
{
    char empty[] = {0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0};
    char font_dir[PATH_MAX - 256] = "/usr/share/consolefonts";

    int opt;

    /* ---------------------------------------------------------------------- */
    /* Arguments parsing                                                      */
    /* ---------------------------------------------------------------------- */
    while ((opt = getopt(argc, argv, "hd:")) != -1) {
       switch (opt) {
       case 'h':
           print_usage();
           exit(0);
       case 'd':
           strncpy(font_dir, optarg, PATH_MAX - 257);
           break;
       default: /* '?' */
           print_usage();
           exit(EXIT_FAILURE);
       }
    }

    /* ---------------------------------------------------------------------- */
    /* Load PSF fonts & print glyphs                                          */
    /* ---------------------------------------------------------------------- */
    font_add_glyph(empty, sizeof(empty));

    if ( optind >= argc )
    {
        print_usage();
        exit(EXIT_FAILURE);
    }

    for (int i=optind ; i < argc; ++i)
    {
        char font_path[PATH_MAX];

        snprintf(font_path, PATH_MAX, "%s/%s", font_dir, argv[i]);

        /* font load order is only important if glyphs are redefined */
        load_psf_font(font_path, i == optind);
    }

    print_glyphs ();

    exit (0);
}
