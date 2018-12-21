package goca

import (
	"fmt"
	"io/ioutil"
	"os"
	"strings"

	"github.com/kolo/xmlrpc"
)

var (
	client *oneClient
)

// OneClientErrCode is the error code from the OpenNebula response
type OneClientErrCode int

const (
	// OneSuccess code for a successful response
	OneSuccess             = 0x0000

	// OneAuthenticationError code if the user could not be authenticated
	OneAuthenticationError = 0x0100

	// OneAuthorizationError code if the user is not authorized to perform the requested action
	OneAuthorizationError  = 0x0200

	// OneNoExistsError code if the requested resource does not exist
	OneNoExistsError       = 0x0400

	// OneActionError code if the state is wrong to perform the action
	OneActionError         = 0x0800

	// OneXmlRpcApiError code if there is wrong parameter passed, e.g. param should be -1 or -2, but -3 was received
	OneXMLRPCAPIError      = 0x1000

	// OneInteralError code if there is an internal error, e.g. the resource could not be loaded from the DB
	OneInteralError        = 0x2000
)

func (s OneClientErrCode) String() string {
	switch s {
	case OneSuccess:
		return "SUCCESS"
	case OneAuthenticationError:
		return "AUTHENTICATION"
	case OneAuthorizationError:
		return "AUTHORIZATION"
	case OneNoExistsError:
		return "NO_EXISTS"
	case OneActionError:
		return "ACTION"
	case OneXMLRPCAPIError:
		return "XML_RPC_API"
	case OneInteralError:
		return "INTERNAL"
	default:
		return ""
	}
}

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
	xmlRpcErr error
}

func (r *InitError) Error() string {
	return fmt.Sprintf("Unitialized client. Token: '%s', xmlrpcClientError: '%s'", r.token, r.xmlRpcErr)
}

type BadResponseError struct {
	expectedType string
}

func (r *BadResponseError) Error() string {
	return fmt.Sprintf("Unexpected XML-RPC response, Expected: %s", r.expectedType)
}

// ResponseError contains the error datas from an OpenNebula error reponse
type ResponseError struct {
	Code OneClientErrCode
	msg  string
}

func (e *ResponseError) Error() string {
	return fmt.Sprintf("%s (%s)", e.msg, e.Code.String())
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
		errCode  int64
	)

	if c.xmlrpcClientError != nil {
		return nil, &InitError{token: c.token, xmlRpcErr: c.xmlrpcClientError}
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
		return nil, &BadResponseError{expectedType: "Index 0: Boolean"}
	}

	body, ok = result[1].(string)
	if ok == false {
		bodyInt, ok = result[1].(int64)
		if ok == false {
			bodyBool, ok = result[1].(bool)
			if ok == false {
				return nil, &BadResponseError{expectedType: "Index 1: Int or String"}
			}
		}
	}

	errCode, ok = result[2].(int64)
	if ok == false {
		return nil, &BadResponseError{expectedType: "Index 2: Int"}
	}

	if status == false {
		return nil, &ResponseError{Code: OneClientErrCode(errCode), msg: body}
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
