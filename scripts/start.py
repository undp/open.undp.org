# ------------------------------------------
# This script organizes generates all the necessary json and js files for the opne.undp.org website
# ------------------------------------------
# This script runs Python commands to create the JSON API.
# Requirements: Python 2.7 or greater
# Before running the script make sure to install the requiremensts by running:
# pip install requirements.txt

import time

from generators.generator import ProjectsController
from generators.donors import donors
import generators.config as config

if __name__ == '__main__':

    # Make sure API folder and its subfolders are created
    config.check_create_folder(config.API_PATH)
    config.check_create_folder(config.API_PATH + '/projects')
    config.check_create_folder(config.API_PATH + '/units')
    config.check_create_folder(config.API_PATH + '/donors')

    start = time.time()
    p = ProjectsController()

    p.generate()
    # Generate modality data
    donors()

    end = time.time()

    print 'Time spent : %s seconds' % (end - start)
