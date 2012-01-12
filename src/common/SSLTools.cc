/* -------------------------------------------------------------------------- */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)             */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/* -------------------------------------------------------------------------- */

#include <openssl/sha.h>
#include <openssl/hmac.h>
#include <openssl/evp.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>

#include "SSLTools.h"
#include <string>
#include <sstream>
#include <iomanip>


//#include <iostream>


//#include <sys/types.h>
//#include <pwd.h>
//#include <stdlib.h>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string * SSLTools::base64_encode(const string& in)
{
    BIO *     bio_mem;
    BIO *     bio_64;

    char *    encoded_c;
    long int  size;

    bio_64  = BIO_new(BIO_f_base64());
    bio_mem = BIO_new(BIO_s_mem());

    BIO_push(bio_64, bio_mem);

    BIO_set_flags(bio_64,BIO_FLAGS_BASE64_NO_NL);

    BIO_write(bio_64, in.c_str(), in.length());

    if (BIO_flush(bio_64) != 1)
    {
        return 0;
    }

    size = BIO_get_mem_data(bio_mem,&encoded_c);

    string * encoded = new string(encoded_c,size);

    BIO_free_all(bio_64);

    return encoded;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string SSLTools::sha1_digest(const string& in)
{
    EVP_MD_CTX     mdctx;
    unsigned char  md_value[EVP_MAX_MD_SIZE];
    unsigned int   md_len;
    ostringstream  oss;

    EVP_MD_CTX_init(&mdctx);
    EVP_DigestInit_ex(&mdctx, EVP_sha1(), NULL);

    EVP_DigestUpdate(&mdctx, in.c_str(), in.length());

    EVP_DigestFinal_ex(&mdctx,md_value,&md_len);
    EVP_MD_CTX_cleanup(&mdctx);

    for(unsigned int i = 0; i<md_len; i++)
    {
        oss << setfill('0') << setw(2) << hex << nouppercase
            << (unsigned short) md_value[i];
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
