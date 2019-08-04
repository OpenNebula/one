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
	"encoding/xml"
	"fmt"
	"strconv"
	"strings"
)

// Template represents an OpenNebula syntax template
type Template struct {
	Elements []Element
}

// Element is an interface that must implement the String
// function
type Element interface {
	String() string
	Key() string
}

// Pair is a key / value pair
type Pair struct {
	XMLName xml.Name
	Value   string `xml:",innerxml"`
}

// Vector contains an array of keyvalue pairs
type Vector struct {
	XMLName xml.Name
	Pairs   []Pair
}

type TemplateAny struct {
	Template
}

// Key return the pair key
func (t *Pair) Key() string { return t.XMLName.Local }

// Key return the vector key
func (t *Vector) Key() string { return t.XMLName.Local }

// String prints the Template in OpenNebula syntax
func (t *Template) String() string {
	var s strings.Builder
	endToken := "\n"

	for i, element := range t.Elements {
		if i == len(t.Elements)-1 {
			endToken = ""
		}
		s.WriteString(element.String() + endToken)
	}

	return s.String()
}

// String prints a Pair in OpenNebula syntax
func (p *Pair) String() string {
	return fmt.Sprintf("%s=\"%s\"", p.XMLName.Local, p.Value)
}

func (v *Vector) String() string {
	s := fmt.Sprintf("%s=[\n", strings.ToUpper(v.XMLName.Local))

	endToken := ",\n"
	for i, pair := range v.Pairs {
		if i == len(v.Pairs)-1 {
			endToken = ""
		}

		s += fmt.Sprintf("    %s%s", pair.String(), endToken)

	}
	s += " ]"

	return s
}

// GetPair retrieve a pair by it's key
func (t *Template) GetPairs(key string) []*Pair {

	pairs := make([]*Pair, 0, 1)

	for i, _ := range t.Elements {

		pair, ok := t.Elements[i].(*Pair)
		if !ok {
			continue
		}

		if pair.XMLName.Local != key {
			continue
		}

		pairs = append(pairs, pair)
	}

	return pairs
}

// GetPair retrieve a pair by it's key
func (v *Vector) GetPairs(key string) []*Pair {

	pairs := make([]*Pair, 0, 1)

	for i, _ := range v.Pairs {

		if v.Pairs[i].XMLName.Local != key {
			continue
		}

		pairs = append(pairs, &v.Pairs[i])
	}

	return pairs
}

// GetPair retrieve a pair by key
func (t *Template) GetPair(key string) (*Pair, error) {

	pairs := t.GetPairs(key)
	switch len(pairs) {
	case 0:
		return nil, fmt.Errorf("Template GetPair: key %s not found", key)
	case 1:
		return pairs[0], nil
	}

	return nil, fmt.Errorf("Template GetPair: multiple key %s found", key)
}

// GetPair retrieve a pair by it's key
func (v *Vector) GetPair(key string) (*Pair, error) {

	pairs := v.GetPairs(key)
	switch len(pairs) {
	case 0:
		return nil, fmt.Errorf("Template GetPair: key %s not found", key)
	case 1:
		return pairs[0], nil
	}

	return nil, fmt.Errorf("Template GetPair: multiple key %s found", key)
}

// GetVectors retrieve slice of vectors by key
func (t *Template) GetVectors(key string) []*Vector {

	vecs := make([]*Vector, 0, 1)

	for i, _ := range t.Elements {

		vec, ok := t.Elements[i].(*Vector)
		if !ok {
			continue
		}

		if vec.XMLName.Local != key {
			continue
		}

		vecs = append(vecs, vec)
	}

	return vecs
}

// GetVector retrieve a vector by key
func (t *Template) GetVector(key string) (*Vector, error) {

	vectors := t.GetVectors(key)
	switch len(vectors) {
	case 0:
		return nil, fmt.Errorf("Template GetVector: key %s not found", key)
	case 1:
		return vectors[0], nil
	}

	return nil, fmt.Errorf("Template GetVector: multiple key %s found", key)
}

// GetStr allow to retrieve the value of a pair
func (t *Template) GetStr(key string) (string, error) {
	pair, err := t.GetPair(key)
	if err != nil {
		return "", err
	}
	return pair.Value, nil
}

// GetStr allow to retrieve the value of a pair
func (t *Vector) GetStr(key string) (string, error) {
	pair, err := t.GetPair(key)
	if err != nil {
		return "", err
	}
	return pair.Value, nil
}

// GetStrs allow to retrieve a slice of string from pairs with the same key
func (t *Template) GetStrs(key string) []string {

	pairs := t.GetPairs(key)
	strs := make([]string, len(pairs))

	for i, p := range pairs {
		strs[i] = p.Value
	}

	return strs
}

// GetStrs allow to retrieve a slice of string from pairs with the same key
func (v *Vector) GetStrs(key string) []string {

	pairs := v.GetPairs(key)
	strs := make([]string, len(pairs))

	for i, p := range pairs {
		strs[i] = p.Value
	}

	return strs
}

// GetInt returns a pair value as an int
func (t *Template) GetInt(key string) (int, error) {
	pair, err := t.GetPair(key)
	if err != nil {
		return -1, err
	}
	intVal, err := strconv.ParseInt(pair.Value, 10, 0)
	if err != nil {
		return -1, err
	}
	return int(intVal), nil
}

// GetInt returns a pair value as an int
func (t *Vector) GetInt(key string) (int, error) {

	pair, err := t.GetPair(key)
	if err != nil {
		return -1, err
	}
	intVal, err := strconv.ParseInt(pair.Value, 10, 0)
	if err != nil {
		return -1, err
	}
	return int(intVal), nil
}

// GetInts allow to retrieve a slice of int from pairs with the same key
func (t *Template) GetInts(key string) []int {

	pairs := t.GetPairs(key)
	ints := make([]int, 0, len(pairs))

	for _, p := range pairs {

		intVal, err := strconv.ParseInt(p.Value, 10, 0)
		if err != nil {
			continue
		}

		ints = append(ints, int(intVal))
	}

	return ints
}

// GetInts allow to retrieve a slice of int from pairs with the same key
func (v *Vector) GetInts(key string) []int {

	pairs := v.GetPairs(key)
	ints := make([]int, 0, len(pairs))

	for _, p := range pairs {

		intVal, err := strconv.ParseInt(p.Value, 10, 0)
		if err != nil {
			continue
		}

		ints = append(ints, int(intVal))
	}

	return ints
}

// GetFloat returns a pair value as an float
func (t *Template) GetFloat(key string) (float64, error) {
	pair, err := t.GetPair(key)
	if err != nil {
		return -1, err
	}
	id, err := strconv.ParseFloat(pair.Value, 64)
	if err != nil {
		return -1, err
	}
	return id, nil
}

// GetFloat returns a pair value as an float
func (t *Vector) GetFloat(key string) (float64, error) {
	pair, err := t.GetPair(key)
	if err != nil {
		return -1, err
	}
	id, err := strconv.ParseFloat(pair.Value, 64)
	if err != nil {
		return -1, err
	}
	return id, nil
}

// GetStrFromVec returns a pair value contained from a vector
func (t *Template) GetStrFromVec(vecKey, key string) (string, error) {
	vector, err := t.GetVector(vecKey)
	if err != nil {
		return "", err
	}
	pair, err := vector.GetPair(key)
	if err != nil {
		return "", err
	}
	return pair.Value, nil
}

//  template building

// NewTemplate returns a new Template object
func NewTemplate() *Template {
	return &Template{}
}

// AddVector creates a new vector in the template
func (t *Template) AddVector(key string) *Vector {
	vector := &Vector{XMLName: xml.Name{Local: key}}

	t.Elements = append(t.Elements, vector)
	return vector
}

// AddPair adds a new pair to a Template objects
func (t *Template) AddPair(key string, v interface{}) error {
	var val string

	switch v := v.(type) {
	default:
		return fmt.Errorf("AddPair: Unexpected type")
	case float32, float64:
		val = fmt.Sprintf("%f", v)
	case int, uint:
		val = fmt.Sprintf("%d", v)
	case string:
		val = v
	}

	pair := &Pair{XMLName: xml.Name{Local: strings.ToUpper(key)}, Value: val}
	t.Elements = append(t.Elements, pair)

	return nil
}

// AddPair adds a new pair to a Template
func (t *Vector) AddPair(key string, v interface{}) error {
	var val string

	switch v := v.(type) {
	default:
		return fmt.Errorf("AddPair: Unexpected type")
	case float32, float64:
		val = fmt.Sprintf("%f", v)
	case int, uint:
		val = fmt.Sprintf("%d", v)
	case string:
		val = v
	}

	pair := Pair{XMLName: xml.Name{Local: strings.ToUpper(key)}, Value: val}
	t.Pairs = append(t.Pairs, pair)

	return nil
}

func (t *Template) AddPairToVec(vecKey, key string, value interface{}) error {
	var vector *Vector

	vectors := t.GetVectors(vecKey)
	switch len(vectors) {
	case 0:
		vector = t.AddVector(vecKey)
	case 1:
		vector = vectors[0]
	default:
		return fmt.Errorf("Can't add pair to vector: multiple entries with key %s", key)
	}

	return vector.AddPair(key, value)
}

// Del remove an element from Template objects
func (t *Template) Del(key string) {
	for i := 0; i < len(t.Elements); i++ {
		if t.Elements[i].Key() != key {
			continue
		}
		t.Elements = append(t.Elements[:i], t.Elements[i+1:]...)
	}
}

// Del remove a pair from Template
func (t *Vector) Del(key string) {
	for i := 0; i < len(t.Pairs); i++ {
		if t.Pairs[i].XMLName.Local != key {
			continue
		}
		t.Pairs = append(t.Pairs[:i], t.Pairs[i+1:]...)
	}
}
