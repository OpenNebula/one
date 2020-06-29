/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

namespace ssl_util
{
    void base64_decode(const std::string& in, std::string& out);

    int base64_encode(const std::string& in, std::string &out);

    int zlib_decompress(const std::string& in, std::string& out);

    int zlib_compress(const std::string& in, std::string& out);

    /**
     *  Set path to public and private rsa keys
     */
    void init_rsa_keys(const std::string& pub_key, const std::string& pri_key);

    bool is_rsa_set();

    int rsa_public_encrypt(const std::string& in, std::string& out);

    int rsa_private_decrypt(const std::string& in, std::string& out);
} // namespace ssl_util

#endif /*SSL_UTIL_H_*/
