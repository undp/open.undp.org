# Main Setting Files

import os

# Project base directory
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '../'))

DATA = BASE_DIR + '/scripts/data'
UNDP_EXPORT = DATA + '/download/undp_export'
IATI_XML_ANNUAL = UNDP_EXPORT + '/iati-xml-annual'
DONOR_DATA = DATA + '/donor_date'
HDI = DATA + '/hdi'
PROCESS_FILES = DATA + '/process_files'


COUNTRY_DONORS = UNDP_EXPORT + '/country_donors_updated.csv'
REPORT_DONORS = UNDP_EXPORT + '/report_donors.csv'

API_PATH = BASE_DIR + '/api'

DONOR_ARRAY_INDEX = [
    {"id": "OTH", "name": "Others"},
    {"id": "MULTI_AGY", "name": "Multi-lateral Agency"}
]  # Previously called dctry_index
