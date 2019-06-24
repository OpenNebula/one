/* -------------------------------------------------------------------------- */
/* Copyright 2002-2019, OpenNebula Project, OpenNebula Systems                */
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

package dynamic

import (
	"errors"
	"fmt"
	"strings"
)

// TemplateBuilder represents an OpenNebula syntax template. There is no XML-RPC call done.
type TemplateBuilder struct {
	elements []TemplateBuilderElement
}

// TemplateBuilderElement is an interface that must implement the String
// function
type TemplateBuilderElement interface {
	String() string
}

// TemplateBuilderPair is a key / value pair
type TemplateBuilderPair struct {
	key   string
	value string
}

// TemplateBuilderVector contains an array of keyvalue pairs
type TemplateBuilderVector struct {
	key   string
	pairs []TemplateBuilderPair
}

// NewTemplateBuilder returns a new TemplateBuilder object
func NewTemplateBuilder() *TemplateBuilder {
	return &TemplateBuilder{}
}

// NewVector creates a new vector in the template
func (t *TemplateBuilder) NewVector(key string) *TemplateBuilderVector {
	vector := &TemplateBuilderVector{key: key}
	t.elements = append(t.elements, vector)
	return vector
}

// String prints the TemplateBuilder in OpenNebula syntax
func (t *TemplateBuilder) String() string {
	s := ""
	endToken := "\n"

	for i, element := range t.elements {
		if i == len(t.elements)-1 {
			endToken = ""
		}
		s += element.String() + endToken
	}

	return s
}

// String prints a TemplateBuilderPair in OpenNebula syntax
func (t *TemplateBuilderPair) String() string {
	return fmt.Sprintf("%s=\"%s\"", t.key, t.value)
}

func (t *TemplateBuilderVector) String() string {
	s := fmt.Sprintf("%s=[\n", strings.ToUpper(t.key))

	endToken := ",\n"
	for i, pair := range t.pairs {
		if i == len(t.pairs)-1 {
			endToken = ""
		}

		s += fmt.Sprintf("    %s%s", pair.String(), endToken)

	}
	s += " ]"

	return s
}

// AddValue adds a new pair to a TemplateBuilder objects
func (t *TemplateBuilder) AddValue(key string, v interface{}) error {
	var val string

	switch v := v.(type) {
	default:
		return errors.New("Unexpected type")
	case int, uint:
		val = fmt.Sprintf("%d", v)
	case string:
		val = v
	}

	pair := &TemplateBuilderPair{strings.ToUpper(key), val}
	t.elements = append(t.elements, pair)

	return nil
}

// AddValue adds a new pair to a TemplateBuilderVector
func (t *TemplateBuilderVector) AddValue(key string, v interface{}) error {
	var val string

	switch v := v.(type) {
	default:
		return errors.New("Unexpected type")
	case int, uint:
		val = fmt.Sprintf("%d", v)
	case string:
		val = v
	}

	pair := TemplateBuilderPair{strings.ToUpper(key), val}
	t.pairs = append(t.pairs, pair)

	return nil
}
