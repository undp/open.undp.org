# ------------------------------------------
# This script organizes donor data for donor visualizations, to be added to undp-xml-process.py
# ------------------------------------------
# This script runs Python commands to create the JSON API.
# Requirements: Python 2.6 or greater

import csv, sys, json, time, copy
from itertools import groupby

t0 = time.time()

# CSVs
#*********************************

# # Contributions cost sharing
# cost_sharing = csv.DictReader(open('donor_data/contribution_cost_sharing.csv', 'rb'), delimiter = ',', quotechar = '"')
# cost_sharing_sort = sorted(cost_sharing, key = lambda x: x['awardid'])

# # Contributions special activities
# special_activities = csv.DictReader(open('donor_data/contribution_special_activities.csv', 'rb'), delimiter = ',', quotechar = '"')
# special_activities_sort = sorted(special_activities, key = lambda x: x['awardid'])

# # Expenses cost sharing
# cost_sharing_expenses = csv.DictReader(open('donor_data/expenses_cost_sharing.csv', 'rb'), delimiter = ',', quotechar = '"')
# cost_sharing_expenses_sort = sorted(cost_sharing_expenses, key = lambda x: x['awardid'])

# # For donor names and IDs
# cntry_donors = csv.DictReader(open('download/undp_export/country_donors_updated.csv','rb'), delimiter = ',', quotechar = '"')
# cntry_donors_sort = sorted(cntry_donors, key = lambda x: x['id'])

# Expenses by region
region_expenses = csv.DictReader(open('donor_data/region_expenses.csv', 'rU'), delimiter = ',', quotechar = '"')
region_expenses_sort = sorted(region_expenses, key = lambda x: x['id'])


# Donors by fund modalities
fund_modalities = csv.DictReader(open('donor_data/fund_modalities.csv', 'rU'), delimiter = ',', quotechar = '"')
fund_modalities_sort = sorted(fund_modalities, key = lambda x: x['key'])

# Core fund donors
core_donors = csv.DictReader(open('donor_data/core_fund.csv', 'rU'), delimiter = ',', quotechar = '"')
core_donors_sort = sorted(core_donors, key = lambda x: x['key'])

# # Cost sharing by region
# cost_sharing_region = csv.DictReader(open('donor_data/region_cost_sharing.csv', 'rb'), delimiter = ',', quotechar = '"')
# cost_sharing_region_sort = sorted(cost_sharing_region, key = lambda x: x['awardid'])

# Process contributions by fund modalities

regions = []
for iden in region_expenses_sort:
  regTemp = {}
  regTemp['id'] = iden['id']
  regTemp['region'] = iden['region']
  regTemp['percent'] = iden['percent']
  regTemp['expense'] = int(iden['expenses_int'])
  regTemp['format_expense'] = iden['expenses']
  regions.append(regTemp)

row_count = 0
donorList = {}
totals = {
  "CORE": 0,
  "Non-CORE": 0,
  "Special Activities": 0,
  "Cost Sharing": 0,
  "UNV": 0,
  "Thematic Trust Funds": 0,
  "Trust Funds": 0
}

# Get a list of all donors in the non-core donors list
for d in fund_modalities_sort:
  # Fix names from CSV to match UN_AGY and MULTI_AGY used elsewhere in the site.
  if d['Donor Rollup Level 3'] == 'UN_AGY 1':
    donorID = 'UN_AGY'
  elif d['Donor Rollup Level 3'] == 'MUTLI_AGY2':
    donorID = 'MULTI_AGY'
  elif d['Donor Rollup Level 3'] == 'OTH_CDF1' or d['Donor Rollup Level 3'] == 'OTH_2' or d['Donor Rollup Level 3'] == 'OTH_UND1':
    donorID = 'OTH'
  else:
    donorID = d['Donor Rollup Level 3']
    donorList[donorID] = []
    # donorList[donorID].append(totals)

# Add to the donors list any core donors that weren't accounted for in the non-core donors list
for d in core_donors_sort:
  # Fix names from CSV to match UN_AGY and MULTI_AGY used elsewhere in the site.
  if d['Donor Level 3'] == 'UN_AGY 1':
    donorID = 'UN_AGY'
  elif d['Donor Level 3'] == 'MUTLI_AGY2':
    donorID = 'MULTI_AGY'
  elif d['Donor Level 3'] == 'OTH_CDF1' or d['Donor Level 3'] == 'OTH_2' or d['Donor Level 3'] == 'OTH_UND1':
    donorID = 'OTH'
  else:
    donorID = d['Donor Level 3']
    if (donorID not in donorList):
      donorList[donorID] = []
      # donorList[donorID].append(totals)

# Find the contributions from each donor according to fund type
for d in donorList:
  temp = {
    "CORE": 0,
    "Non-CORE": 0,
    "Special Activities": 0,
    "Cost Sharing": 0,
    "UNV": 0,
    "Thematic Trust Funds": 0,
    "Trust Funds": 0
  }
  # Contributions from non-core donors
  for k in fund_modalities_sort:
    if k['Donor Rollup Level 3'] == 'UN_AGY 1':
      donorID = 'UN_AGY'
    elif k['Donor Rollup Level 3'] == 'MUTLI_AGY2':
      donorID = 'MULTI_AGY'
    elif k['Donor Rollup Level 3'] == 'OTH_CDF1' or k['Donor Rollup Level 3'] == 'OTH_2' or k['Donor Rollup Level 3'] == 'OTH_UND1':
      donorID = 'OTH'
    else:
      donorID = k['Donor Rollup Level 3']
    if donorID == d:
      row_count = row_count + 1
      val = k['Contribution Revenue'].replace("\"", "").replace(" ", "").replace("$","").replace("(","-").replace(")","").replace(",","")
      try:
        newVal = int(val)
      except ValueError:
        newVal = 0
      type = k['Fund Rollup Level 3']
      temp[type] += newVal
      totals[type] += newVal
      if type != "CORE":
        temp["Non-CORE"] += newVal
        totals["Non-CORE"] += newVal

  # Contributions from core donors
  for k in core_donors_sort:
    if k['Donor Level 3'] == 'UN_AGY 1':
      donorID = 'UN_AGY'
    elif k['Donor Level 3'] == 'MUTLI_AGY2':
      donorID = 'MULTI_AGY'
    elif k['Donor Level 3'] == 'OTH_CDF1' or k['Donor Level 3'] == 'OTH_2' or k['Donor Level 3'] == 'OTH_UND1':
      donorID = 'OTH'
    else:
      donorID = k['Donor Level 3']
      if donorID == d:
        row_count = row_count +1
        val = k['Contribution Revenue'].replace("\"", "").replace(" ", "").replace("$","").replace("(","-").replace(")","").replace(",","")
        try:
          newVal = -1 * int(val)  # negate because negative values imply incoming donations
        except ValueError:
          newVal = 0
        type = k['Fund Rollup Level 2']
        temp[type] += newVal
        totals[type] += newVal

  # append the breakdown of contributions
  donorList[d].append(temp)
  # append this donor's overall contribution
  totalContribution = 0
  for k, v in temp.iteritems():
    totalContribution += v;
  donorList[d].append(totalContribution);

print row_count, 'successful matches'

# make the combined output list (contains both individual donor contributions and overall totals)
# outputTotals: list
# Each entry of the list is a dictionary of the form:
# {'name': donationType, 'value': donationAmount, 'donor-country': countryName or all for totals}
outputTotals = []
# append overall totals
for k, v in totals.iteritems():
  innerStruct = {
                  'name': k.lower(),
                  'value': v,
                  'donor-country': 'all'
                }
  outputTotals.append(innerStruct)
# append individual country data
for d in donorList:
  for k, v in donorList[d][0].iteritems():
    innerStruct = {
                    'name': k.lower(),
                    'value': v,
                    'donor-country': d
                  }
    outputTotals.append(innerStruct)

# Write the outputTotals array to file
f_out = open('../api/donors/donorDataArray.js', 'wb')
f_out.write('[\n')
for entry in outputTotals:
  f_out.write("%s,\n" % entry)
f_out.write(']\n')
f_out.close()

writeout = json.dumps(totals, sort_keys=True, separators=(',',':'))
f_out = open('../api/donors/total-modality.json', 'wb')
print "total modality JSON generated"
f_out.writelines(writeout)
f_out.close()

writeout = json.dumps(regions, sort_keys=True, separators=(',',':'))
f_out = open('../api/donors/region-expenses.json', 'wb')
print "total modality JSON generated"
f_out.writelines(writeout)
f_out.close()

writeout = json.dumps(donorList, sort_keys=True, separators=(',',':'))
f_out = open('../api/donors/donor-modality.json', 'wb')
f_out.writelines(writeout)
print "donor modality JSON generated"
f_out.close()
