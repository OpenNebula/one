package goca

import (
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strings"

	cleanhttp "github.com/hashicorp/go-cleanhttp"
)

// NewDefaultFlowClient return a basic RESTClient with flow information
func NewDefaultFlowClient(conf HTTPAuth) *RESTClient {
	return &RESTClient{
		user:    conf.user,
		pass:    conf.pass,
		address: conf.address,
		httpClient: cleanhttp.DefaultPooledClient(),
	}
}

// NewFlowClient return a RESTClient with flow information that allows setting a
// custom http.Client. If the httpClient is nil, it will return a NewDefaultFlowClient
func NewFlowClient(conf HTTPAuth, httpClient *http.Client) *RESTClient {
	if httpClient == nil {
		return NewDefaultFlowClient(conf)
	}
	return &RESTClient{
		user:    conf.user,
		pass:    conf.pass,
		address: conf.address,
		httpClient: httpClient,
	}
}

// NewFlowConfig considering environment variables and such
func NewFlowConfig(fuser, fpass, fURL string) HTTPAuth {
	// 1 - ONEFLOW_URL, ONEFLOW_USER and ONEFLOW_PASSWORD
	// 2 - ONE_AUTH
	// 3 - ~/.one/one_auth

	var conf HTTPAuth

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



