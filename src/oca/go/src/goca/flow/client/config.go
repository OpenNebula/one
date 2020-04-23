package client

import (
	"io/ioutil"
	"log"
	"os"
	"strings"
)

// Config holds OpenNebula connection information for the flow client
type Config struct {
	user    string
	pass    string
	address string // oneflow server address, ie: http://localhost:2474
}

// NewConfig considering environment variables and such
func NewConfig(fuser, fpass, fUrl string) Config {
	// 1 - ONEFLOW_URL, ONEFLOW_USER and ONEFLOW_PASSWORD
	// 2 - ONE_AUTH
	// 3 - ~/.one/one_auth

	var conf Config

	if fUrl == "" {
		conf.address = os.Getenv("ONEFLOW_URL")

		if conf.address == "" {
			conf.address = "http://localhost:2474"
		}
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
