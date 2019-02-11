package goca

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"

	"github.com/kolo/xmlrpc"
)

var (
	client *oneClient
)

// OneConfig contains the information to communicate with OpenNebula
type OneConfig struct {
	// Token is the authentication string. In the format of <user>:<password>
	Token string

	// XmlrpcURL contains OpenNebula's XML-RPC API endpoint. Defaults to
	// http://localhost:2633/RPC2
	XmlrpcURL string
}

type oneClient struct {
	url               string
	token             string
	httpClient        *http.Client
}

type response struct {
	status   bool
	body     string
	bodyInt  int
	bodyBool bool
}

// Initializes the client variable, used as a singleton
func init() {
	SetClient(NewConfig("", "", ""))
}

// NewConfig returns a new OneConfig object with the specified user, password,
// and xmlrpcURL
func NewConfig(user string, password string, xmlrpcURL string) OneConfig {
	var authToken string
	var oneAuthPath string

	oneXmlrpc := xmlrpcURL

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
		Token:     authToken,
		XmlrpcURL: oneXmlrpc,
	}

	return config
}

// SetClient assigns a value to the client variable
func SetClient(conf OneConfig) {

	client = &oneClient{
		url:               conf.XmlrpcURL,
		token:             conf.Token,
		httpClient:        &http.Client{},
	}
}

// SystemVersion returns the current OpenNebula Version
func SystemVersion() (string, error) {
	response, err := client.Call("one.system.version")
	if err != nil {
		return "", err
	}

	return response.Body(), nil
}

// SystemConfig returns the current OpenNebula config
func SystemConfig() (string, error) {
	response, err := client.Call("one.system.config")
	if err != nil {
		return "", err
	}

	return response.Body(), nil
}

// Call is an XML-RPC wrapper. It returns a pointer to response and an error.
func (c *oneClient) Call(method string, args ...interface{}) (*response, error) {
	return c.endpointCall(c.url, method, args...)
}

func (c *oneClient) endpointCall(url string, method string, args ...interface{}) (*response, error) {
	var (
		ok bool

		status  bool
		body    string
		bodyInt int64
		bodyBool bool
		errCode  int64
	)

	xmlArgs := make([]interface{}, len(args)+1)

	xmlArgs[0] = c.token
	copy(xmlArgs[1:], args[:])

	buf, err := xmlrpc.EncodeMethodCall(method, xmlArgs...)
	if err != nil {
		return nil,
			&ClientError{Code: ClientReqBuild, msg: "xmlrpc request encoding", err: err}
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(buf))
	if err != nil {
		return nil,
			&ClientError{Code: ClientReqBuild, msg: "http request build", err: err}
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil,
			&ClientError{Code: ClientReqHTTP, msg: "http make request", err: err}
	}

	if resp.StatusCode/100 != 2 {
		return nil, &ClientError{
			Code:     ClientRespHTTP,
			msg:      fmt.Sprintf("http status code: %d", resp.StatusCode),
			httpResp: resp,
		}
	}

	respData, err := ioutil.ReadAll(resp.Body)
	resp.Body.Close()
	if err != nil {
		return nil,
			&ClientError{Code: ClientRespHTTP, msg: "read http response body", err: err}
	}

	// Server side XML-RPC library: xmlrpc-c
	xmlrpcResp := xmlrpc.NewResponse(respData)

	// Handle the <fault> tag in the xml server response
	if xmlrpcResp.Failed() {
		err = xmlrpcResp.Err()
		return nil,
			&ClientError{ClientRespXMLRPCFault, "server response", resp, err}
	}

	result := []interface{}{}

	// Unmarshall the XML-RPC response
	if err := xmlrpcResp.Unmarshal(&result); err != nil {
		return nil,
			&ClientError{ClientRespXMLRPCParse, "unmarshal xmlrpc", resp, err}
	}

	// Parse according the XML-RPC OpenNebula API documentation
	status, ok = result[0].(bool)
	if ok == false {
		return nil,
			&ClientError{ClientRespONeParse, "index 0: boolean expected", resp, err}
	}

	body, ok = result[1].(string)
	if ok == false {
		bodyInt, ok = result[1].(int64)
		if ok == false {
			bodyBool, ok = result[1].(bool)
			if ok == false {
				return nil,
					&ClientError{ClientRespONeParse, "index 1: boolean expected", resp, err}
			}
		}
	}

	errCode, ok = result[2].(int64)
	if ok == false {
		return nil,
			&ClientError{ClientRespONeParse, "index 2: boolean expected", resp, err}
	}

	if status == false {
		return nil, &ResponseError{
			Code: OneErrCode(errCode),
			msg:  body,
		}
	}

	r := &response{status, body, int(bodyInt), bodyBool}

	return r, nil
}

// Body accesses the body of the response
func (r *response) Body() string {
	return r.body
}

// BodyInt accesses the body of the response, if it's an int.
func (r *response) BodyInt() int {
	return r.bodyInt
}
