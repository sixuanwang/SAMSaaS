# -*- coding: utf-8 -*-

# Copyright (c) 2013-2014 CoNWeT Lab., Universidad Politécnica de Madrid

# This file is part of Wirecloud.

# Wirecloud is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# Wirecloud is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with Wirecloud.  If not, see <http://www.gnu.org/licenses/>.

from __future__ import unicode_literals

import regex
from six import text_type

from django.utils.encoding import python_2_unicode_compatible


__all__ = ('is_valid_name', 'is_valid_vendor', 'is_valid_version')


SEPARATOR_RE = regex.compile(r'\s*,\s*')
NAME_RE = regex.compile(r'^[^/]+$')
VENDOR_RE = regex.compile(r'^[^/]+$')
VERSION_RE = regex.compile(r'^(?:[1-9]\d*\.|0\.)*(?:[1-9]\d*|0)(?:(?:a|b|rc)[1-9]\d*)?$')
CONTACT_RE = regex.compile(r'([^<(\s]+(?:\s+[^<()\s]+)*)(?:\s*<([^>]*)>)?(?:\s*\(([^)]*)\))?')


@python_2_unicode_compatible
class TemplateParseException(Exception):

    def __init__(self, msg):
        self.msg = msg

    def __str__(self):
        return text_type(self.msg)


@python_2_unicode_compatible
class UnsupportedFeature(Exception):

    def __init__(self, msg):
        self.msg = msg

    def __str__(self):
        return text_type(self.msg)


def is_valid_name(name):

    return regex.match(NAME_RE, name)


def is_valid_vendor(vendor):

    return regex.match(VENDOR_RE, vendor)


def is_valid_version(version):

    return regex.match(VERSION_RE, version)


def parse_contact_info(text):
    result = regex.match(CONTACT_RE, text)
    if result is None:
        return {'name': ''}

    contact = {'name': result[1]}

    if result[2] is not None:
        contact['email'] = result[2]

    if result[3] is not None:
        contact['url'] = result[3]

    return contact


def parse_contacts_info(info):

    contacts = []

    if isinstance(info, text_type):
        info = regex.split(SEPARATOR_RE, info)

    for contact in info:
        if isinstance(contact, text_type):
            contact = parse_contact_info(contact)

        if contact.get('name', '') != '':
            contacts.append(contact)

    return contacts


def stringify_contact(contact):

    contact_string = contact['name']

    if 'email' in contact:
        contact_string += ' <' + contact['email'] + '>'

    if 'url' in contact:
        contact_string += ' (' + contact['url'] + ')'

    return contact_string


def stringify_contact_info(contacts):

    return ', '.join([stringify_contact(contact) for contact in contacts])
