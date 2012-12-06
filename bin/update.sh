#!/bin/bash
# ------------------
# UNDP Update Script
# ------------------

echo "Starting update process..."
# Run the python script to process and produce the API JSON files
python undp-process.py

# Run a zip command to update the zipped download file with new data
cd download/undp_export
zip ../../../download/undp-project-data.zip report_projects.csv report_units.csv donor_gross.csv donor_local.csv report_documents.csv report_donors.csv report_outputs.csv 

