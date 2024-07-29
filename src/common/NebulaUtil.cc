/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
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
#include "SSLUtil.h"

#include <openssl/sha.h>
#include <openssl/evp.h>
#include <openssl/aes.h>

#include <string>
#include <sstream>
#include <cstring>
#include <iomanip>
#include <algorithm>
#include <math.h>
#include <sys/types.h>
#include <regex.h>

using namespace std;

string& one_util::toupper(string& st)
{
    transform(st.begin(), st.end(), st.begin(), (int(*)(int))std::toupper);
    return st;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string& one_util::tolower(string& st)
{
    transform(st.begin(), st.end(), st.begin(), (int(*)(int))std::tolower);
    return st;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

bool one_util::icasecmp(const std::string& str1, const std::string& str2)
{
    return (str1.size() == str2.size()) &&
           std::equal(str1.begin(), str1.end(), str2.begin(),
                      [](const char & c1, const char & c2)
    {
        return (c1 == c2 || std::toupper(c1) == std::toupper(c2));
    });
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::log_time(time_t the_time)
{
    char time_str[26];

#ifdef SOLARIS
    ctime_r(&(the_time), time_str, sizeof(char)*26);
#else
    ctime_r(&(the_time), time_str);
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

string one_util::xml_escape(const string& in)
{
    string result = in;

    result = one_util::gsub(result, "&",  "&amp;");
    result = one_util::gsub(result, "<",  "&lt;");
    result = one_util::gsub(result, ">",  "&gt;");
    result = one_util::gsub(result, "'",  "&apos;");
    result = one_util::gsub(result, "\"", "&quot;");
    result = one_util::gsub(result, "\r", "&#x0d;");

    return result;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::sha1_digest(const string& in)
{
    EVP_MD_CTX*    mdctx;
    unsigned char  md_value[EVP_MAX_MD_SIZE];
    unsigned int   md_len;
    ostringstream  oss;

#if OPENSSL_VERSION_NUMBER < 0x10100000L || defined(LIBRESSL_VERSION_NUMBER)
    mdctx = (EVP_MD_CTX*) malloc(sizeof(EVP_MD_CTX));
    EVP_MD_CTX_init(mdctx);
#else
    mdctx = EVP_MD_CTX_new();
#endif

    EVP_DigestInit_ex(mdctx, EVP_sha1(), NULL);

    EVP_DigestUpdate(mdctx, in.c_str(), in.length());

    EVP_DigestFinal_ex(mdctx, md_value, &md_len);

#if OPENSSL_VERSION_NUMBER < 0x10100000L || defined(LIBRESSL_VERSION_NUMBER)
    EVP_MD_CTX_cleanup(mdctx);
    free(mdctx);
#else
    EVP_MD_CTX_free(mdctx);
#endif

    for (unsigned int i = 0; i<md_len; i++)
    {
        oss << setfill('0') << setw(2) << hex << nouppercase
            << (unsigned short) md_value[i];
    }

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::sha256_digest(const string& in)
{
    unsigned char digest[SHA256_DIGEST_LENGTH];
    stringstream oss;

    SHA256((unsigned char*) in.c_str(), in.length(), digest);

    for (int i = 0; i < SHA256_DIGEST_LENGTH; i++)
        oss << setfill('0') << setw(2) << hex << nouppercase
            << (unsigned int) digest[i];

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string * one_util::aes256cbc_encrypt(const string& in, const string& password)
{
    EVP_CIPHER_CTX *ctx;

    const unsigned char *key     = (unsigned char*) password.c_str();
    const unsigned char *in_data = (unsigned char*) in.c_str();

    unsigned char out[in.length() + AES_BLOCK_SIZE];

    int outlen1, outlen2;

#if OPENSSL_VERSION_NUMBER < 0x10100000L || defined(LIBRESSL_VERSION_NUMBER)
    ctx = (EVP_CIPHER_CTX*) malloc(sizeof(EVP_CIPHER_CTX));
    EVP_CIPHER_CTX_init(ctx);
#else
    ctx = EVP_CIPHER_CTX_new();
#endif

    EVP_EncryptInit(ctx, EVP_aes_256_cbc(), key, NULL);
    EVP_EncryptUpdate(ctx, out, &outlen1, in_data, in.length());
    EVP_EncryptFinal_ex(ctx, out + outlen1, &outlen2);

#if OPENSSL_VERSION_NUMBER < 0x10100000L || defined(LIBRESSL_VERSION_NUMBER)
    EVP_CIPHER_CTX_cleanup(ctx);
    free(ctx);
#else
    EVP_CIPHER_CTX_free(ctx);
#endif

    string encrypt((char*) out, (size_t)(outlen1+outlen2));

    string* aes256 = new string();

    if (ssl_util::base64_encode(encrypt, *aes256) == 0)
    {
        return aes256;
    }
    else
    {
        delete aes256;

        return nullptr;
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string * one_util::aes256cbc_decrypt(const string& in, const string& password)
{
    string crypted;

    ssl_util::base64_decode(in, crypted);

    if (crypted.empty())
    {
        return nullptr;
    }

    bool success = true;
    EVP_CIPHER_CTX *ctx;

    const unsigned char *key     = (unsigned char*) password.c_str();
    const unsigned char *in_data = (unsigned char*) crypted.c_str();

    unsigned char out[in.length() + AES_BLOCK_SIZE];

    int outlen1, outlen2;

#if OPENSSL_VERSION_NUMBER < 0x10100000L || defined(LIBRESSL_VERSION_NUMBER)
    ctx = (EVP_CIPHER_CTX*) malloc(sizeof(EVP_CIPHER_CTX));
    EVP_CIPHER_CTX_init(ctx);
#else
    ctx = EVP_CIPHER_CTX_new();
#endif

    EVP_DecryptInit(ctx, EVP_aes_256_cbc(), key, NULL);
    EVP_DecryptUpdate(ctx, out, &outlen1, in_data, crypted.length());
    if (1 != EVP_DecryptFinal_ex(ctx, out + outlen1, &outlen2))
    {
        success = false;
    }

#if OPENSSL_VERSION_NUMBER < 0x10100000L || defined(LIBRESSL_VERSION_NUMBER)
    EVP_CIPHER_CTX_cleanup(ctx);
    free(ctx);
#else
    EVP_CIPHER_CTX_free(ctx);
#endif

    if (!success)
    {
        return nullptr;
    }

    return new string((char*)out, (size_t)(outlen1 + outlen2));
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::random_password()
{
    return sha256_digest(std::to_string(random<int>()));
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

string one_util::trim(const string& str)
{
    auto wfirst = find_if(str.begin(), str.end(), not_space);

    if (wfirst == str.end())
    {
        return string();
    }

    auto rwlast = find_if(str.rbegin(), str.rend(), not_space);

    auto wlast(rwlast.base());

    string tstr(wfirst, wlast);

    return tstr;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::gsub(const string& st, const string& sfind,
                      const string& srepl)
{
    string result = st;

    string::size_type pos = 0;

    size_t srepl_len = srepl.length();
    size_t sfind_len = sfind.length();

    pos = result.find(sfind, pos);

    while (pos != string::npos)
    {
        result.replace(pos, sfind_len, srepl);
        pos += srepl_len;

        pos = result.find(sfind, pos);
    }

    return result;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void one_util::escape_json(const string& str, ostringstream& s)
{
    s << "\"";

    for (auto ch : str)
    {
        switch (ch)
        {
            case '\\': s << "\\\\"; break;
            case '"' : s << "\\\""; break;
            case '/' : s << "\\/";  break;
            case '\b': s << "\\b";  break;
            case '\f': s << "\\f";  break;
            case '\n': s << "\\n";  break;
            case '\r': s << "\\r";  break;
            case '\t': s << "\\t";  break;
            default  : s << ch;
        }
    }

    s << "\"";
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

void one_util::escape_token(const string& str, ostringstream& s)
{
    for (auto ch : str)
    {
        switch (ch)
        {
            case '-':
            case '_':
            case '.':
            case ':':
                s << '_';
                break;
            default :
                s << ch;
        }
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<>
void one_util::split_unique(const string& st, char delim, set<string>& res)
{
    vector<string> strings = split(st, delim, true);

    for (const auto& str : strings)
    {
        res.insert(str);
    }
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

string one_util::uuid()
{
    // Generate from random numbers to avoid adding a dependency
    ostringstream oss;

    oss.fill('0');
    oss << hex
        << setw(4) << random<short uint>()
        << setw(4) << random<short uint>()
        << "-" << setw(4) << random<short uint>()
        << "-" << setw(4) << ((random<short uint>() & 0x0fff) | 0x4000)
        << "-" << setw(4) << random<short uint>() % 0x3fff + 0x8000
        << "-" << setw(4) << random<short uint>()
        << setw(4) << random<short uint>()
        << setw(4) << random<short uint>();

    return oss.str();
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template <>
bool one_util::str_cast(const std::string& str, std::string& value)
{
    if (str.empty())
    {
        return false;
    }

    value = str;

    return true;
}
