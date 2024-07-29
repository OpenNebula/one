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

#ifndef LOGIN_TOKEN_H_
#define LOGIN_TOKEN_H_

#include <string>
#include <time.h>
#include <libxml/tree.h>

#include <map>
#include <vector>

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 *  This class is a base class for login tokens, it just stores a token
 *  and its expiration time.
 */
class SessionToken
{
public:

    SessionToken():expiration_time(0), token("") {};

    virtual ~SessionToken() {};

    /**
     *  Clears the token if not valid
     */
    void reset();

    /**
     *  Check if the token is valid (same as the one provided, and not expired)
     *    @param utk provided by the user
     *
     *    @return true if the token is valid
     */
    bool is_valid(const std::string& utk) const;

    /**
     *  Check if the token has expired
     *
     *    @return true if the token has expired
     */
    bool is_expired() const;

    /**
     *  Register a new token, if not provided OpenNebula will generate one.
     *    @param utk if provided externally (e.g. by an auth driver)
     *    @param valid time in seconds that the token will be considered valid
     *    @param gid the effective gid for this token
     *
     *    @return the authentication token in string form
     */
    const std::string& set(const std::string& utk, time_t valid);

protected:
    /**
     *  Expiration time of the token, it will not be valid after it.
     */
    time_t expiration_time;

    /**
     *  Token value
     */
    std::string token;
};

/**
 * The login token class stores a generic token that can be used with any
 * authentication driver and mechanism.
 */
class LoginToken: public SessionToken
{
public:

    LoginToken():SessionToken(), egid(-1) {};

    virtual ~LoginToken() {};

    /**
     *  Check if the token is valid (same as the one provided, and not expired)
     *    @param utk provided by the user
     *    @param gid the effective gid for this token
     *
     *    @return true if the token is valid
     */
    bool is_valid(const std::string& utk, int& _egid) const
    {
        _egid = egid;

        return SessionToken::is_valid(utk);
    }

    /**
     *  Register a new token, if not provided OpenNebula will generate one.
     *    @param utk if provided externally (e.g. by an auth driver)
     *    @param valid time in seconds that the token will be considered valid
     *    @param gid the effective gid for this token
     *
     *    @return the authentication token in string form
     */
    const std::string& set(const std::string& utk, time_t valid, int _egid)
    {
        egid = _egid;

        return SessionToken::set(utk, valid);
    }

    /**
     * Function to print the LoginToken into a string stream in XML format
     *  @param oss the string stream
     */
    void to_xml(std::ostringstream& oss) const;

    /**
     *  Builds the token from an xml pointer
     *    @param node the xml object with the token
     *
     *    @return the authentication token in string form
     */
    const std::string& from_xml_node(const xmlNodePtr node);

private:
    /**
     *  Effective GID. Used for access control and object creation. When set
     *  only the EGID is used and not the full list of groups for authorization.
     *
     */
    int egid;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

/**
 * The login token class stores a generic token that can be used with any
 * authentication driver and mechanism.
 */
class LoginTokenPool
{
public:
    LoginTokenPool() {};

    ~LoginTokenPool();

    /**
     *  Clears the given token by removing it from the pool.
     *    @param utk the token to remove
     *
     *    @return 0 on success, -1 if the token does not exist
     */
    int  reset(const std::string& utk);

    /**
     *  Clears all tokens
     */
    void reset();

    /**
     *  Clears all expired tokens
     */
    void reset_expired();

    /**
     *  Adds a new token to the user token pool
     *    @param utk the token provided by the user, if empty a random one will
     *    be generated
     *    @param valid number of seconds this token can be used
     *    @param egid the effective group id to use when authenticated with
     *    this token
     *
     *    @return 0 on success, utk stores a copy of the token added
     */
    int set(std::string& utk, time_t valid, int egid);

    /**
     *  Check if the token is valid.
     *    @param utk the token as provided for the user
     *    @param egid the effective user id to use with this session -1, to
     *    use the full list of group ids.
     *
     *    @return true if token is valid false otherwise. When valid egid
     *    stores the effective gid. If the token is invali, it is removed
     *    from the pool.
     */
    bool is_valid(const std::string& utk, int& egid, bool& exists_token);

    /**
     *  Load the tokens from its XML representation.
     *    @param content vector of XML tokens
     */
    void from_xml_node(const std::vector<xmlNodePtr>& content);

    /**
     * Function to print the LoginToken into a string in XML format
     *  @param xml the resulting XML string
     *  @return a reference to the generated string
     */
    std::string& to_xml(std::string& xml) const;

private:

    /**
     *  Max number of session tokens per user
     */
    static const int MAX_TOKENS;

    /**
     *  Hash of login tokens
     */
    std::map<std::string, LoginToken *> tokens;

};

#endif /*LOGIN_TOKEN_H_*/
