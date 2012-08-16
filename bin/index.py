###################################################
# Process and generate summary and index json files
###################################################
import csv, sys, json

##########################
# Process Project Summary File
# Open file
project_summary = csv.DictReader(open('temp-csv/undp-project-summary.csv', 'rb'), delimiter = ',', quotechar = '"')

# Sort on project id
project_sort = sorted(project_summary, key = lambda x: x['id'])

print "Processing..."
project_list = []
row_count = 0
for pval in iter(project_sort):
    row_count = row_count + 1
    project = {
        "budget": float(pval['budget']),
        "crs": pval['crs'],
        "donors": pval['donors'].split(','),
        "expenditure": float(pval['expenditure']),
        "focus_area": pval['focus_area'],
        "id": pval['id'],
        "name": pval['name'],
        "operating_unit": pval['operating_unit'],
        "outcome": pval['outcome'],
        "region": pval['region']
    }
    project_list.append(project)

print "Processed %d rows" % row_count

summary_writeout = json.dumps(project_list, sort_keys=True, indent=4)
summary_out = open('../api/project_summary.json', 'wb')
summary_out.writelines(summary_writeout)
summary_out.close()


##########################
# Process Region index
# Open file
regions = csv.DictReader(open('temp-csv/undp-regions-index.csv', 'rb'), delimiter = ',', quotechar = '"')

regions_sort = sorted(regions, key = lambda x: x['id'])

row_count = 0
for row in regions_sort:
    row_count = row_count + 1

print "Processing..."
print "Processed %d rows" % row_count
region_writeout = json.dumps(regions_sort, sort_keys=True, indent=4)

region_out = open('../api/region-index.json', 'wb')
region_out.writelines(region_writeout)
region_out.close()


##########################
# Process Donor index
# Open index csv
donor = csv.DictReader(open('temp-csv/undp-donor-index.csv', 'rb'), delimiter = ',', quotechar = '"')
# Sort file
donor_sort = sorted(donor, key = lambda x: x['id'])

row_count = 0
for row in donor_sort:
    row_count = row_count + 1

print "Processing..."
print "Processed %d rows" % row_count
donor_writeout = json.dumps(donor_sort, sort_keys=True, indent=4)

donor_out = open('../api/donor-index.json', 'wb')
donor_out.writelines(donor_writeout)
donor_out.close()


##########################
# Process Focus Area index
# Open index csv
focus = csv.DictReader(open('temp-csv/undp-focus-area-index.csv', 'rb'), delimiter = ',', quotechar = '"')
# Sort file
focus_sort = sorted(focus, key = lambda x: x['id'])

row_count = 0
for row in focus_sort:
    row_count = row_count + 1

print "Processing..."
print "Processed %d rows" % row_count
focus_writeout = json.dumps(focus_sort, sort_keys=True, indent=4)

focus_out = open('../api/focus-area-index.json', 'wb')
focus_out.writelines(focus_writeout)
focus_out.close()


##########################
# Process Operating Unit index
# Open index csv
ou = csv.DictReader(open('temp-csv/undp-operating-unit-index.csv', 'rb'), delimiter = ',', quotechar = '"')
geo = csv.DictReader(open('country-centroids.csv', 'rb'), delimiter = ',', quotechar = '"')

# Sort file
ou_sort = sorted(ou, key = lambda x: x['id'])
country_sort = sorted(geo, key = lambda x: x['iso3'])

row_count = 0
for row in ou_sort:
    row_count = row_count + 1

print "Processing..."
ou_list = []
row_count = 0
for oval in iter(ou_sort):
    row_count = row_count + 1
    for ctry in country_sort:
        ou_row = {
            "id": oval['id'],
            "name": oval['name'],
            "lat": ctry['lat'],
            "long": ctry['lon'],
        }
        if ctry['iso3'] == oval['id']:
            ou_list.append(ou_row)

print "Processed %d rows" % row_count
ou_writeout = json.dumps(ou_list, sort_keys=True, indent=4)

ou_out = open('../api/operating-unit-index.json', 'wb')
ou_out.writelines(ou_writeout)
ou_out.close()


##########################
# Process Corporate Outcome index
# Open index csv
outcome = csv.DictReader(open('temp-csv/undp-outcome-index.csv', 'rb'), delimiter = ',', quotechar = '"')
# Sort file
outcome_sort = sorted(outcome, key = lambda x: x['id'])

row_count = 0
for row in outcome_sort:
    row_count = row_count + 1

print "Processing..."
print "Processed %d rows" % row_count
outcome_writeout = json.dumps(outcome_sort, sort_keys=True, indent=4)

outcome_out = open('../api/outcome-index.json', 'wb')
outcome_out.writelines(outcome_writeout)
outcome_out.close()


##########################
# Process CRS Code index
# Open index csv
crs = csv.DictReader(open('temp-csv/undp-crs-index.csv', 'rb'), delimiter = ',', quotechar = '"')
# Sort file
crs_sort = sorted(crs, key = lambda x: x['id'])

row_count = 0
for row in crs_sort:
    row_count = row_count + 1

print "Processing..."
print "Processed %d rows" % row_count
crs_writeout = json.dumps(crs_sort, sort_keys=True, indent=4)

crs_out = open('../api/crs-index.json', 'wb')
crs_out.writelines(crs_writeout)
crs_out.close()
