/* ------------------------------------------------------------------------ */
/* Copyright 2002-2012, OpenNebula Project Leads (OpenNebula.org)           */
/*                                                                          */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may  */
/* not use this file except in compliance with the License. You may obtain  */
/* a copy of the License at                                                 */
/*                                                                          */
/* http://www.apache.org/licenses/LICENSE-2.0                               */
/*                                                                          */
/* Unless required by applicable law or agreed to in writing, software      */
/* distributed under the License is distributed on an "AS IS" BASIS,        */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. */
/* See the License for the specific language governing permissions and      */
/* limitations under the License.                                           */
/* -------------------------------------------------------------------------*/

#ifndef SSL_TOOLS_H_
#define SSL_TOOLS_H_

#include <string>

using namespace std;

/**
 *  The SSLTools class provides a simple interface to common SSL utils used
 *  in OpenNebula
 */
class SSLTools
{
public:
    /**
     *  sha1 digest 
     *  @param in the string to be hashed
     *  @return sha1 hash of str
     */
    static string sha1_digest(const string& in);

   /**
    *  Base 64 encoding
    *    @param in the string to encoded
    *    @return a pointer to the encoded string (must be freed) or 0 in case of
    *    error
    */
    static string * base64_encode(const string& in);

private:
    SSLTools(){};
    ~SSLTools(){};
};

#endif /*SSL_TOOLS_H_*/
