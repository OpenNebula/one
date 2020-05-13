package goca

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"
)

// RESTClient for communicating with oneflow server
type RESTClient struct {
	user    string
	pass    string
	address string // oneflow server address, ie: http://localhost:2474

	httpClient *http.Client
}

// NewRESTClient Constructor
func NewRESTClient(conf FlowConfig) *RESTClient {
	return &RESTClient{
		user:    conf.user,
		pass:    conf.pass,
		address: conf.address,

		httpClient: http.DefaultClient,
	}
}

// FlowConfig holds OpenNebula connection information for the flow endpoint API
type FlowConfig struct {
	user    string
	pass    string
	address string // oneflow server address, ie: http://localhost:2474
}

// NewFlowConfig considering environment variables and such
func NewFlowConfig(fuser, fpass, fURL string) FlowConfig {
	// 1 - ONEFLOW_URL, ONEFLOW_USER and ONEFLOW_PASSWORD
	// 2 - ONE_AUTH
	// 3 - ~/.one/one_auth

	var conf FlowConfig

	if fURL == "" {
		conf.address = os.Getenv("ONEFLOW_URL")

		if conf.address == "" {
			conf.address = "http://localhost:2474"
		}
	} else {
		conf.address = fURL
	}

	if fuser == "" && fpass == "" {
		oneAuthPath := os.Getenv("ONE_AUTH")
		if oneAuthPath == "" {
			oneAuthPath = os.Getenv("HOME") + "/.one/one_auth"
		}

		oneAuth, err := ioutil.ReadFile(oneAuthPath)
		var auth string

		if err == nil {
			auth = string(oneAuth)
		} else {
			log.Fatalln(err)
		}

		credentials := strings.Split(auth, ":")

		conf.user = credentials[0]
		conf.pass = credentials[1]

	} else {
		conf.user = fuser
		conf.pass = fpass
	}

	return conf
}

// NewHTTPResponse Creates Response from flow http response
func NewHTTPResponse(r *http.Response, e error) (*Response, error) {
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
		r, e = c.Get(string(url))
	case "DELETE":
		r, e = c.Delete(string(url))
	case "POST":
		r, e = c.Post(string(url), args[1].(map[string]interface{}))
	case "PUT":
		r, e = c.Put(string(url), args[1].(map[string]interface{}))
	case "":
		return &Response{}, e
	}

	return r, e
}

// HTTP METHODS
// The url passed to the methods is the follow up to the endpoint
// ex. use service instead of  http://localhost:2474/service

// Get http
func (c *RESTClient) Get(eurl string) (*Response, error) {
	url := genurl(c.address, eurl)

	return NewHTTPResponse(httpReq(c, "GET", url, nil))
}

// Delete http
func (c *RESTClient) Delete(eurl string) (*Response, error) {
	url := genurl(c.address, eurl)

	return NewHTTPResponse(httpReq(c, "DELETE", url, nil))
}

// Post http
func (c *RESTClient) Post(eurl string, message map[string]interface{}) (*Response, error) {
	url := genurl(c.address, eurl)

	return NewHTTPResponse(httpReq(c, "POST", url, message))

}

// Put http
func (c *RESTClient) Put(eurl string, message map[string]interface{}) (*Response, error) {
	url := genurl(c.address, eurl)

	return NewHTTPResponse(httpReq(c, "PUT", url, message))

}

// BodyMap accesses the body of the response and returns it as a map
func (r *Response) BodyMap() map[string]interface{} {
	var bodyMap map[string]interface{}

	if err := json.Unmarshal([]byte(r.body), &bodyMap); err != nil {
		panic(err)
	}

	return bodyMap
}

// Btomap returns http body as map
func bodyToMap(response *http.Response) map[string]interface{} {
	var result map[string]interface{}

	json.NewDecoder(response.Body).Decode(&result)

	return result
}

// Btostr returns http body as string
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

// BodyContent prepares map for put/post http requests
func bodyContent(message map[string]interface{}) *bytes.Buffer {
	represent, err := json.Marshal(message)

	if err != nil {
		log.Fatalln(err)
	}

	return bytes.NewBuffer(represent)
}
