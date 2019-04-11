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
	"encoding/xml"
	"fmt"
	"io"
)

// xmlTag contains the tag informations
type xmlTag struct {
	XMLName xml.Name
	Content string `xml:",chardata"`
}

// UnmarshalXML parse dynamically templates
func (t *DynTemplate) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	var templateEl DynTemplateElement
	var tVec *DynTemplateVector
	var e xmlTag

	for {

		// Look at next element
		token, err := d.Token()
		if err != nil {
			if err.Error() == io.EOF.Error() {
				break
			}
			return err
		}

		// Check type to handle the nesting
		switch token.(type) {
		case xml.StartElement:
			// It's a vector

			// Create it at first time
			if tVec == nil {
				tVec = &DynTemplateVector{
					key:   start.Name.Local,
					pairs: make([]DynTemplatePair, 0),
				}
			}

			// Decode pair and add it to the vec
			startEl, _ := token.(xml.StartElement)
			err := d.DecodeElement(&e, &startEl)
			if err != nil {
				return err
			}
			tVec.pairs = append(tVec.pairs, DynTemplatePair{key: e.XMLName.Local, Value: e.Content})

			templateEl = tVec
		case xml.CharData:
			// It's a Pair
			val, _ := token.(xml.CharData)
			templateEl = &DynTemplatePair{key: start.Name.Local, Value: string(val)}
		}
	}

	t.elements = append(t.elements, templateEl)

	return nil
}

// UnmarshalXML parse dynamically templates vector
func (t *DynTemplateVector) UnmarshalXML(d *xml.Decoder, start xml.StartElement) error {
	t.key = start.Name.Local
	t.pairs = make([]DynTemplatePair, 0)

	var e xmlTag
	for {
		// Look at next element
		token, err := d.Token()
		if err != nil {
			if err.Error() == io.EOF.Error() {
				break
			}
			return err
		}

		// Decode pair from start element
		startEl, ok := token.(xml.StartElement)
		if !ok {
			continue
		}
		err = d.DecodeElement(&e, &startEl)
		if err != nil {
			return err
		}
		t.pairs = append(t.pairs, DynTemplatePair{key: e.XMLName.Local, Value: e.Content})
	}

	return nil
}

// GetPair retrieve a unique pair by key. Fail if not found or several instances
func (t *DynTemplate) GetPair(key string) (*DynTemplatePair, error) {
	var pair *DynTemplatePair
	match := false
	for _, e := range t.elements {
		p, ok := e.(*DynTemplatePair)
		if !ok || p.key != key {
			continue
		}
		if match == true {
			return nil, fmt.Errorf("GetPair: multiple entries with key %s", key)
		}
		pair = p
		match = true
	}
	if match == false {
		return nil, fmt.Errorf("GetPair: tag %s not found", key)
	}
	return pair, nil
}

// GetPair retrieve a unique pair by key. Fail if not found or several instances
func (t *DynTemplateVector) GetPair(key string) (*DynTemplatePair, error) {
	var pair *DynTemplatePair
	match := false
	for i := 0; i < len(t.pairs); i++ {
		if t.pairs[i].key != key {
			continue
		}
		if match == true {
			return nil, fmt.Errorf("GetPair: multiple entries with key %s", key)
		}
		pair = &t.pairs[i]
		match = true
	}
	if match == false {
		return nil, fmt.Errorf("GetPair: tag %s not found", key)
	}
	return pair, nil
}

// GetVector retrieve a unique vector by key. Fail if not found or several instances
func (t *DynTemplate) GetVector(key string) (*DynTemplateVector, error) {
	var vector *DynTemplateVector
	match := false
	for _, e := range t.elements {
		vec, ok := e.(*DynTemplateVector)
		if !ok || vec.key != key {
			continue
		}
		if match == true {
			return nil, fmt.Errorf("GetVec: multiple entries with key %s", key)
		}
		vector = vec
		match = true
	}
	if match == false {
		return nil, fmt.Errorf("GetVec: tag %s not found", key)
	}
	return vector, nil
}

// GetPairs retrieve a list of pairs by key.
func (t *DynTemplate) GetPairs(key string) []DynTemplatePair {
	pairs := make([]DynTemplatePair, 0)
	for _, e := range t.elements {
		pair, ok := e.(*DynTemplatePair)
		if !ok || pair.key != key {
			continue
		}
		pairs = append(pairs, *pair)
	}
	return pairs
}

// GetPairs retrieve a list of pairs by key.
func (t *DynTemplateVector) GetPairs(key string) []DynTemplatePair {
	pairs := make([]DynTemplatePair, 0)
	for _, p := range t.pairs {
		if p.key != key {
			continue
		}
		pairs = append(pairs, p)
	}
	return pairs
}

// GetVectors retrieve a list of vectors by key.
func (t *DynTemplate) GetVectors(key string) []DynTemplateVector {
	vectors := make([]DynTemplateVector, 0)
	for _, e := range t.elements {
		vec, ok := e.(*DynTemplateVector)
		if !ok || vec.key != key {
			continue
		}
		vectors = append(vectors, *vec)
	}
	return vectors
}
