package httpclient

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
)

// Client for oned connection
type Client struct {
	User    string
	Pass    string
	Address string // oneflow server address, ie: http://localhost:2474
}

// HTTP METHODS
// The url passed to the methods is the follow up to the endpoint
// ex. use service instead of  http://localhost:2474/service

// Get http
func Get(client Client, endpoint string) *http.Response {
	return httpReq(genurl(client.Address, endpoint), client.User, client.Pass, "GET", nil)
}

// Delete http
func Delete(client Client, endpoint string) *http.Response {
	return httpReq(genurl(client.Address, endpoint), client.User, client.Pass, "DELETE", nil)
}

// Post http
func Post(client Client, endpoint string, message map[string]interface{}) *http.Response {
	return httpReq(genurl(client.Address, endpoint), client.User, client.Pass, "POST", message)
}

// Put http
func Put(client Client, endpoint string, message map[string]interface{}) *http.Response {
	return httpReq(genurl(client.Address, endpoint), client.User, client.Pass, "PUT", message)
}

// General http request method for the client.
func httpReq(url string, user string, password string, method string, message map[string]interface{}) *http.Response {
	req, err := http.NewRequest(method, url, bodyContent(message))

	if err != nil {
		log.Fatalln(err)
	}

	req.SetBasicAuth(user, password)
	req.Header.Set("Content-Type", "application/json; charset=utf-8")

	resp, err := http.DefaultClient.Do(req)

	if err != nil {
		log.Fatalln(err)
	}

	return resp
}

// HELPERS

// concatenates flow endpoint with flow server address in a string
func genurl(address, endpoint string) string {
	return strings.Join([]string{address, endpoint}, "/")
}

// Btomap returns http body as map
func Btomap(resp *http.Response) map[string]interface{} {
	var result map[string]interface{}

	json.NewDecoder(resp.Body).Decode(&result)

	return result
}

// Btostr returns http body as string
func Btostr(response *http.Response) string {
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Fatalln(err)
	}

	return string(body)
}

// BodyContent prepares map for put/post http requests
func bodyContent(message map[string]interface{}) *bytes.Buffer {
	represent, err := json.Marshal(message)

	if err != nil {
		log.Fatalln(err)
	}

	return bytes.NewBuffer(represent)
}
