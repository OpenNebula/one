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

#ifndef SSL_UTIL_H
#define SSL_UTIL_H

#include <string>
#include <vector>
#include <mutex>
#include <memory>

namespace ssl_util
{
    /**
     *  Base 64 decoding
     *    @param in the string to decode
     *    @param out the decoded string
     */
    void base64_decode(const std::string& in, std::string& out);

    /**
    *  Base 64 encoding
    *    @param in the string to encode
    *    @param out the encoded string
    *    @return 0 on success, -1 on error
    */
    int base64_encode(const std::string& in, std::string &out);

    /**
     *  Decompress the input string unsing zlib
     *    @param in input string
     *    @param out decompressed string
     *    @return 0 on success, -1 on error
     */
    int zlib_decompress(const std::string& in, std::string& out);

    /**
     *  Decompress the input string unsing zlib and base64 decodes the result
     *    @param in input string
     *    @param out decompressed string
     *    @return 0 on success, -1 on error
     */
    int zlib_decompress64(const std::string& in, std::string& out);

    /**
     *  Compress the input string unsing zlib
     *    @param in input string
     *    @param out compressed string true to base64 encode output
     *    @return 0 on success, -1 on error
     */
    int zlib_compress(const std::string& in, std::string& out);

    /**
     *  Compress the input string unsing zlib and base64 encodes the ouput
     *    @param in input string
     *    @param out compressed string true to base64 encode output
     *    @return 0 on success, -1 on error
     */
    int zlib_compress64(const std::string& in, std::string& out);

    /**
     *  Set path to public and private rsa keys
     */
    void init_rsa_keys(const std::string& pub_key, const std::string& pri_key);

    /**
     *  Is rsa initialized and private key set?
     */
    bool is_rsa_set();

    /**
     *  Encrypt message with public key
     */
    int rsa_public_encrypt(const std::string& in, std::string& out);

    /**
     *  Decrypt message with private key
     */
    int rsa_private_decrypt(const std::string& in, std::string& out);


    extern "C" void sslmutex_lock_callback(int mode, int type, char *file,
                                           int line);

    extern "C" unsigned long sslmutex_id_callback();

    // Needed for openssl version < 1.1.0
    class SSLMutex
    {
    public:
        static void initialize();

        static void finalize();

    private:
        friend void sslmutex_lock_callback(int mode, int type, char *file,
                                           int line);

        SSLMutex();

        ~SSLMutex();

        static SSLMutex * ssl_mutex;

        static std::vector<std::unique_ptr<std::mutex>> vmutex;
    };

} // namespace ssl_util

#endif /*SSL_UTIL_H_*/
