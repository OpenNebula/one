/* -------------------------------------------------------------------------- */
/* Copyright 2002-2016, OpenNebula Project, OpenNebula Systems                */
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

#include <openssl/crypto.h>

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
     * Joins the given element with the delimiter
     *
     * @param values set of values
     * @param delim delimiter character
     * @return the joined strings
     */
    template <class T>
    std::string join(const std::set<T> values, char delim)
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
    std::set<T> set_intersection(const std::set<T> &first, const std::set<T> &second)
    {
        std::set<T> output;

        std::set_intersection(
                first.begin(), first.end(), second.begin(), second.end(),
                std::inserter(output, output.begin()));

        return output;
    }

	/**
     *  Compress the input string unsing zlib
     *    @param in input string
     *    @param bool64 true to base64 encode output
     *    @return pointer to the compressed sting (must be freed) or 0 in case
     *    of error
     */
	std::string * zlib_compress(const std::string& in, bool base64);

	/**
     *  Decompress the input string unsing zlib
     *    @param in input string
     *    @param base64 true if the input is base64 encoded
     *    @return pointer to the decompressed sting (must be freed) or 0 in case
     *    of error
     */
	std::string * zlib_decompress(const std::string& in, bool base64);

	extern "C" void sslmutex_lock_callback(int mode, int type, char *file,
		int line);

	extern "C" unsigned long sslmutex_id_callback();

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

		static std::vector<pthread_mutex_t *> vmutex;
	};
};

#endif /* _NEBULA_UTIL_H_ */
