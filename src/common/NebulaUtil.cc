/* -------------------------------------------------------------------------- */
/* Copyright 2002-2015, OpenNebula Project, OpenNebula Systems                */
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

#include "NebulaUtil.h"

#include <openssl/sha.h>
#include <openssl/hmac.h>
#include <openssl/evp.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>
#include <openssl/aes.h>

#include <string>
#include <sstream>
#include <iomanip>
#include <algorithm>
#include <math.h>
#include <sys/types.h>
#include <regex.h>

using namespace std;

string& one_util::toupper(string& st)
{
    transform(st.begin(),st.end(),st.begin(),(int(*)(int))std::toupper);
    return st;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& one_util::tolower(string& st)
{
    transform(st.begin(),st.end(),st.begin(),(int(*)(int))std::tolower);
    return st;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::log_time(time_t the_time)
{
    char time_str[26];

#ifdef SOLARIS
    ctime_r(&(the_time),time_str,sizeof(char)*26);
#else
    ctime_r(&(the_time),time_str);
#endif

    time_str[24] = '\0'; // Get rid of final enter character

    return string(time_str);
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::log_time()
{
    return log_time( time(0) );
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string * one_util::base64_encode(const string& in)
{
    BIO *     bio_mem;
    BIO *     bio_64;

    char *    encoded_c;
    long int  size;

    bio_64  = BIO_new(BIO_f_base64());
    bio_mem = BIO_new(BIO_s_mem());

    BIO_push(bio_64, bio_mem);

    BIO_set_flags(bio_64, BIO_FLAGS_BASE64_NO_NL);

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

string * one_util::base64_decode(const string& in)
{
    BIO *  bio_mem_in;
    BIO *  bio_mem_out;
    BIO *  bio_64;

    char inbuf[512];
    int  inlen;

    char *   decoded_c;
    long int size;

    bio_64  = BIO_new(BIO_f_base64());

    bio_mem_in  = BIO_new(BIO_s_mem());
    bio_mem_out = BIO_new(BIO_s_mem());

    bio_64 = BIO_push(bio_64, bio_mem_in);

    BIO_set_flags(bio_64, BIO_FLAGS_BASE64_NO_NL);

    BIO_write(bio_mem_in, in.c_str(), in.length());

    while((inlen = BIO_read(bio_64, inbuf, 512)) > 0)
    {
        BIO_write(bio_mem_out, inbuf, inlen);
    }

    size = BIO_get_mem_data(bio_mem_out, &decoded_c);

    string * decoded = new string(decoded_c, size);

    BIO_free_all(bio_64);
    BIO_free_all(bio_mem_out);

    return decoded;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::sha1_digest(const string& in)
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

string * one_util::aes256cbc_encrypt(const string& in, const string password)
{
    EVP_CIPHER_CTX ctx;

    const unsigned char *key     = (unsigned char*) password.c_str();
    const unsigned char *in_data = (unsigned char*) in.c_str();

    unsigned char out[in.length() + AES_BLOCK_SIZE];

    int outlen1, outlen2;

    EVP_EncryptInit(&ctx, EVP_aes_256_cbc(), key, NULL);
    EVP_EncryptUpdate(&ctx, out, &outlen1, in_data, in.length());
    EVP_EncryptFinal(&ctx, out + outlen1, &outlen2);

    EVP_CIPHER_CTX_cleanup(&ctx);

    string encrypt((char*) out, (size_t)(outlen1+outlen2));

    return base64_encode(encrypt);;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::random_password()
{
    static bool init = false;

    ostringstream  sstr;

    if (!init)
    {
        srand(time(0) + rand());
        init = true;
    }

    sstr << rand();

    return sha1_digest(sstr.str());
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

vector<string> one_util::split(const string& st, char delim, bool clean_empty)
{
    vector<string>  parts;
    string          part;

    stringstream    ss(st);

    while (getline(ss, part, delim))
    {
        if (!(clean_empty && part.empty()))
        {
            parts.push_back(part);
        }
    }

    return parts;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::float_to_str(const float &num)
{
    ostringstream oss;

    if ( num == ceil(num) )
    {
        oss.precision(0);
    }
    else
    {
        oss.precision(2);
    }

    oss << fixed << num;

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

int one_util::regex_match(const char *pattern, const char *subject)
{
    int rc;
    regex_t re;

    rc = regcomp(&re, pattern, REG_EXTENDED|REG_NOSUB);

    if (rc != 0)
    {
        return(rc);
    }

    rc = regexec(&re, subject, 0, 0, 0);
    regfree(&re);

    return rc;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

static bool not_space(int c)
{
    return std::isspace(c) == 0;
};

std::string one_util::trim(const std::string& str)
{
    std::string::const_iterator        wfirst;
    std::string::const_reverse_iterator rwlast;

    wfirst = find_if(str.begin(), str.end(), not_space);
    rwlast = find_if(str.rbegin(),str.rend(),not_space);

    std::string::const_iterator wlast(rwlast.base());

	std::string tstr(wfirst, wlast);

	return tstr;
}
