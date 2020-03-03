package httpclient

import (
	"bytes"
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
)

// ONE connection information
type Auth struct {
	User string
	Pass string
	Oned string
}

// TODO: Use Auth struct on methods
// HTTP METHODS

// Get http
func Get(url, user, password string) *http.Response {
	return httpReq(url, user, password, "GET", nil)
}

// Delete http
func Delete(url, user, password string) *http.Response {
	return httpReq(url, user, password, "DELETE", nil)
}

// Post http
func Post(url string, user string, password string, message map[string]interface{}) *http.Response {
	return httpReq(url, user, password, "POST", message)
}

// Put http
func Put(url string, user string, password string, message map[string]interface{}) *http.Response {
	return httpReq(url, user, password, "PUT", message)
}

// General http request method for the client. Uses auth by default
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
