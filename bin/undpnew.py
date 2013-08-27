
import time, csv, json,  os, re, sys, wget, requests, chardet
from lxml import etree
from itertools import groupby
from datetime import datetime
from sys import argv
from sets import Set

# Global Output Arrays
# ********************
fiscalYears = []
row_count = 0
outputs = []
outputsFull = []
locationsFull = []
# outputsHeader = ['output_id','award_id','output_title','output_descr','gender_id','gender_descr','focus_area','focus_area_descr','crs','crs_descr','fiscal_year','budget','expenditure','donor_id','donor_short','donor_name','donor_type_id','donor_type','donor_country_id','donor_country','donor_budget','donor_expend']


# For donor JSONs
# ***************
cntry_donors = csv.DictReader(open('download/undp_export/country_donors.csv','rb'), delimiter = ',', quotechar = '"')
cntry_donors_sort = sorted(cntry_donors, key = lambda x: x['id'])

# Global Donors Arrays
# ********************
dctry_index = [
	    {"id": "OTH","name": "Others"},
	    {"id": "MULTI_AGY","name": "Multi-lateral Agency"}
	]
donor_index = []
# for donor index JSON
donor_header = ['id','name','country']
donorCtryCheck = []
donorCtry_index = []
# for donor country index JSON
donorCtry_header = ['id','name']
donorCheck = []
donorOutput = []
outputsFull = []

# For CRS-index.json
# ******************
crs_index = []
crsCheck = []
crsHeader = ['id','name']

def outputsLoop(o, output_id):
	print "         "
	print "         "
	print "new ouput"
	# Outputs 
	# *******
	
	related = o.find("./related-activity[@type='1']")
	relatedArray = related.get('ref').split('-', 2)
	rltdProject = relatedArray[2]
	outputTitle = o.find("./title").text
	outputDescr = o.find("./description").text
	gen = o.find(".policy-marker").attrib
	outputGenID = gen.get('code')
	outputGenDescr = o.find(".policy-marker").text
	# Waiting on UNDP to add output Focus areas to the XML
	# outputFA = []
	# outputFAdescr = []
	outputList = [output_id]
	outputAward = rltdProject
	outputCRS = []
	outputCRSdescr = []
	outputFY = []
	outputBudget = []
	outputExpend = []
	# Donors
	# ******
	donorRefs = []
	for donor in o.findall("./participating-org[@role='Funding']"):	
		ref = donor.get('ref')
		if ref not in donorRefs:
			donorRefs.append(ref)
		# Check for duplicates in donorCheck array
		if donor.get('ref') not in donorCheck:
			donorTemp = []
			donorCtryTemp = []
			ref = donor.get('ref')
			donorCheck.append(ref)
			donorTemp.append(ref)
			donorTemp.append(donor.text)
			for d in cntry_donors_sort:
				# Check IDs from the CSV against the cntry_donors_sort. This provides funding country names not in XML
				if d['id'] == ref:
					donorTemp.append(d['country'])
					if donor.text.find('GOVERNMENT') != -1 and d['country'] != "MULTI_AGY" and d['country'] != "OTH":
						donorCtryTemp.append(d['country'])
						donorCtryTemp.append(d['name'])
						dctry_index.append(dict(zip(donorCtry_header,donorCtryTemp)))
			donor_index.append(dict(zip(donor_header,donorTemp)))
		
	# Find budget information to later append to projectFY array
	outputYears = []
	outputBudget = []
	budgets = o.findall("./budget")
	for budget in budgets:
		for b in budget.iterchildren(tag='value'):
			date = b.get('value-date').split('-', 3)
			amt = b.text
			year = date[0]
			outputBudget.append(amt)
			if year not in fiscalYears:
				# Append to global array for year-index.js
				fiscalYears.append(year) 
			if year not in outputFY:
				# Append to output array
				outputFY.append(year)
	# Find sectors for crs-index.json
	outputCRSdescr = []
	outputCRS = []
	sector = o.find('sector')
	if sector.text not in crsCheck:
		# Set CRS for the output itself
		outputCRSdescr = sector.text
		outputCRS = sector.get('code')
		# Append CRS to global array for index JSON
		sectorTemp = []
		crsCheck.append(sector.text)
		sectorTemp.append(sector.text)
		sectorTemp.append(sector.get('code'))
		crs_index.append(dict(zip(crsHeader, sectorTemp)))
	# Use transaction data to get expenditure and budget by donor
	donorShort = []
	donorName = []
	donorTypeID = []
	donorType = []
	donorCtyID = []
	donorCty = []
	donorBudget = []
	donorExpend = []
	transactions = o.findall('transaction')
	for d in donorRefs:
		for tx in transactions:
			for expen in tx.findall("./transaction-type[@code='E']"):
				for sib in expen.itersiblings():
					pass
			for cmt in tx.findall("./transaction-type[@code='C']") or tx.findall("./transaction-type[@code='IF']"):
				for sib in cmt.itersiblings():
					if sib.tag == 'value':
						value = sib.text
						
					if sib.tag == 'provider-org':
						if d == sib.get('ref'):
							donorBudget.append(value)
							if sib.text not in donorName:
								donorName.append(sib.text)
	# Get subnational locations
	locs = []
	locHeader = ['awardID','lat','lon','precision','name','type']
	locations = o.findall('location')
	for location in locations:
		locTemp = []
		awardID = rltdProject
 		for loc in location.iterchildren():
			if loc.tag == 'coordinates':
				lat = loc.get('latitude')
				lon = loc.get('longitude')
				precision = loc.get('precision')
			if loc.tag == 'name':
				name = loc.text
			if loc.tag == 'location-type':
				locType = loc.get('code')
		locTemp.append(awardID)
		locTemp.append(lat)
		locTemp.append(lon)
		locTemp.append(precision)
		locTemp.append(name)
		locTemp.append(locType)
		locationsFull.append(dict(zip(locHeader,locTemp)))
	
	#outputList.append(dOut['donorTypeID'])
	#outputList.append(dOut['donorType'])
	#outputList.append(dOut['donorCtyID'])
	#outputList.append(dOut['donorCty'])
	#outputList.append(dOut['donorBudget'])
	#outputList.append(dOut['donorExpend'])
	
	outputsHeader = ['output_id',
	'award_id',
	'output_title',
	'output_descr',
	'gender_id',
	'gender_descr',
	'crs',
	'crs_descr',
	'fiscal_year',
	'budget']
	# 'donor_id',
	# 'donor_short',
	# 'donor_name',
	# 'donor_type_id',
	# 'donor_type',
	# 'donor_country_id',
	# 'donor_country']
	outputList.append(outputAward)
	outputList.append(outputTitle)
	outputList.append(outputDescr)
	outputList.append(outputGenID)
	outputList.append(outputGenDescr)
	# Waiting on UNDP to add output Focus areas to the XML	
	# outputList.append(outputFA)
	# outputList.append(outputFAdescr)
	outputList.append(outputCRS)
	outputList.append(outputCRSdescr)
	outputList.append(outputFY)
	outputList.append(outputBudget)
	# outputList.append(donorBudget)
	# outputList.append(donorName)
	# outputList.append(outputExpend)
	outputsFull.append(dict(zip(outputsHeader,outputList))) # this returns a list of dicts of output informaiton for each output

	
# Global project arrays
# *********************
projects = []
projectsFull = []
projectsSmallFull = []
# projectsHeader = ['project_id','project_title','project_descr','inst_id','inst_descr','inst_type_id','inst_type_descr','fiscal_year','start','end','operating_unit_id','operating_unit','region_id','region_name','outputs','document_name','subnational']
projectsHeader = ['project_id','project_title','project_descr','start','end','inst_id','inst_descr','inst_type_id','operating_unit','operating_unit_id','document_name']
projectsSmallHeader = ['project_id','title','subnational']
units = csv.DictReader(open('download/undp_export/report_units.csv', 'rb'), delimiter = ',', quotechar = '"')
units_sort = sorted(units, key = lambda x: x['operating_unit'])

def loopData(file_name, key):
	# Get CSVs
	subnational = csv.DictReader(open('download/undp_export/subnational.csv','rb'), delimiter = ',', quotechar = '"')
	subnational_sort = sorted(subnational, key = lambda x: x['awardID'])
	bureau = csv.DictReader(open('download/undp_export/regions.csv', 'rb'), delimiter = ',', quotechar = '"')
	bureau_sort = sorted(bureau, key = lambda x: x['bureau'])
	# Get IATI activities XML
	context = iter(etree.iterparse(file_name,tag='iati-activity'))
	# Loop through each IATI activity in the XML
	row_count = 0
	projectSmallList = {}
	projects = []
	for event, p in context:
		docTemp = []
		projectFY = []
		# IATI hierarchy used to determine if output or input1
		hierarchy = p.attrib['hierarchy']
		current = p.attrib['default-currency']
		awardArray = p[1].text.split('-', 2)
		award = awardArray[2]
		implement = p.find("./participating-org[@role='Implementing']")
		if hierarchy == '2':	
			# Send the outputs to a separate function, to be joined to their projects later.
			outputsLoop(p, award)

		# Check for projects		
		if hierarchy == '1':
			row_count = row_count + 1
			projectList = [award]
			projectSmallList['id'] = award
			docTemp = []
			subnationalTemp = []
			award_title = p.find("./title").text
			award_description = p.find("./description").text
			# Get document-links
			documents = p.findall("./document-link")
			docLinks = []
			docNames = []
			for doc in documents:
				docLinks.append(doc.get('url'))
				for d in doc.iterchildren(tag='title'):
					docNames.append(d.text)
			if docNames:
				docTemp.append(docNames)
				docTemp.append(docLinks)
			# Find start and end dates
			start_date = p.find("./activity-date[@type='start-planned']").text
			end_date = p.find("./activity-date[@type='end-planned']").text
			# Find recipient country for operating_unit_id
			try: 
				op_unit = p.find("./recipient-country").attrib
				ou_descr = p.find("./recipient-country").text
				operatingunit = op_unit.get('code')
			except: 
				pass
			# Append all items to the project Array
			projectList.append(award_title)
			projectList.append(award_description)
			projectList.append(start_date)
			projectList.append(end_date)
			# Check for implementing organization 
			try: 
				inst = p.find("./participating-org[@role='Implementing']").attrib
				inst_descr = p.find("./participating-org[@role='Implementing']").text
				institutionid = inst.get('ref')
				inst_type_id = inst.get('type')
				projectList.append(institutionid)
				projectList.append(inst_descr)
				projectList.append(inst_type_id)
			except: 
				projectList.append("")
				projectList.append("")
				projectList.append("")
			# projectList.append(subnationalTemp)
			projectList.append(ou_descr)
			projectList.append(operatingunit)
			projectList.append(docTemp)
			# projectList.append(projectFY)
			# projectList.append(bureau)
			# projectList.append(bureau_description)

			projectsFull.append(dict(zip(projectsHeader,projectList))) # this joins project information, output per project, and documents for each project
			
			# # Add info to smaller object for op unit JSONs
			# projectSmallList['title'] = award_title
			# projectSmallList['op_unit'] = operatingunit
			# projectSmallList['subnational'] = subnationalTemp
			# projectsSmallFull.append(projectSmallList)


def createSummary():
	## Process Project Summary file
	# *****************************
	projectSum = csv.DictReader(open('download/undp_export/report_projects.csv', 'rb'), delimiter = ',', quotechar = '"')
	projectSum_sort = sorted(projectSum, key = lambda x: x['fiscal_year'])
	
	regionsList = ['PAPP','RBA','RBAP','RBAS','RBEC','RBLAC']
	
	row_count = 0
	yearJson = []
	yearList = []
	projectSumHeader = ['fiscal_year','id','name','operating_unit','region','budget','expenditure','crs','focus_area','donors','donor_types','donor_countries','donor_budget','donor_expend']
	for year,projectYears in groupby(projectSum_sort, lambda x: x['fiscal_year']):
		projectSummary = []
		yearJson.append(year)
		yearSummary = {'year':"",'summary':""} 
		for award,summary in groupby(sorted(fiscalYears, key = lambda x: x['awardID']), lambda x: x['awardID']): 
			row_count = row_count + 1
			summaryList = [year]
			summaryList.append(award)
			projectFY = []
			docTemp = []
			for s in summary:
				summaryList.append(s['award_title'])
				summaryList.append(s['operatingunit'])
				if s['bureau'] not in regionsList:
					summaryList.append('global')
				else:
					summaryList.append(s['bureau'])
				summaryList.append(float(s['budget']))
				summaryList.append(float(s['expenditure']))
			crsTemp = []
			faTemp = []
			for out in outputsFull:
			    if out['award_id'] == award:
			        if out['crs'] not in crsTemp:
			            crsTemp.append(out['crs'])
			        if out['focus_area'] not in faTemp:
			            faTemp.append(out['focus_area'])
			summaryList.append(crsTemp)
			summaryList.append(faTemp)
			dTemp = []
			dtypeTemp = []
			dCtyTemp = []
			dBudget = []
			dExpend = []
			if year in donorYearList:
			    for dProj in donorYearList[year]:
			        if dProj['projectID'] == award:
			            dTemp = dProj['donorID']
			            dtypeTemp = dProj['donorTypeID']
			            dCtyTemp = dProj['donorCtyID']
			            dBudget = dProj['donorBudget']
			            dExpend = dProj['donorExpend']
			summaryList.append(dTemp)
			summaryList.append(dtypeTemp)
			summaryList.append(dCtyTemp)
			summaryList.append(dBudget)
			summaryList.append(dExpend)
			projectSummary.append(dict(zip(projectSumHeader,summaryList))) # this joins the project summary information 
		yearSummary['year'] = year
		yearSummary['summary'] = projectSummary 
		yearList.append(yearSummary)
	
	print "Project Summary Process Count: %d" % row_count
	
	for y in yearList:
	    jsvalue = "var SUMMARY = "
	    jsondump = json.dumps(y['summary'], sort_keys=True, separators=(',',':'))
	    writeout = jsvalue + jsondump
	    f_out = open('../api/project_summary_%s.js' % y['year'], 'wb')
	    f_out.writelines(writeout)
	    f_out.close()
	    f_out = open('../api/project_summary_%s.json' % y['year'], 'wb')
	    f_out.writelines(jsondump)
	    f_out.close()
	print 'Project Summary json files generated...'


# 1. Scipt starts here
# *****************
# Specify XML project file location
projects_file = 'download/atlas_projects_small.xml'
loopData(projects_file,'document-link')

# 2. Joing outputs to projects

regionsList = ['PAPP','RBA','RBAP','RBAS','RBEC','RBLAC']
row_count = 0
yearJson = []
yearList = []

for year in fiscalYears:
	projectSummary = []
	yearJson.append(year)
	yearSummary = {'year':"",'summary':""} 
	for row in projectsFull:

		# Join outputs
		row['outputs'] = []
		for o in outputsFull:
			if row['project_id'] == o['award_id']:
				row['outputs'].append(o)
		row['subnational'] = []
		for l in locationsFull:
			if row['project_id'] == l['awardID']:
				row['subnational'].append(l)
		# join region information
		row['region_id'] = []
		for r in units_sort:
			try:
				if row['operating_unit_id'] == r['iati_operating_unit']:
					row['region_id'] = r['bureau']
			except: 
				pass

# OLD VERSION OF SUMMMARY
# ((((((((((())))))))))))
regionsList = ['PAPP','RBA','RBAP','RBAS','RBEC','RBLAC']

row_count = 0
yearJson = []
yearList = []
projectSumHeader = ['fiscal_year','id','name','operating_unit','region','budget','expenditure','crs','focus_area','donors','donor_types','donor_countries','donor_budget','donor_expend']
for year,projectYears in groupby(projectSum_sort, lambda x: x['fiscal_year']):
    projectSummary = []
    yearJson.append(year)
    yearSummary = {'year':"",'summary':""} 
    for award,summary in groupby(sorted(projectYears, key = lambda x: x['awardID']), lambda x: x['awardID']): 
		row_count = row_count + 1
		summaryList = [year]
		summaryList.append(award)
		projectFY = []
		docTemp = []
		for s in summary:
		    summaryList.append(s['award_title'])
		    summaryList.append(s['operatingunit'])
		    if s['bureau'] not in regionsList:
		        summaryList.append('global')
		    else:
		        summaryList.append(s['bureau'])
		    summaryList.append(float(s['budget']))
		    summaryList.append(float(s['expenditure']))
		crsTemp = []
		faTemp = []
		for out in outputsFull:
		    if out['award_id'] == award:
		        if out['crs'] not in crsTemp:
		            crsTemp.append(out['crs'])
		        if out['focus_area'] not in faTemp:
		            faTemp.append(out['focus_area'])
		summaryList.append(crsTemp)
		summaryList.append(faTemp)
		dTemp = []
		dtypeTemp = []
		dCtyTemp = []
		dBudget = []
		dExpend = []
		if year in donorYearList:
		    for dProj in donorYearList[year]:
		        if dProj['projectID'] == award:
		            dTemp = dProj['donorID']
		            dtypeTemp = dProj['donorTypeID']
		            dCtyTemp = dProj['donorCtyID']
		            dBudget = dProj['donorBudget']
		            dExpend = dProj['donorExpend']
		summaryList.append(dTemp)
		summaryList.append(dtypeTemp)
		summaryList.append(dCtyTemp)
		summaryList.append(dBudget)
		summaryList.append(dExpend)
		projectSummary.append(dict(zip(projectSumHeader,summaryList))) # this joins the project summary information 
	yearSummary['year'] = year
	yearSummary['summary'] = projectSummary 
	yearList.append(yearSummary)

# 3. Generate JSONs
# ****************

# Generate JSONs for each project
file_count = 0
for row in projectsFull:
	file_count = file_count + 1
	writeout = json.dumps(row, sort_keys=True, separators=(',',':'))
	f_out = open('../api/projects_new/%s.json' % row['project_id'], 'wb')
	f_out.writelines(writeout)
	f_out.close()
print '%d project files generated...' % file_count

# Process CRS Index
# *****************
row_count = 0
print "CRS Index Process Count: %d" % row_count
writeout = json.dumps(crs_index, sort_keys=True, separators=(',',':'))
f_out = open('../api_new/crs-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Process Donor Index
# *****************
print "Donor Index Process Count: %d" % row_count
writeout = json.dumps(donor_index, sort_keys=True, separators=(',',':'))
f_out = open('../api_new/donor-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Process Donor Country Index
# *****************
print "Donor Country Index Process Count"
writeout = json.dumps(dctry_index, sort_keys=True, separators=(',',':'))
f_out = open('../api_new/donor-country-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Make year index 
# ***************
yearJSvalue = "var FISCALYEARS ="
writeout = "%s %s" % (yearJSvalue, fiscalYears) 
f_out = open('../api_new/year-index.js', 'wb')
f_out.writelines(writeout)
f_out.close()

print "Donors by Output Process Count: %d"
donorOutputs = []
donorOutHeader = ['outputID','donorID','donorName','donorShort','donorTypeID','donorCtyID','donorCty','donorBudget','donorExpend']

# Top Donor Lists
# ************************
donor_gross = csv.DictReader(open('download/undp_export/donor_gross.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_gross_sort = sorted(donor_gross, key = lambda x: x['donor'])
donor_local = csv.DictReader(open('download/undp_export/donor_local.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_local_sort = sorted(donor_local, key = lambda x: x['donor'])

# Writeout donor gross list
# ************************
gross_list = []
for g in donor_gross_sort:
	gross = {}
	gross['name'] = g['donor']
	gross['regular'] = g['regular']
	gross['other'] = g['other']
	gross['total'] = g['total']
	for d in cntry_donors_sort:
		if d['name'] == g['donor']:
			gross['donor_id'] = d['id']
	gross_list.append(gross)

writeout = json.dumps(gross_list, sort_keys=True, separators=(',',':'))
f_out = open('../api/top-donor-gross-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Writeout donor local list
# ************************
local_list = []
for g in donor_local_sort:
	local = {}
	local['name'] = g['donor']
	local['amount'] = g['amount']
	for d in cntry_donors_sort:
		if d['name'] == g['donor']:
			local['donor_id'] = d['id']
	local_list.append(local)
	
writeout = json.dumps(local_list, sort_keys=True, separators=(',',':'))
f_out = open('../api/top-donor-local-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()

# Region Index 
# ************************
exclude = ['PAPP','RBA','RBAP','RBAS','RBEC','RBLAC']
	
row_count = 0
region_index = []
regionHeader = ['id','name']
region_i = []
index = []
global_i = ['global','Global']
for r,region in groupby(units_sort, lambda x: x['bureau']): 
    row_count = row_count + 1
    if r in exclude:
        region_i = [r]
        for reg in region:
            if reg['bureau'] == 'PAPP':
                region_i.append(reg['ou_descr'])
                index.append(region_i)
            if reg['hq_co'] == 'HQ':
                if reg['ou_descr'] not in region_i:
                    region_i.append(reg['ou_descr'])
                    index.append(region_i)

index.append(global_i)
index_print = []
for i in index:
    index_print.append(dict(zip(regionHeader, i)))
    
print "Region Index Process Count: %d" % row_count
writeout = json.dumps(index_print, sort_keys=True, separators=(',',':'))
f_out = open('../api_new/region-index.json', 'wb')
f_out.writelines(writeout)
f_out.close()


# HDI processing
# **************

# To add...
