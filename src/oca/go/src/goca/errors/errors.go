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
/*--------------------------------------------------------------------------- */

package errors

import (
	"fmt"
	"net/http"
)

// Client errors

/*
The OpenNebula server use the library xmlrpc-c.

List of xmlrpc fault codes:
	XMLRPC_INTERNAL_ERROR               -500
	XMLRPC_TYPE_ERROR                   -501
	XMLRPC_INDEX_ERROR                  -502
	XMLRPC_PARSE_ERROR                  -503
	XMLRPC_NETWORK_ERROR                -504
	XMLRPC_TIMEOUT_ERROR                -505
	XMLRPC_NO_SUCH_METHOD_ERROR         -506
	XMLRPC_REQUEST_REFUSED_ERROR        -507
	XMLRPC_INTROSPECTION_DISABLED_ERROR -508
	XMLRPC_LIMIT_EXCEEDED_ERROR         -509
	XMLRPC_INVALID_UTF8_ERROR           -510
*/

// ClientErrCode is used by ClientError to give more accurate information
type ClientErrCode int

const (
	// ClientReqBuild if we can't build the xmlrpc request, ie. http or xml error
	ClientReqBuild ClientErrCode = iota

	// ClientReqHTTP if we can't do a request, ie. connectivity, redirection problems...
	ClientReqHTTP

	// ClientRespHTTP if we have an http response error or if we can't have a full response
	ClientRespHTTP

	// ClientRespXMLRPCFault if the response is an xmlrpc fault
	ClientRespXMLRPCFault

	// ClientRespXMLRPCParse if we can't parse the xmlrpc from the response
	ClientRespXMLRPCParse

	// ClientRespONeParse if we can't parse a correct OpenNebula response
	ClientRespONeParse
)

func (s ClientErrCode) String() string {
	switch s {
	case ClientReqBuild:
		return "REQUEST_BUILD"
	case ClientReqHTTP:
		return "REQUEST_HTTP"
	case ClientRespHTTP:
		return "RESPONSE_HTTP"
	case ClientRespXMLRPCFault:
		return "RESPONSE_XMLRPC_FAULT"
	case ClientRespXMLRPCParse:
		return "RESPONSE_XMLRPC_PARSE"
	case ClientRespONeParse:
		return "RESPONSE_ONE_PARSE"
	default:
		return ""
	}
}

// ClientError is returned when we can't have a complete and well formed response from the client
type ClientError struct {
	Code ClientErrCode
	Msg  string

	// Provide more informations to the user
	HttpResp *http.Response
	Err      error
}

// Cause allow to get the underlying error
func (e *ClientError) Cause() error {
	return e.Err
}

// GetHTTPResponse return the http response for the codes ClientRespXMLRPCFault, ClientRespXMLRPCParse, ClientRespONeParse
func (e *ClientError) GetHTTPResponse() *http.Response {
	return e.HttpResp
}

func (e *ClientError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("GOCA client error [%s]: %s: %s", e.Code.String(), e.Msg, e.Cause())
	}
	return fmt.Sprintf("GOCA client error [%s]: %s", e.Code.String(), e.Msg)
}

// OpenNebula errors

// OneErrCode is the error code from an OpenNebula error response
type OneErrCode int

const (
	// OneSuccess code for a successful response
	OneSuccess = 0x0000

	// OneAuthenticationError code if the user could not be authenticated
	OneAuthenticationError = 0x0100

	// OneAuthorizationError code if the user is not authorized to perform the requested action
	OneAuthorizationError = 0x0200

	// OneNoExistsError code if the requested resource does not exist
	OneNoExistsError = 0x0400

	// OneActionError code if the state is wrong to perform the action
	OneActionError = 0x0800

	// OneXMLRPCAPIError code if there is wrong parameter passed, e.g. param should be -1 or -2, but -3 was received
	OneXMLRPCAPIError = 0x1000

	// OneInternalError code if there is an internal error, e.g. the resource could not be loaded from the DB
	OneInternalError = 0x2000

	// OneAllocateError code if a resource cannot be allocated
	OneAllocateError = 0x4000

	// OneLockedError code if the resource is locked
	OneLockedError = 0x8000
)

func (s OneErrCode) String() string {
	switch s {
	case OneSuccess:
		return "SUCCESS"
	case OneAuthenticationError:
		return "AUTHENTICATION"
	case OneAuthorizationError:
		return "AUTHORIZATION"
	case OneNoExistsError:
		return "NO_EXISTS"
	case OneActionError:
		return "ACTION"
	case OneXMLRPCAPIError:
		return "XML_RPC_API"
	case OneInternalError:
		return "INTERNAL"
	case OneAllocateError:
		return "ALLOCATE"
	case OneLockedError:
		return "LOCKED"
	default:
		return ""
	}
}

// ResponseError is a complete well formed OpenNebula response error
type ResponseError struct {
	Code OneErrCode
	Msg  string
}

func (e *ResponseError) Error() string {
	return fmt.Sprintf("OpenNebula error [%s]: %s", e.Code.String(), e.Msg)
}
