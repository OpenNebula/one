package client

import (
	"bytes"
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// Client for communicating with oneflow server
type Client struct {
	user    string
	pass    string
	address string // oneflow server address, ie: http://localhost:2474

	httpClient *http.Client
}

// NewClient Constructor
func NewClient(conf Config) *Client {
	return &Client{
		user:       conf.user,
		pass:       conf.pass,
		address:    conf.address,
		httpClient: http.DefaultClient,
	}
}

// HTTP METHODS
// The url passed to the methods is the follow up to the endpoint
// ex. use service instead of  http://localhost:2474/service

// Get http
func (c *Client) Get(eurl string) *Response {
	url := genurl(c.address, eurl)

	return NewResponse(httpReq(c, "GET", url, nil))

}

// Delete http
func (c *Client) Delete(eurl string) *Response {
	url := genurl(c.address, eurl)

	return NewResponse(httpReq(c, "DELETE", url, nil))

}

// Post http
func (c *Client) Post(eurl string, message map[string]interface{}) *Response {
	url := genurl(c.address, eurl)

	return NewResponse(httpReq(c, "POST", url, message))

}

// Put http
func (c *Client) Put(eurl string, message map[string]interface{}) *Response {
	url := genurl(c.address, eurl)

	return NewResponse(httpReq(c, "PUT", url, message))

}

// General http request method for the c.
func httpReq(c *Client, method string, eurl string, message map[string]interface{}) (*http.Response, error) {
	req, err := http.NewRequest(method, eurl, bodyContent(message))

	if err != nil {
		log.Fatalln(err)
	}

	req.SetBasicAuth(c.user, c.pass)
	req.Header.Set("Content-Type", "application/json; charset=utf-8")

	return c.httpClient.Do(req)
}

// HELPERS

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
