# ------------------------------------------
# This script organizes donor data for donor visualizations, to be added to undp-xml-process.py
# ------------------------------------------

# This script runs Python commands to create the JSON API. 
# Requirements: Python 2.6 or greater 
 
import csv, sys, json, time, copy, chardet
from itertools import groupby

t0 = time.time()

#Process document file by Projects
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
donor_index = []
types = {}
donors = {}
donorList = {}
types['Special Activities'] = []
types['Cost Sharing'] = []
types['UNV'] = []
types['Thematic Trust Funds'] = []
types['Trust Funds'] = []
donorIndexHeader = ['id','name','country']
contribs = {}
contribsTemp = {}
for don,donor in groupby(fund_modalities_sort, lambda x: x['Donor']): 
	row_count = row_count + 1

	for d in donor:
		# organize donors by type
		type = d['Fund Rollup Level 3']
		donorID = str(d['Donor'])
		donorList[donorID] = {}
		contribsTemp[type] = []
		donorList[donorID] = contribsTemp

		# organize donors by type
		# type = k['Fund Rollup Level 3']
		# types[type].append(k['Donor Description'])
		# #organize contributions by type


for key, keys in groupby(fund_modalities_sort, lambda x: x['key']):
	for d in donorList:
		for k in keys:
			if int(d) == int(k['Donor']):
				print 'success', d	
				donorList[d][type] = k['Contribution Revenue']
		# contribs[type] = []
		# contribs[type].append(d)
		# contribsTemp = contribs
		# donors[donorID].append(contribsTemp)
		
		

	# donors_index.append(dict(zip(donorIndexHeader, index)))
print row_count, 'row count'

writeout = json.dumps(types, sort_keys=True, separators=(',',':'))
f_out = open('donor_data/types_donors.json', 'wb')
f_out.writelines(writeout)
f_out.close()

writeout = json.dumps(donorList, sort_keys=True, separators=(',',':'))
f_out = open('donor_data/test_donors.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# print donor_index

# for row in projectsFull:  
#     if row['operating_unit_id'] not in opUnits:
#         opUnits.append(row['operating_unit_id'])
#     row['outputs'] = []
#     row['budget'] = []
#     row['expenditure'] = []
#     row['subnational'] = []
#     row['fiscal_year'] = []
#     budget = []
#     expen = []
#     for o in outputsFull:
#         if row['project_id'] == o['award_id']:
#             row['outputs'].append(o)
#             for b in o['budget']:
#                 if b is not None:
#                     budget.append(b)
#             for e in o['expenditure']:
#                 if e is not None:
#                     expen.append(e)
#             for y in o['fiscal_year']:
#                 if y not in row['fiscal_year']:
#                     # Append to output array
#                     row['fiscal_year'].append(y)
#     row['budget'].append(sum(budget))
#     row['expenditure'].append(sum(expen))
#     for l in locationsFull:
#         if row['project_id'] == l['awardID']:
#             row['subnational'].append(l)
#     # join region information
#     row['region_id'] = 'global'
#     for r in units_sort:
#         if row['iati_op_id'] == r['iati_operating_unit'] or row['iati_op_id'] == r['operating_unit']:
#             row['region_id'] = r['bureau']
