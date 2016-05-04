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

#ifndef LOGIN_TOKEN_H_
#define LOGIN_TOKEN_H_

#include <string>
#include <time.h>
#include <libxml/tree.h>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * The login token class stores a generic token that can be used with any
 * authentication driver and mechanism.
 */
class LoginToken
{
public:

    LoginToken():expiration_time(0), token(""){};

    ~LoginToken(){};

    /**
     *  Check if the token is valid (same as the one provided, and not expired)
     *    @param user_token provided by the user
     *    @return true if the token is valid
     */
    bool is_valid(const std::string& user_token) const;

    /**
     *  Register a new token, if not provided OpenNebula will generate one.
     *    @param valid time in seconds that the token will be considered valid
     *    @param user_token if provided externally (e.g. by an auth driver)
     */
    const std::string& set(const std::string& user_token, time_t valid);

    /**
     *  Clears the token if not valid
     */
    void reset();

    /**
     * Function to print the LoginToken into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const;

    /**
     *  Builds the token from an xml pointer
     *    @param node the xml object with the token
     */
    void from_xml_node(const xmlNodePtr node);

private:

    /**
     *  Expiration time of the token, it will not be valid after it.
     */
    time_t expiration_time;

    /**
     *  Token value
     */
    std::string  token;
};

#endif /*LOGIN_TOKEN_H_*/
