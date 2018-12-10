package goca

import (
	"errors"
	"fmt"
	"io/ioutil"
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
	token             string
	xmlrpcClient      *xmlrpc.Client
	xmlrpcClientError error
}

type InitError struct {
	token     string
	xmlRpcErr string
}

func (r *InitError) Error() string {
	return fmt.Sprintf("Unitialized client. Token: '%s', xmlrpcClientError: '%s'", r.token, r.xmlRpcErr)
}

type BadResponseError struct {
	ExpectedType string
}

func (r *BadResponseError) Error() string {
	return fmt.Sprintf("Unexpected XML-RPC response, Expected: %s", r.ExpectedType)
}

type response struct {
	status   bool
	body     string
	bodyInt  int
	bodyBool bool
}

// Resource implements an OpenNebula Resource methods. *XMLResource implements
// all these methods
type Resource interface {
	Body() string
	XPath(string) (string, bool)
	XPathIter(string) *XMLIter
	GetIDFromName(string, string) (uint, error)
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

	xmlrpcClient, xmlrpcClientError := xmlrpc.NewClient(conf.XmlrpcURL, nil)

	client = &oneClient{
		token:             conf.Token,
		xmlrpcClient:      xmlrpcClient,
		xmlrpcClientError: xmlrpcClientError,
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
	var (
		ok bool

		status  bool
		body    string
		bodyInt int64
		bodyBool bool
	)

	if c.xmlrpcClientError != nil {
		return nil, InitError{Token: c.token, xmlrpcErr: c.xmlrpcClientError}
	}

	result := []interface{}{}

	xmlArgs := make([]interface{}, len(args)+1)

	xmlArgs[0] = c.token
	copy(xmlArgs[1:], args[:])

	err := c.xmlrpcClient.Call(method, xmlArgs, &result)
	if err != nil {
		return nil, err
	}

	status, ok = result[0].(bool)
	if ok == false {
		return nil, BadResponseError{ExpectedType: "Index 0: Boolean"}
	}

	body, ok = result[1].(string)
	if ok == false {
		bodyInt, ok = result[1].(int64)
		if ok == false {
			bodyBool, ok = result[1].(bool)
			if ok == false {
				return nil, BadResponseError{ExpectedType: "Index 1: Int or String"}
			}
		}
	}

	// TODO: errCode? result[2]

	r := &response{status, body, int(bodyInt), bodyBool}

	if status == false {
		err = errors.New(body)
	}

	return r, err
}

// Body accesses the body of the response
func (r *response) Body() string {
	return r.body
}

// BodyInt accesses the body of the response, if it's an int.
func (r *response) BodyInt() int {
	return r.bodyInt
}
