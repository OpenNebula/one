/* -------------------------------------------------------------------------- */
/* Copyright 2002-2023, OpenNebula Project, OpenNebula Systems                */
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

package goca

import (
	"bytes"
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"

	errs "github.com/OpenNebula/one/src/oca/go/src/goca/errors"

	cleanhttp "github.com/hashicorp/go-cleanhttp"
	"github.com/kolo/xmlrpc"
)

// OneConfig contains the information to communicate with OpenNebula
type OneConfig struct {
	// Token is the authentication string. In the format of <user>:<password>
	Token string

	// Endpoint contains OpenNebula's XML-RPC API endpoint. Defaults to
	// http://localhost:2633/RPC2
	Endpoint string
}

// Client is a basic XML-RPC client implementing RPCCaller
type Client struct {
	url        string
	token      string
	httpClient *http.Client
}

type Response struct {
	status  bool
	body    string
	bodyInt int
}

// NewConfig returns a new OneConfig object with the specified user, password,
// and endpoint
func NewConfig(user string, password string, endpoint string) OneConfig {
	var authToken string
	var oneAuthPath string

	oneXmlrpc := endpoint

	if user == "" && password == "" {
		oneAuthPath = os.Getenv("ONE_AUTH")
		if oneAuthPath == "" {
			oneAuthPath = os.Getenv("HOME") + "/.one/one_auth"
		}

		token, err := ioutil.ReadFile(oneAuthPath)
		if err == nil {
			authToken = strings.TrimSpace(string(token))
		} else {
			authToken = ""
		}
	} else {
		authToken = user + ":" + password
	}

	if oneXmlrpc == "" {
		oneXmlrpc = os.Getenv("ONE_XMLRPC")
		if oneXmlrpc == "" {
			oneXmlrpc = "http://localhost:2633/RPC2"
		}
	}

	config := OneConfig{
		Token:    authToken,
		Endpoint: oneXmlrpc,
	}

	return config
}

// NewDefaultClient return a new basic one client
func NewDefaultClient(conf OneConfig) *Client {
	return &Client{
		url:        conf.Endpoint,
		token:      conf.Token,
		httpClient: cleanhttp.DefaultPooledClient(),
	}
}

// NewClient return a new one client that allows setting a custom http.Client.
// If the httpClient is nil, it will return a NewDefaultClient
func NewClient(conf OneConfig, httpClient *http.Client) *Client {
	if httpClient == nil {
		return NewDefaultClient(conf)
	}
	return &Client{
		url:        conf.Endpoint,
		token:      conf.Token,
		httpClient: httpClient,
	}
}

// CallContext is an XML-RPC wrapper. It returns a pointer to response and an error and can be canceled through the passed context
func (c *Client) CallContext(ctx context.Context, method string, args ...interface{}) (*Response, error) {
	var (
		ok bool

		status  bool
		body    string
		bodyInt int64
		errCode int64
	)

	xmlArgs := make([]interface{}, len(args)+1)

	xmlArgs[0] = c.token
	copy(xmlArgs[1:], args[:])

	buf, err := xmlrpc.EncodeMethodCall(method, xmlArgs...)
	if err != nil {
		return nil,
			&errs.ClientError{Code: errs.ClientReqBuild, Msg: "xmlrpc request encoding", Err: err}
	}

	req, err := http.NewRequestWithContext(ctx, "POST", c.url, bytes.NewBuffer(buf))
	if err != nil {
		return nil,
			&errs.ClientError{Code: errs.ClientReqBuild, Msg: "http request build", Err: err}
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil,
			&errs.ClientError{Code: errs.ClientReqHTTP, Msg: "http make request", Err: err}
	}

	if resp.StatusCode/100 != 2 {
		return nil, &errs.ClientError{
			Code:     errs.ClientRespHTTP,
			Msg:      fmt.Sprintf("http status code: %d", resp.StatusCode),
			HttpResp: resp,
		}
	}

	respData, err := ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		return nil,
			&errs.ClientError{errs.ClientRespHTTP, "read http response body", resp, err}
	}

	// Server side XML-RPC library: xmlrpc-c
	xmlrpcResp := xmlrpc.Response(respData)

	// Handle the <fault> tag in the xml server response
	if err := xmlrpcResp.Err(); err != nil {
		return nil,
			&errs.ClientError{errs.ClientRespXMLRPCFault, "server response", resp, err}
	}

	result := []interface{}{}

	// Unmarshall the XML-RPC response
	if err := xmlrpcResp.Unmarshal(&result); err != nil {
		return nil,
			&errs.ClientError{errs.ClientRespXMLRPCParse, "unmarshal xmlrpc", resp, err}
	}

	// Parse according the XML-RPC OpenNebula API documentation
	status, ok = result[0].(bool)
	if ok == false {
		return nil,
			&errs.ClientError{errs.ClientRespONeParse, "index 0: boolean expected", resp, nil}
	}

	body, ok = result[1].(string)
	if ok == false {
		bodyInt, ok = result[1].(int64)
		if ok == false {
			return nil,
				&errs.ClientError{errs.ClientRespONeParse, "index 1: int or string expected", resp, nil}
		}
	}

	errCode, ok = result[2].(int64)
	if ok == false {
		return nil,
			&errs.ClientError{errs.ClientRespONeParse, "index 2: boolean expected", resp, nil}
	}

	if status == false {
		return nil, &errs.ResponseError{
			Code: errs.OneErrCode(errCode),
			Msg:  body,
		}
	}

	r := &Response{status, body, int(bodyInt)}

	return r, nil
}

// Body accesses the body of the response
func (r *Response) Body() string {
	return r.body
}

// BodyInt accesses the body of the response, if it's an int.
func (r *Response) BodyInt() int {
	return r.bodyInt
}
