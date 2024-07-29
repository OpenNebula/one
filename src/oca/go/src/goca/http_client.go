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

package goca

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"errors"
)

// RESTClient
type RESTClient struct {
	user    string
	pass    string
	address string // server address, ie: http://localhost:2474

	httpClient *http.Client
}

// HTTPAuth holds credentials for a server address
type HTTPAuth struct {
	user    string
	pass    string
	address string // server address, ie: http://localhost:2474
}

// newHTTPResponse Creates Response from http response
func newHTTPResponse(r *http.Response, err error) (*Response, error) {
	if err != nil {
		return nil, err
	}

	status := true

	// HTTP 2XX
	if r.StatusCode/100 != 2 {
		status = false
	}

	return &Response{
		status: status,
		body:   bodyToStr(r),
	}, nil
}

// HTTPMethod interface to client internals
func (c *RESTClient) HTTPMethod(method string, url string, args ...interface{}) (*Response, error) {
	var err error
	var response Response
	r := &response

	switch method {
	case "GET":
		r, err = c.get(string(url))
	case "DELETE":
		r, err = c.delete(string(url))
	case "POST":
		r, err = c.post(string(url), args[0].(map[string]interface{}))
	case "PUT":
		r, err = c.put(string(url), args[0].(map[string]interface{}))
	case "":
		return nil, errors.New("Unsupported method.")
	}

	return r, err
}

// HTTP METHODS
// The url passed to the methods is the follow up to the endpoint
// ex. use service instead of  http://localhost:2474/service

// Get http
func (c *RESTClient) get(eurl string) (*Response, error) {
	url := genurl(c.address, eurl)

	return newHTTPResponse(httpReq(c, "GET", url, nil))
}

// Delete http
func (c *RESTClient) delete(eurl string) (*Response, error) {
	url := genurl(c.address, eurl)

	return newHTTPResponse(httpReq(c, "DELETE", url, nil))
}

// Post http
func (c *RESTClient) post(eurl string, message map[string]interface{}) (*Response, error) {
	url := genurl(c.address, eurl)

	return newHTTPResponse(httpReq(c, "POST", url, message))
}

// Put http
func (c *RESTClient) put(eurl string, message map[string]interface{}) (*Response, error) {
	url := genurl(c.address, eurl)

	return newHTTPResponse(httpReq(c, "PUT", url, message))
}

// BodyMap accesses the body of the response and returns it as a map
func (r *Response) BodyMap() map[string]interface{} {
	var bodyMap map[string]interface{}

	if err := json.Unmarshal([]byte(r.body), &bodyMap); err != nil {
		panic(err)
	}

	return bodyMap
}

// bodyToStr returns http body as string
func bodyToStr(response *http.Response) string {
	body, err := ioutil.ReadAll(response.Body)

	if err != nil {
		log.Fatalln(err)
	}

	return string(body)
}

// HELPERS

// General http request method for the c.
func httpReq(c *RESTClient, method string, eurl string, message map[string]interface{}) (*http.Response, error) {
	req, err := http.NewRequest(method, eurl, bodyContent(message))

	if err != nil {
		log.Fatalln(err)
	}

	req.SetBasicAuth(c.user, c.pass)
	req.Header.Set("Content-Type", "application/json; charset=utf-8")

	return c.httpClient.Do(req)
}

// concatenates flow endpoint with flow server address in a string
func genurl(address, endpoint string) string {
	return strings.Join([]string{address, endpoint}, "/")
}

// bodyContent prepares map for put/post http requests
func bodyContent(message map[string]interface{}) *bytes.Buffer {
	represent, err := json.Marshal(message)

	if err != nil {
		log.Fatalln(err)
	}

	return bytes.NewBuffer(represent)
}
