package goca

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
)

// rESTClient for communicating with oneflow server
type RESTClient struct {
	user    string
	pass    string
	address string // oneflow server address, ie: http://localhost:2474

	httpClient *http.Client
}

// HTTPAuth holds credentials for a server address
type HTTPAuth struct {
	user    string
	pass    string
	address string // oneflow server address, ie: http://localhost:2474
}

// newHTTPResponse Creates Response from http response
func newHTTPResponse(r *http.Response, e error) (*Response, error) {
	if e != nil {
		return &Response{}, e
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
	var e error
	var response Response
	r := &response

	switch method {
	case "GET":
		r, e = c.get(string(url))
	case "DELETE":
		r, e = c.delete(string(url))
	case "POST":
		r, e = c.post(string(url), args[1].(map[string]interface{}))
	case "PUT":
		r, e = c.put(string(url), args[1].(map[string]interface{}))
	case "":
		return &Response{}, e
	}

	return r, e
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
