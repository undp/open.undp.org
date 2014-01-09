# ------------------------------------------
# This script organizes donor data for donor visualizations, to be added to undp-xml-process.py
# ------------------------------------------
# This script runs Python commands to create the JSON API. 
# Requirements: Python 2.6 or greater 
 
import csv, sys, json, time, copy, chardet
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
region_expenses = csv.DictReader(open('donor_data/region_expenses.csv', 'rb'), delimiter = ',', quotechar = '"')
region_expenses_sort = sorted(region_expenses, key = lambda x: x['id'])


# Donors by fund modalities
fund_modalities = csv.DictReader(open('donor_data/fund_modalities.csv', 'rb'), delimiter = ',', quotechar = '"')
fund_modalities_sort = sorted(fund_modalities, key = lambda x: x['key'])

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
            "Special Activities": [], 
            "Cost Sharing": [], 
            "UNV": [],
            "Thematic Trust Funds": [],
            "Trust Funds": []
        }

count = 0
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

for d in donorList:
	temp = {
		"Special Activities": [], 
		"Cost Sharing": [], 
		"UNV": [],
		"Thematic Trust Funds": [],
		"Trust Funds": []
	}
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
			row_count = row_count +1
			val = k['Contribution Revenue'].replace("$","").replace("(","-").replace(")","").replace(",","")
			newVal = int(val)
			type = k['Fund Rollup Level 3']
			temp[type].append(newVal)
			totals[k['Fund Rollup Level 3']].append(newVal)

	donorList[d].append(temp)

for k, v in donorList.items():
	dtotal = 0
	for x in v:
		for typ, values in x.items():
			donorList[k][0][typ] = sum(values)
			# To remove negative values from total to change percent calculation in site
			#if donorList[k][0][typ] > -1:
				#dtotal = dtotal + sum(values)
			# else just use this:
			dtotal = dtotal + sum(values)
	donorList[k].append(dtotal)

print row_count, 'successful matches'

# Get sums of all numbers appended to totals arrays
totals['UNV'] = sum(totals['UNV'])
totals['Thematic Trust Funds'] = sum(totals['Thematic Trust Funds'])
totals['Trust Funds'] = sum(totals['Trust Funds'])
totals['Cost Sharing'] = sum(totals['Cost Sharing'])
totals['Special Activities'] = sum(totals['Special Activities'])


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