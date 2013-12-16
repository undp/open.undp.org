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

# Donors by fund modalities
fund_modalities = csv.DictReader(open('donor_data/fund_modalities.csv', 'rb'), delimiter = ',', quotechar = '"')
fund_modalities_sort = sorted(fund_modalities, key = lambda x: x['key'])

# # Cost sharing by region
# cost_sharing_region = csv.DictReader(open('donor_data/region_cost_sharing.csv', 'rb'), delimiter = ',', quotechar = '"')
# cost_sharing_region_sort = sorted(cost_sharing_region, key = lambda x: x['awardid'])

# Process contributions by fund modalities
row_count = 0
donorList = {}
totals = {
            "Special Activities": [], 
            "Cost Sharing": [], 
            "UNV": [],
            "Thematic Trust Funds": [],
            "Trust Funds": []
        }

for don,donor in groupby(fund_modalities_sort, lambda x: x['Donor']): 
	for d in donor:
		# organize donors by type
		donorID = str(d['Donor'])
		donorList[donorID] = []

for d in donorList:
	for key, keys in groupby(fund_modalities_sort, lambda x: x['key']):
		for k in keys:
			if k['Donor'] == d:
				row_count = row_count +1
				val = k['Contribution Revenue'].replace("$","").replace("(","-").replace(")","").replace(",","")
				newVal = int(val)
				types = {k['Fund Rollup Level 3']: newVal}
				totals[k['Fund Rollup Level 3']].append(newVal)
				donorList[d].append(types)

print row_count, 'successful matches'

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

writeout = json.dumps(donorList, sort_keys=True, separators=(',',':'))
f_out = open('../api/donors/donor-modality.json', 'wb')
f_out.writelines(writeout)
print "donor modality JSON generated"
f_out.close()