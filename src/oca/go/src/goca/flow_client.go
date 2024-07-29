/* -------------------------------------------------------------------------- */
/* Copyright 2002-2024, OpenNebula Project, OpenNebula Systems                */
/*                                                                            */
/* Licensed under the Apache License, Version 2.0 (the "License"); you may    */
/* not use this file except in compliance with the License. You may obtain    */
/* a copy of the License at                                                   */
/*                                                                            */
/* http://www.apache.org/licenses/LICENSE-2.0                                 */
/*                                                                            */
/* Unless required by applicable law or agreed to in writing, software        */
/* distributed under the License is distributed on an "AS IS" BASIS,          */
/* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.   */
/* See the License for the specific language governing permissions and        */
/* limitations under the License.                                             */
/*--------------------------------------------------------------------------- */

package goca

import (
	"bufio"
	"log"
	"net/http"
	"os"
	"strings"

	cleanhttp "github.com/hashicorp/go-cleanhttp"
)

// NewDefaultFlowClient return a basic RESTClient with flow information
func NewDefaultFlowClient(conf HTTPAuth) *RESTClient {
	return &RESTClient{
		user:       conf.user,
		pass:       conf.pass,
		address:    conf.address,
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
		user:       conf.user,
		pass:       conf.pass,
		address:    conf.address,
		httpClient: httpClient,
	}
}

// NewFlowConfig returns a new HTTPAuth object with the specified user, password,
// and endpoint.
func NewFlowConfig(user, password, endpoint string) HTTPAuth {
	var conf HTTPAuth

	if user == "" && password == "" {
		oneAuthPath := os.Getenv("ONE_AUTH")
		if oneAuthPath == "" {
			oneAuthPath = os.Getenv("HOME") + "/.one/one_auth"
		}

		file, err := os.Open(oneAuthPath)
		if err != nil {
			log.Fatalln(err)
		}
		defer file.Close()

		scanner := bufio.NewScanner(file)

		scanner.Scan()
		if scanner.Err() != nil {
			log.Fatalln(scanner.Err())
		}

		parts := strings.Split(scanner.Text(), ":")
		if len(parts) != 2 {
			log.Fatalln("unable to parse credentials")
		}

		conf.user = parts[0]
		conf.pass = parts[1]

	} else {
		conf.user = user
		conf.pass = password
	}

	if endpoint == "" {
		conf.address = os.Getenv("ONEFLOW_URL")
		if conf.address == "" {
			conf.address = "http://localhost:2474"
		}
	} else {
		conf.address = endpoint
	}

	return conf
}
