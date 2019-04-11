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

package goca

import (
	"fmt"
	"strings"
)

// DynTemplate represents an OpenNebula syntax template
type DynTemplate struct {
	elements []DynTemplateElement
}

// DynTemplateElement is an interface that must implement the String
// function
type DynTemplateElement interface {
	String() string
	Key() string
}

// DynTemplatePair is a key / value pair
type DynTemplatePair struct {
	key   string
	Value string
}

// DynTemplateVector contains an array of keyvalue pairs
type DynTemplateVector struct {
	key   string
	pairs []DynTemplatePair
}

// Key return the pair key
func (t *DynTemplatePair) Key() string { return t.key }

// Key return the vector key
func (t *DynTemplateVector) Key() string { return t.key }

// NewDynTemplate returns a new DynTemplate object
func NewDynTemplate() *DynTemplate {
	return &DynTemplate{}
}

// NewVector creates a new vector in the template
func (t *DynTemplate) NewVector(key string) *DynTemplateVector {
	vector := &DynTemplateVector{key: key}
	t.elements = append(t.elements, vector)
	return vector
}

// String prints the DynTemplate in OpenNebula syntax
func (t *DynTemplate) String() string {
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

// String prints a DynTemplatePair in OpenNebula syntax
func (t *DynTemplatePair) String() string {
	return fmt.Sprintf("%s=\"%s\"", t.key, t.Value)
}

func (t *DynTemplateVector) String() string {
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

// AddPair adds a new pair to a DynTemplate objects
func (t *DynTemplate) AddPair(key string, v interface{}) error {
	var val string

	switch v := v.(type) {
	default:
		return fmt.Errorf("Unexpected type")
	case int, uint:
		val = fmt.Sprintf("%d", v)
	case string:
		val = v
	}

	pair := &DynTemplatePair{strings.ToUpper(key), val}
	t.elements = append(t.elements, pair)

	return nil
}

// AddPair adds a new pair to a DynTemplateVector
func (t *DynTemplateVector) AddPair(key string, v interface{}) error {
	var val string

	switch v := v.(type) {
	default:
		return fmt.Errorf("Unexpected type")
	case int, uint:
		val = fmt.Sprintf("%d", v)
	case string:
		val = v
	}

	pair := DynTemplatePair{strings.ToUpper(key), val}
	t.pairs = append(t.pairs, pair)

	return nil
}

// AppendTemplate append the src vector content, the pairs
func (t *DynTemplate) AppendTemplate(src *DynTemplate) {
	t.elements = append(t.elements, src.elements...)
}

// AppendPairs append the src vector content, the pairs
func (t *DynTemplateVector) AppendPairs(src *DynTemplateVector) {
	t.pairs = append(t.pairs, src.pairs...)
}

// Delete remove an element from DynTemplate objects
func (t *DynTemplate) DelElement(key string) {
	for i := 0; i < len(t.elements); i++ {
		if t.elements[i].Key() != key {
			continue
		}
		t.elements = append(t.elements[:i], t.elements[i+1:]...)
	}
}

// Delete remove a pair from DynTemplateVector
func (t *DynTemplateVector) DelValue(key string) {
	for i := 0; i < len(t.pairs); i++ {
		if t.pairs[i].Key() != key {
			continue
		}
		t.pairs = append(t.pairs[:i], t.pairs[i+1:]...)
	}
}
