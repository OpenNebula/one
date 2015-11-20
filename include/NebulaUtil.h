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

#ifndef _NEBULA_UTIL_H_
#define _NEBULA_UTIL_H_

#include <string>
#include <sstream>
#include <vector>
#include <set>

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

    /**
     * Splits a string, using the given delimiter
     *
     * @param st string to split
     * @param delim delimiter character
     * @param clean_empty true to clean empty split parts.
     *  Example for st "a::b:c"
     *      clean_empty true will return ["a", "b", "c"]
     *      clean_empty fase will return ["a", "", "b", "c"]
     *
     * @return a vector containing the resulting substrings
     */
    std::vector<std::string> split(
            const std::string& st,
            char delim,
            bool clean_empty=true);

    /**
     * Splits a string, using the given delimiter
     *
     * @param st string to split
     * @param delim delimiter character
     * @param result where the result will be saved
     * @param clean_empty true to clean empty split parts.
     *  Example for st "a::b:c"
     *      clean_empty true will return ["a", "b", "c"]
     *      clean_empty fase will return ["a", "", "b", "c"]
     */
    template <class T>
    void split_unique(
            const std::string& st,
            char delim,
            std::set<T>& result,
            bool clean_empty=true)
    {
        T elem;
        std::vector<std::string>::const_iterator it;

        std::vector<std::string> strings = split(st, delim, clean_empty);

        for (it = strings.begin(); it != strings.end(); it++)
        {
            std::istringstream iss(*it);
            iss >> elem;

            if ( iss.fail() )
            {
                continue;
            }

            result.insert(elem);
        }
    }

    /**
     * Joins the given element with the delimiter
     *
     * @param first iterator
     * @param last iterator
     * @param delim delimiter character
     * @return the joined strings
     */
    template <class Iterator>
    std::string join(Iterator first, Iterator last, char delim)
    {
        std::ostringstream oss;

        for(Iterator it = first; it != last; it++)
        {
            if (it != first)
            {
                oss << delim;
            }

            oss << *it;
        }

        return oss.str();
    }

    /**
     * Creates a string from the given float, using fixed notation. If the
     * number has any decimals, they will be truncated to 2.
     *
     * @param num
     * @return
     */
    std::string float_to_str(const float &num);

    /**
     * Checks if a strings matches a regular expression
     *
     * @param pattern PCRE extended pattern
     * @param subject the string to test
     * @return 0 on match, another value otherwise
     */
    int regex_match(const char *pattern, const char *subject);

    /**
     * Trim an string using the isspace function
     * @param the string
     * @return trimed string
     */
    std::string trim(const std::string& str);
};

#endif /* _NEBULA_UTIL_H_ */
