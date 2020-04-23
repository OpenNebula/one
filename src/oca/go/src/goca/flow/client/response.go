package client

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
)

// Response proccessed from an http response
type Response struct {
	StatusC      int
	Body         map[string]interface{}
	HTTPResponse http.Response
}

// NewResponse constructor
func NewResponse(response *http.Response, err error) *Response {
	return &Response{
		StatusC: response.StatusCode,
		Body:    boToMap(response),

		HTTPResponse: *response,
	}
}

// Btomap returns http body as map
func boToMap(resp *http.Response) map[string]interface{} {
	var result map[string]interface{}

	json.NewDecoder(resp.Body).Decode(&result)

	return result
}

// Btostr returns http body as string
func boToStr(response *http.Response) string {
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		log.Fatalln(err)
	}

	return string(body)
}
