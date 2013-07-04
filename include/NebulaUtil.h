/* -------------------------------------------------------------------------- */
/* Copyright 2002-2013, OpenNebula Project (OpenNebula.org), C12G Labs        */
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

#ifndef _NEBULA_UTIL_H_
#define _NEBULA_UTIL_H_

#include <string>

namespace one_util
{
    std::string& toupper(std::string& st);

    std::string& tolower(std::string& st);

    std::string log_time(time_t the_time);

    std::string log_time();

    /**
     *  sha1 digest
     *  @param in the string to be hashed
     *  @return sha1 hash of str
     */
    std::string sha1_digest(const std::string& in);

   /**
    *  Base 64 encoding
    *    @param in the string to encoded
    *    @return a pointer to the encoded string (must be freed) or 0 in case of
    *    error
    */
    std::string * base64_encode(const std::string& in);

   /**
    *  Base 64 decoding
    *    @param in the string to decode
    *    @return a pointer to the decoded string (must be freed) or 0 in case of
    *    error
    */
    std::string * base64_decode(const std::string& in);

   /**
    *  AES256 encryption
    *    @param in the string to encrypt
    *    @param password to encrypt data
    *    @return a pointer to the encrypted string (must be freed) or 0 in case of
    *    error
    */
    std::string * aes256cbc_encrypt(const std::string& in, const std::string password);

    /**
     *  Creates a random number, using time(0) as seed, and performs an sha1 hash
     *    @return a new random password
     */
    std::string random_password();
};

#endif /* _NEBULA_UTIL_H_ */
