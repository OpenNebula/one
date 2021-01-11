/* -------------------------------------------------------------------------- */
/* Copyright 2002-2020, OpenNebula Project, OpenNebula Systems                */
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

#include "SSLUtil.h"

#include <openssl/bio.h>
#include <openssl/evp.h>
#include <openssl/rsa.h>
#include <openssl/pem.h>
#include <zlib.h>

using std::string;

namespace ssl_util
{

    void base64_decode(const std::string& in, std::string& out)
    {
        BIO * bio_64  = BIO_new(BIO_f_base64());

        BIO * bio_mem_in  = BIO_new(BIO_s_mem());
        BIO * bio_mem_out = BIO_new(BIO_s_mem());

        bio_64 = BIO_push(bio_64, bio_mem_in);

        BIO_set_flags(bio_64, BIO_FLAGS_BASE64_NO_NL);

        BIO_write(bio_mem_in, in.c_str(), in.length());

        char inbuf[512];
        int  inlen;

        while ((inlen = BIO_read(bio_64, inbuf, 512)) > 0)
        {
            BIO_write(bio_mem_out, inbuf, inlen);
        }

        char * decoded_c;

        long int size = BIO_get_mem_data(bio_mem_out, &decoded_c);

        out.assign(decoded_c, size);

        BIO_free_all(bio_64);
        BIO_free_all(bio_mem_out);
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    int base64_encode(const std::string& in, std::string &out)
    {
        BIO * bio_64  = BIO_new(BIO_f_base64());
        BIO * bio_mem = BIO_new(BIO_s_mem());

        BIO_push(bio_64, bio_mem);

        BIO_set_flags(bio_64, BIO_FLAGS_BASE64_NO_NL);

        BIO_write(bio_64, in.c_str(), in.length());

        if (BIO_flush(bio_64) != 1)
        {
            return -1;
        }

        char * encoded_c;

        long int size = BIO_get_mem_data(bio_mem, &encoded_c);

        out.assign(encoded_c, size);

        BIO_free_all(bio_64);

        return 0;
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    /**
     *  Buffer length for zlib inflate/deflate
     */
    #define ZBUFFER 65536

    int zlib_decompress(const std::string& in, std::string& out)
    {
        if ( in.empty() )
        {
            return -1;
        }

        z_stream zs;

        zs.zalloc = Z_NULL;
        zs.zfree  = Z_NULL;
        zs.opaque = Z_NULL;

        zs.avail_in = 0;
        zs.next_in  = Z_NULL;

        if ( inflateInit(&zs) != Z_OK)
        {
            return -1;
        }

        zs.avail_in = in.size();
        zs.next_in  = (unsigned char *) const_cast<char *>(in.c_str());

        if ( zs.avail_in <= 2 ) //At least 2 byte header
        {
            inflateEnd(&zs);

            return -1;
        }

        unsigned char zbuf[ZBUFFER];
        std::string result;
        int rc;

        do
        {
            zs.avail_out = ZBUFFER;
            zs.next_out  = zbuf;

            rc = inflate(&zs, Z_FINISH);

            if ( rc != Z_STREAM_END && rc != Z_OK )
            {
                inflateEnd(&zs);

                return -1;
            }

            result.append((const char *) zbuf, (size_t) (ZBUFFER - zs.avail_out));
        } while (rc != Z_STREAM_END);

        inflateEnd(&zs);

        out = std::move(result);

        return 0;
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    int zlib_decompress64(const string& in, string& out)
    {
        if ( in.empty() )
        {
            return -1;
        }

        string zin;

        ssl_util::base64_decode(in, zin);

        return ssl_util::zlib_decompress(zin, out);
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    int zlib_compress(const std::string& in, std::string& out)
    {
        if ( in.empty() )
        {
            return -1;
        }

        z_stream zs;

        zs.zalloc = Z_NULL;
        zs.zfree  = Z_NULL;
        zs.opaque = Z_NULL;

        if ( deflateInit(&zs, Z_DEFAULT_COMPRESSION) != Z_OK )
        {
            return -1;
        }

        zs.avail_in = in.size();
        zs.next_in  = (unsigned char *) const_cast<char *>(in.c_str());

        unsigned char zbuf[ZBUFFER];
        std::string result;

        do
        {
            zs.avail_out = ZBUFFER;
            zs.next_out  = zbuf;

            if ( deflate(&zs, Z_FINISH) == Z_STREAM_ERROR )
            {
                deflateEnd(&zs);
                return -1;
            }

            result.append((const char *) zbuf, (size_t) (ZBUFFER - zs.avail_out));
        } while (zs.avail_out == 0);

        deflateEnd(&zs);

        out = std::move(result);

        return 0;
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    int zlib_compress64(const string& in, string& out)
    {
        string compressed;

        if (ssl_util::zlib_compress(in, compressed) != 0)
        {
            return -1;
        }

        return ssl_util::base64_encode(compressed, out);
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */
    static std::string pubk_path;
    static std::string prik_path;

    void init_rsa_keys(const std::string& pub_key, const std::string& pri_key)
    {
        pubk_path = pub_key;
        prik_path = pri_key;
    }

    bool is_rsa_set()
    {
        return !prik_path.empty();
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    int rsa_public_encrypt(const std::string& in, std::string& out)
    {
        static RSA * rsa = nullptr;

        if ( rsa == nullptr) //initialize RSA structure
        {
            FILE * fp = fopen(pubk_path.c_str(), "r");

            if ( fp == nullptr )
            {
                return -1;
            }

            rsa = PEM_read_RSAPublicKey(fp, &rsa, nullptr, nullptr);

            if ( rsa == nullptr )
            {
                return -1;
            }

            fclose(fp);
        }

        char * out_c = (char *) malloc(sizeof(char) * RSA_size(rsa));

        int rc = RSA_public_encrypt(in.length(), (const unsigned char *) in.c_str(),
                (unsigned char *) out_c, rsa, RSA_PKCS1_PADDING);

        if ( rc != -1 )
        {
            out.assign(out_c, rc);
            rc = 0;
        }

        free(out_c);

        return rc;
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    int rsa_private_decrypt(const std::string& in, std::string& out)
    {
        static RSA * rsa = nullptr;

        if ( rsa == nullptr) //initialize RSA structure
        {
            FILE * fp = fopen(prik_path.c_str(), "r");

            if ( fp == nullptr )
            {
                return -1;
            }

            rsa = PEM_read_RSAPrivateKey(fp, &rsa, nullptr, nullptr);

            if ( rsa == nullptr )
            {
                return -1;
            }

            fclose(fp);
        }

        std::string result;

        int key_size = RSA_size(rsa);
        int in_size  = in.length();
        char * out_c = (char *) malloc(sizeof(char) * RSA_size(rsa));

        const char * in_c = in.c_str();

        for (int index = 0; index < in_size; index += key_size)
        {
            int block_size = key_size;

            if ( index + key_size > in_size )
            {
                block_size = in_size - index;
            }

            int rc = RSA_private_decrypt(block_size, (const unsigned char *)
                    in_c + index, (unsigned char *) out_c, rsa, RSA_PKCS1_PADDING);

            if ( rc != -1 )
            {
                result.append(out_c, rc);
                rc = 0;
            }
            else
            {
                free(out_c);
                return -1;
            }
        }

        free(out_c);

        out = std::move(result);

        return 0;
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    extern "C" void sslmutex_lock_callback(int mode, int type, char *file,
        int line)
    {
        const auto& pm = SSLMutex::ssl_mutex->vmutex[type];

        if (mode & CRYPTO_LOCK)
        {
            pm->lock();
        }
        else
        {
            pm->unlock();
        }
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    extern "C" unsigned long sslmutex_id_callback()
    {
        return (unsigned long) pthread_self();
    }

    SSLMutex * SSLMutex::ssl_mutex = nullptr;

    std::vector<std::unique_ptr<std::mutex>> SSLMutex::vmutex;

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    void SSLMutex::initialize()
    {
        if ( ssl_mutex == nullptr )
        {
            ssl_mutex = new SSLMutex();
        }
    };

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    void SSLMutex::finalize()
    {
        delete ssl_mutex;
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    SSLMutex::SSLMutex()
    {
        for (int i=0; i<CRYPTO_num_locks(); i++)
        {
            vmutex.push_back(std::make_unique<std::mutex>());
        }

        CRYPTO_set_id_callback((unsigned long (*)()) sslmutex_id_callback);

        CRYPTO_set_locking_callback(
            (void (*)(int, int, const char*, int))sslmutex_lock_callback);
    }

    /* -------------------------------------------------------------------------- */
    /* -------------------------------------------------------------------------- */

    SSLMutex::~SSLMutex()
    {
        CRYPTO_set_locking_callback(NULL);
    }

} // namespace ssl_util
