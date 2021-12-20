/* -------------------------------------------------------------------------- */
/* Copyright 2002-2021, OpenNebula Project, OpenNebula Systems                */
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

#ifndef MONITOR_MESSAGE_H
#define MONITOR_MESSAGE_H

#include <unistd.h>

#include <string>
#include <iostream>
#include <sstream>

#include "EnumString.h"

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

/**
 *  This class represents a generic message used by the Monitoring Protocol.
 *  The structure of the message is:
 *
 *  +------+-----+--------+-----+-----+-----+----+-----+---------+------+
 *  | TYPE | ' ' | STATUS | ' ' | OID | ' ' | TS | ' ' | PAYLOAD | '\n' |
 *  +------+-----+--------+-----+-----+-----+----+-----+---------+------+
 *
 *    TYPE String (non-blanks) identifying the message type
 *    ' ' A single white space to separate fields
 *    STATUS String (non-blanks), status of the message depends on message
 *      type, could contain result of operation ("SUCCESS" or "FAILURE")
 *    OID Number, id of affected object, -1 if not object related
 *    TS timestamp for the message in epoch.
 *    PAYLOAD of the message XML base64 encoded
 *    '\n' End of message delimiter
 *
 */
template<typename E>
class Message
{
public:
    /**
     *  Parse the Message from an input string
     *    @param input string with the message
     */
    int parse_from(const std::string& input, bool decrypt);

    /**
     *  Writes this object to the given string
     */
    int write_to(std::string& out, bool encrypt) const;

    /**
     *  Writes this object to the given file descriptor
     */
    int write_to(int fd, bool encrypt) const;

    /**
     *  Writes this object to the given output stream
     */
    int write_to(std::ostream& oss, bool encrypt) const;

    /**
     *
     */
    E type() const
    {
        return _type;
    }

    void type(E t)
    {
        _type = t;
    }

    /**
     *  Returns type of the message as string
     */
    const std::string& type_str() const
    {
        return _type_str._to_str(_type);
    }

    static const std::string& type_str(E t)
    {
        return _type_str._to_str(t);
    }

    /**
     *  Status of the message, can't contain blanks.
     *  Depends on message type, could contain result of
     *  operation ("SUCCESS" or "FAILURE")
     *  Default value is "-"
     */
    const std::string& status() const
    {
        return _status;
    }

    void status(const std::string& status)
    {
        _status = status;
    }

    /**
     *  Object ID, -1 if not object related
     */
    int oid() const
    {
        return _oid;
    }

    void oid(int oid)
    {
        _oid = oid;
    }

    /**
     *  Message data, could be empty
     */
    const std::string& payload() const
    {
        return _payload;
    }

    void payload(const std::string& p)
    {
        _payload = p;
    }

    /**
     *  Message timestamp, optional
     */
    time_t timestamp() const
    {
        return _timestamp;
    }

    void timestamp(time_t ts)
    {
        _timestamp = ts;
    }

private:
    /**
     *  Message fields
     */
    E _type;

    std::string _status = std::string("-");

    int _oid = -1;

    std::string _payload;

    time_t _timestamp = 0;

    static const EString<E> _type_str;
};

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */
/* Message Template Implementation                                             */
/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E>
int Message<E>::parse_from(const std::string& input, bool decrypt)
{
    std::istringstream is(input);
    std::string buffer, payloaz;

    if (!is.good())
    {
        goto error;
    }

    is >> buffer;

    _type = _type_str._from_str(buffer.c_str());

    if ( !is.good() || _type == E::UNDEFINED )
    {
        goto error;
    }

    buffer.clear();

    is >> _status;

    is >> _oid;

    is >> _timestamp;

    is >> buffer;

    if (buffer.empty())
    {
        _payload.clear();
        return 0;
    }

    base64_decode(buffer, payloaz);

    if ( zlib_decompress(payloaz, _payload) == -1 )
    {
        goto error;
    }

    if ( decrypt && is_rsa_set() )
    {
        if ( rsa_private_decrypt(_payload, _payload) == -1 )
        {
            goto error;
        }
    }

    return 0;

error:
    _type    = E::UNDEFINED;
    _payload = input;
    return -1;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E>
int Message<E>::write_to(std::string& out, bool encrypt) const
{
    out.clear();

    std::string secret;
    std::string payloaz;
    std::string payloaz64;

    if (!_payload.empty())
    {
        if (encrypt)
        {
            if (rsa_public_encrypt(_payload, secret) != 0)
            {
                return -1;
            }
        }
        else
        {
            secret = _payload;
        }

        if (zlib_compress(secret, payloaz) == -1)
        {
            return -1;
        }

        if ( base64_encode(payloaz, payloaz64) == -1)
        {
            return -1;
        }
    }

    out = _type_str._to_str(_type);
    out += ' ';
    out += _status.empty() ? "-" : _status;
    out += ' ';
    out += std::to_string(_oid);
    out += ' ';
    out += std::to_string(_timestamp);
    out += ' ';
    out += payloaz64;
    out += '\n';

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E>
int Message<E>::write_to(int fd, bool encrypt) const
{
    std::string out;

    if ( write_to(out, encrypt) == -1)
    {
        return -1;
    }

    ::write(fd, (const void *) out.c_str(), out.size());

    return 0;
}

/* -------------------------------------------------------------------------- */
/* -------------------------------------------------------------------------- */

template<typename E>
int Message<E>::write_to(std::ostream& oss, bool encrypt) const
{
    std::string out;

    if ( write_to(out, encrypt) == -1)
    {
        return -1;
    }

    oss << out;

    return 0;
}

#endif /*MONITOR_MESSAGE_H_*/
