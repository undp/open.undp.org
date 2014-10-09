from __future__ import print_function

import os
import csv
import re
import sys
from itertools import groupby


class Controller(object):

    def log(self, message, inline=False):
        """ Print function with verbos twists """
        if inline:
            print(message, end='\r')
            sys.stdout.flush()
        else:
            print(message)

    def get_and_sort(self, csv_file, sort_key):
        """Receive a CSV file and return a sorted list based on the sort key

        Keyword arguments:
        csv_file -- full path to the CSV file
        sort_key -- the column sort the csv file based
        """
        output = csv.DictReader(open(csv_file, 'rU'),
                                delimiter=',',
                                quotechar='"')
        output = self.sort_by_key(output, sort_key)

        return output

    def sort_by_key(self, obj, key):
        """Sort dict based on a provided key

        Keyword arguments:
        obj -- the dictionary object
        key -- the dict key
        """
        return sorted(obj, key=lambda x: x[key])

    def sort_by_2_keys(self, obj, key1, key2):
        """Sort dict based on two keys

        Keyword arguments:
        obj -- the dictionary object
        key1 -- the first dict key
        key2 -- the second dict key
        """
        return sorted(obj, key=lambda x: (x[key1], x[key2]))

    def group_by_key(self, obj, key):
        """Sort dict based on a provided key

        Keyword arguments:
        obj -- the dictionary object
        key -- the dict key
        """
        return groupby(obj, lambda x: x[key])

    def get_filenames(self, path, ext=None):
        """The function extracts filenames in a directory
        If the extension is provided, only the files with the specified
        extension are returned

        Arguments:
        path -- Full path of the directory e.g. /path/to/file
        ext -- the file extension, e.g. xml
        """

        for fn in os.listdir(path):
            if ext:
                # If extension does not start with a dot, add one
                if re.search('^\.', ext) is None:
                    ext = '.' + ext
                return [path + '/' + fn for fn in os.listdir(path)
                        if fn.endswith(ext)]
            else:
                return [path + '/' + fn for fn in os.listdir(path)]
