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

#ifndef _NEBULA_UTIL_H_
#define _NEBULA_UTIL_H_

#include <string>
#include <sstream>
#include <vector>
#include <set>
#include <algorithm>
#include <random>
#include <mutex>

#include <openssl/crypto.h>

namespace one_util
{
    std::string& toupper(std::string& st);

    std::string& tolower(std::string& st);

    /* Case insensitive string compare
     * @param str1 First string to compare
     * @param str2 Second string to compare
     * @return true if the string are equal, false otherwise
     */
    bool icasecmp(const std::string& str1, const std::string& str2);

    std::string log_time(time_t the_time);

    std::string log_time();

    /**
     *  Escape XML entity and character references
     *  @param in the string to be escaped
     *  @return a string copy
     */
    std::string xml_escape(const std::string& in);

    /**
     *  sha1 digest
     *  @param in the string to be hashed
     *  @return sha1 hash of str
     */
    std::string sha1_digest(const std::string& in);

    /**
     *  sha256 digest
     *  @param in the string to be hashed
     *  @return sha256 hash of str
     */
    std::string sha256_digest(const std::string& in);


    /**
     *  AES256 encryption
     *    @param in the string to encrypt
     *    @param password to encrypt data
     *    @return a pointer to the encrypted string (must be freed) or nullptr in case of
     *    error
     */
    std::string * aes256cbc_encrypt(const std::string& in, const std::string& password);

    /**
     *  AES256 decryption
     *    @param in the base64 string to decrypt
     *    @param password to decrypt data
     *    @return a pointer to the decrypted string (must be freed) or nullptr in case of
     *    error
     */
    std::string * aes256cbc_decrypt(const std::string& in, const std::string& password);

    /**
     *  Creates a random number, using time(0) as seed, and performs an sha1 hash
     *    @return a new random password
     */
    std::string random_password();

    /**
     *  Returns random number, default range is <0, Type Max Value>, specialization for integer types
     *    @param min - minimal potentially generated number, defaults to 0
     *    @param max - maximal potentially generated number, defaults to type max value
     *    @return number between min, max
     */
    template<typename Integer, typename std::enable_if<std::is_integral<Integer>::value>::type* = nullptr>
    Integer random(Integer min = 0, Integer max = std::numeric_limits<Integer>::max())
    {
        static std::mutex _mutex;

        static std::random_device rd;
        static std::mt19937_64    rng(rd());

        std::uniform_int_distribution<Integer> distribution(min, max);

        std::lock_guard<std::mutex> lock(_mutex);

        Integer i = distribution(rng);

        return i;
    }

    /**
     *  Returns random number, default range is <0, Type Max Value>, specialization for floating types
     *    @param min - minimal potentially generated number, defaults to 0
     *    @param max - maximal potentially generated number, defaults to type max value
     *    @return number between min, max
     */
    template<typename Floating, typename std::enable_if<std::is_floating_point<Floating>::value>::type* = nullptr>
    Floating random(Floating min = 0, Floating max = std::numeric_limits<Floating>::max())
    {
        static std::mutex _mutex;

        static std::random_device rd;
        static std::mt19937_64    rng(rd());

        std::uniform_real_distribution<Floating> distribution(min, max);

        std::lock_guard<std::mutex> lock(_mutex);

        Floating f = distribution(rng);

        return f;
    }

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
    template <class T>
    void split(const std::string &st, char delim, std::vector<T> &parts)
    {
        std::string part;

        std::stringstream ss(st);

        while (getline(ss, part, delim))
        {
            if (part.empty())
            {
                continue;
            }

            std::istringstream iss(part);
            T part_t;

            iss >> part_t;

            if ( iss.fail() )
            {
                continue;
            }

            parts.push_back(part_t);
        }
    }

    std::vector<std::string> split(const std::string& st, char delim,
                                   bool clean_empty = true);

    /**
     * Splits a string, using the given delimiter
     *
     * @param st string to split
     * @param delim delimiter character
     * @param result where the result will be saved
     */
    template <class T>
    void split_unique(const std::string& st, char delim, std::set<T>& result)
    {
        T elem;

        std::vector<std::string> strings = split(st, delim, true);

        for (const auto& str : strings)
        {
            std::istringstream iss(str);
            iss >> elem;

            if ( iss.fail() )
            {
                continue;
            }

            result.insert(elem);
        }
    }

    /**
     * Explicit specialization for strings
     */
    template <>
    void split_unique(const std::string& st, char delim,
                      std::set<std::string>& result);

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

        for (Iterator it = first; it != last; it++)
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
     * Joins the given element with the delimiter
     *
     * @param values set of values
     * @param delim delimiter character
     * @return the joined strings
     */
    template <class T>
    std::string join(const T& values, char delim)
    {
        return join(values.begin(), values.end(), delim);
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
     *  Returns a scaped version of a value in the from "<op><val><cl>"
     *    @param v the value to be escaped
     *    @param op the opening escape string
     *    @param cl the closing escape string
     */
    template <typename ValueType> inline
    std::string escape(const ValueType& v, const char * op, const char * cl)
    {
        std::ostringstream oss;

        oss << op << v << cl;

        return oss.str();
    }

    template <typename ValueType> inline
    std::string escape_xml(const ValueType &v)
    {
        return escape(v, "<![CDATA[", "]]>");
    }

    template <typename ValueType> inline
    std::string escape_xml_attr(const ValueType &v)
    {
        return escape(v, "'", "'");
    }

    void escape_json(const std::string& str, std::ostringstream& s);

    void escape_token(const std::string& str, std::ostringstream& s);

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

    /**
     * Returns a copy of st with the all occurrences of "find" substituted
     * for "replacement"
     * @param st string input
     * @param sfind string to search for
     * @param replacement string to replace occurrences with
     * @return a string copy
     */
    std::string gsub(const std::string& st, const std::string& sfind,
                     const std::string& replacement);

    template <class T>
    std::set<T> set_intersection(const std::set<T> &first, const std::set<T>
                                 &second)
    {
        std::set<T> output;

        std::set_intersection(
                first.begin(), first.end(), second.begin(), second.end(),
                std::inserter(output, output.begin()));

        return output;
    }

    /**
     * Generates a new uuid
     */
    std::string uuid();

    /**
     * Reads a generic value from string that supports operator >>.
     *  @param str Input string
     *  @param value Numeric value converted from the str, undefined if
     *               the method fails
     *  @return true on success, false otherwise
     */
    template <class T>
    bool str_cast(const std::string& str, T& value)
    {
        std::istringstream iss(str);

        iss >> value;

        if (iss.fail() || !iss.eof())
        {
            return false;
        }

        return true;
    }

    template <>
    bool str_cast(const std::string& str, std::string& value);

} // namespace one_util

#endif /* _NEBULA_UTIL_H_ */
