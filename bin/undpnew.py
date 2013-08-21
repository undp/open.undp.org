
import time, csv, json,  os, re, sys, wget, requests
from lxml import etree
from itertools import groupby
from datetime import datetime
from sys import argv
from sets import Set

# set the file location
projects_file = 'download/atlas_projects_small.xml'

def nodecpy(out, node, name, attrs={}, convert=unicode):
    if ((node is None) or (node.text is None)):
        return
    if node.text:
        out[name] = convert(node.text)
    for k, v in attrs.items():
    	try:
            out[name + '_' + v] = node.get(k)
        except AttributeError:
            pass

def getValue(value):
    try:
        return float(value)
    except ValueError:
        nicevalue = re.sub(",","",value)
        return float(nicevalue)

def getFieldsData(fields, activity, out):
    for field in fields:
        xpath = field[0]
        fieldname = field[1]
        attribs = dict([(k, k) for k in field[2]])
        nodecpy(out, activity.find(xpath), fieldname, attribs)

def parse_tx(tx):
    out = {}
    value = tx.find('value')
    if value is not None:
        out['value_date'] = value.get('value-date')
        out['value_currency'] = value.get('currency')
        out['value'] = getValue(value.text)
    fields = [
      ('description', 'description', {}),
      ('transaction-type', 'transaction_type', {'code'}),
      ('flow-type', 'flow_type', {'code'}),
      ('finance-type', 'finance_type', {'code'}),
      ('tied-status', 'tied_status', {'code'}),
      ('aid-type', 'aid_type', {'code'}),
      ('disbursement-channel', 'disbursement_channel', {'code'}),
      ('provider-org', 'provider_org', {'ref'}),
      ('receiver-org', 'receiver_org', {'ref'})
            ]
    
    getFieldsData(fields, tx, out)

    for date in tx.findall('transaction-date'):
        try:
            # for some (WB) projects, the date is not set even though the tag exists...
            if (date is not None):
                temp = {}
                nodecpy(temp, date,
                    'date',
                    {'iso-date': 'iso-date'})

                date_iso_date = date.get('iso-date')

                if (date_iso_date):
                    d = (date_iso_date)
                    out['transaction_date_iso'] = d
                elif (temp.has_key('date')):
                    d = (temp['date'])
                    out['transaction_date_iso'] = d

            else:
                print "No date!!"
           
        except ValueError:
            pass

    if not (out.has_key('transaction_date_iso')):
        out['transaction_date_iso'] = out['value_date']
    return out
    

def dcntryIndex():
	# dctry_index = [
	#     {"id": "OTH","name": "Others"},
	#     {"id": "MULTI_AGY","name": "Multi-lateral Agency"}
	# ]
	# dctryHeader = ['id','name']
	# dlvl1_check = []
	# for don,donor in groupby(donor_country_sort, lambda x: x['donor_type_lvl3']):
	#     row_count = row_count + 1
	#     index = []
	#     for d in donor:
	#         if d['donor_type_lvl1'] == 'PROG CTY' or d['donor_type_lvl1'] == 'NON_PROG CTY':
	#             if don.replace(" ","") != "":
	#                 index.append(don.replace(" ",""))
	#                 index.append(d['donor_type_lvl3_descr'])
	#     if index:
	#         dctry_index.append(dict(zip(dctryHeader, index)))
	
	print "Donor Country Index Process Count"
	writeout = json.dumps(dctry_index, sort_keys=True, separators=(',',':'))
	f_out = open('../api_new/donor-country-index.json', 'wb')
	f_out.writelines(writeout)
	f_out.close()


#outputsHeader = ['output_id','award_id','output_title','output_descr','gender_id','gender_descr','focus_area','focus_area_descr','crs','crs_descr','fiscal_year','budget','expenditure','donor_id','donor_short','donor_name','donor_type_id','donor_type','donor_country_id','donor_country','donor_budget','donor_expend']
outputsHeader = ['outpud_id','award_id','output_title','output_descr','gender_id','gender_descr','focus_area','focus_area_descr']

dctry_index = [
	    {"id": "OTH","name": "Others"},
	    {"id": "MULTI_AGY","name": "Multi-lateral Agency"}
	]
dctryHeader = ['id','type','name']
outputs = []
outputsFull = []
def outputsLoop(o, award):
	index = []
	donorRefs = []
	money = []
	for donor in o.findall("./participating-org[@role='Funding']"):
		donorRefs.append(donor.get('ref'))
		print donor.text
		# append to dcntryIndex
		if donor.get('ref') not in index:
			index.append(donor.get('ref'))
			index.append(donor.text)
			index.append(donor.get('type'))
		# print indexid
			# dctry_index.append(dict(zip(dctryHeader, index)))
	transactions = o.findall('transaction')
	for tx in transactions:
		transaction = parse_tx(tx)
		money.append(transaction)
		for provider  in tx.iterchildren(tag='provider-org'):
			for ref in donorRefs:
				if ref == provider.get('ref'):
					pass
	print len(donorRefs)
	print "    "
	donorOutputs = []
	outputList = []
	outputAward = [award]
	outputTitle = o.find("./title").text
	outputDescr = o.find("./description").text
	# Not in the XML, but not using gender information on the site, 
	# outputGenID = []
	# outputGenDescr = []
	outputFA = []
	outputFAdescr = []
	outputCRS = []
	outputCRSdescr = []
	outputFY = []
	outputBudget = []
	outputExpend = []
	# for o in output:
	#     if o['awardid'] not in outputAward:
	#         outputAward.append((o['awardid'] if o['awardid'] != "" else "-"))
	#     if o['project_description'] not in outputTitle:
	#         outputTitle.append((o['project_description'] if o['project_description'] != "" else "-"))
	#     if o['project_med_de'] not in outputDescr:
	#         outputDescr.append((o['project_med_de'] if o['project_med_de'] != "" else "-"))
	#     if o['gender_marker'] not in outputGenID:
	#         outputGenID.append((o['gender_marker'] if o['gender_marker'] != "" else "-"))
	#     if o['gender_marker_descr'] not in outputGenDescr:
	#         outputGenDescr.append((o['gender_marker_descr'] if o['gender_marker_descr'] != "" else "-"))
	#     if o['focus_area'] not in outputFA:
	#         outputFA.append((o['focus_area'] if o['focus_area'] != "" else "-"))
	#     if o['fa_description'] not in outputFAdescr:
	#         outputFAdescr.append((o['fa_description'] if o['fa_description'] != "" else "-"))
	#     if o['crs'] not in outputCRS:
	#         outputCRS.append((o['crs'] if o['crs'] != "" else "-"))
	#     if o['crs_descr'] not in outputCRSdescr:
	#         outputCRSdescr.append((o['crs_descr'] if o['crs_descr'] != "" else "-"))
	#     if o['fiscal_year'] not in outputFY:
	#         outputFY.append((o['fiscal_year'] if o['fiscal_year'] != "" else "-"))
	#     outputBudget.append((float(o['budget']) if o['budget'] != "" else 0))
	#     outputExpend.append((float(o['expenditure']) if o['expenditure'] != "" else 0))
	outputList.append(outputAward)
	outputList.append(outputTitle)
	outputList.append(outputDescr)
	# outputList.append(outputGenID)
	# outputList.append(outputGenDescr)
	# outputList.append(outputFA)
	# outputList.append(outputFAdescr)
	# outputList.append(outputCRS)
	# outputList.append(outputCRSdescr)
	# outputList.append(outputFY)
	# outputList.append(outputBudget)
	# outputList.append(outputExpend)
	# for dOut in donorOutputs:
	#     if dOut['outputID'] == out:
	#         outputList.append(dOut['donorID'])
	#         outputList.append(dOut['donorShort'])
	#         outputList.append(dOut['donorName'])
	#         outputList.append(dOut['donorTypeID'])
	#         outputList.append(dOut['donorType'])
	#         outputList.append(dOut['donorCtyID'])
	#         outputList.append(dOut['donorCty'])
	#         outputList.append(dOut['donorBudget'])
	#         outputList.append(dOut['donorExpend'])
	#     outputsFull.append(dict(zip(outputsHeader,outputList))) # this returns a list of dicts of output informaiton for each output

projects = []
projectsFull = []
projectsSmallFull = []
# projectsHeader = ['project_id','project_title','project_descr','inst_id','inst_descr','inst_type_id','inst_type_descr','fiscal_year','start','end','operating_unit_id','operating_unit','region_id','region_name','outputs','document_name','subnational']
projectsHeader = ['project_id','project_title','project_descr','start','end','inst_id','inst_descr','inst_type_id','subnational','operating_unit','operating_unit_id','document_name']
projectsSmallHeader = ['project_id','title','subnational']

def loopData(file_name, key):
# Get CSVs
	subnational = csv.DictReader(open('download/undp_export/subnational.csv','rb'), delimiter = ',', quotechar = '"')
	subnational_sort = sorted(subnational, key = lambda x: x['awardID'])
	units = csv.DictReader(open('download/undp_export/report_units.csv', 'rb'), delimiter = ',', quotechar = '"')
	units_sort = sorted(units, key = lambda x: x['operating_unit'])
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
			# Determine how to get a name when title does not exist in XML
			# name =  doc.get('url').split('/', 20)
				docLinks.append(doc.get('url'))
				try:
					for d in doc.iterchildren(tag='title'):
						# print "this has title"
						docNames.append(d.text)
				except: 
					docNames.append('no title for this document')
			docTemp.append(docNames)
			docTemp.append(docLinks)
			projectFY = [] 
			start_date = p.find("./activity-date[@type='start-planned']").text
			end_date = p.find("./activity-date[@type='end-planned']").text
			op_unit = p.find("./recipient-country").attrib
			operatingunit = op_unit.get('code')
			ou_descr = p.find("./recipient-country").text
			bureau = []
			bureau_description = []
		
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
				pass
			projectList.append(subnationalTemp)
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

# Take outputs Array and join to projects
#def joinOutputs():
	# outputTemp = []
	# for out in outputsFull:
	#     if out['award_id'] == award:
	#         outputTemp.append(out)
	# projectList.append(outputTemp)
	# for doc in docProjects:
	#     if doc['projectID'] == award:
	#         docTemp.append(doc['docName'])
	#         docTemp.append(doc['docURL'])
	# projectList.append(docTemp)

loopData(projects_file,'document-link')
print dctry_index
print len(dctry_index) 
dcntryIndex()
# Generate JSONs for each project
file_count = 0
for row in projectsFull:
	file_count = file_count + 1
	writeout = json.dumps(row, sort_keys=True, separators=(',',':'))
	f_out = open('../api/projects_new/%s.json' % row['project_id'], 'wb')
	f_out.writelines(writeout)
	f_out.close()
print '%d project files generated...' % file_count
