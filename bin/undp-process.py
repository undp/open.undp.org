import csv, sys, json
from itertools import groupby

# Open up projects_subprojects.csv
documents = csv.DictReader(open('download/undp_export/report_documents.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_projects = csv.DictReader(open('download/undp_export/report_donors.csv', 'rb'), delimiter = ',', quotechar = '"')
donor_outputs = csv.DictReader(open('download/undp_export/report_donors.csv', 'rb'), delimiter = ',', quotechar = '"')
outputs = csv.DictReader(open('download/undp_export/report_outputs.csv', 'rb'), delimiter = ',', quotechar = '"')
outputsGroup = csv.DictReader(open('download/undp_export/report_outputs.csv', 'rb'), delimiter = ',', quotechar = '"')
projects = csv.DictReader(open('download/undp_export/report_projects.csv', 'rb'), delimiter = ',', quotechar = '"')
units = csv.DictReader(open('download/undp_export/report_units_copy.csv', 'rb'), delimiter = ',', quotechar = '"')
bureau = csv.DictReader(open('download/undp_export/regions.csv', 'rb'), delimiter = ',', quotechar = '"')

# Sort for iteration 
documents_sort = sorted(documents, key = lambda x: x['awardid'])
donor_projects_sort = sorted(donor_projects, key = lambda x: x['awardID'])
donor_outputs_sort = sorted(donor_outputs, key = lambda x: x['projectID'])
outputs_sort = sorted(outputs, key = lambda x: x['projectID'])
outputsGroup_sort = sorted(outputsGroup, key = lambda x: x['awardid'])
projects_sort = sorted(projects, key = lambda x: x['awardID'])
units_sort = sorted(units, key = lambda x: x['rollup_ou'])
bureau_sort = sorted(bureau, key = lambda x: x['bureau'])


# Process document file by Projects
row_count = 0
docProject = []
docHeader = ['projectID','docName','docURL']
for id,documents in groupby(documents_sort, lambda x: x['awardid']):
    row_count = row_count + 1
    docList = [id]
    docName = []
    docURL = []
    for doc in documents:
        docName.append(doc['document_name'])
        docURL.append(doc['document_url'])
    docList.append(docName)
    docList.append(docURL)
    docProject.append(docList)
print "Document Process Count: %d" % row_count
docProjects = []
for d in docProject:
    docProjects.append(dict(zip(docHeader,d)))

# Process donors by Projects
row_count = 0
donorProject = []
donorProjHeader = ['projectID','donorID','donorName','donorShort','donorTypeID','donorType']
for don,donors in groupby(donor_projects_sort, lambda x: x['awardID']):
    row_count = row_count + 1
    donorList = [don]
    donorID = []
    donorName = []
    donorShort = []
    donorTypeID = []
    donorType = []
    for d in donors:
        donorID.append(d['donorID'])
        donorName.append(d['long_descr'])
        donorShort.append(d['short_descr'])
        donorTypeID.append(d['donor_type_lvl1'].replace(" ",""))
        donorType.append(d['donor_type_lvl1_descr'])
    donorList.append(donorID)
    donorList.append(donorName)
    donorList.append(donorShort)
    donorList.append(donorTypeID)
    donorList.append(donorType)
    donorProject.append(donorList)

print "Donors by Project Process Count: %d" % row_count
donorProjects = []
for l in donorProject:
    donorProjects.append(dict(zip(donorProjHeader,l)))

# Process donors by Outputs
row_count = 0
donorOutput = []
donorOutHeader = ['outputID','donorID','donorName','donorShort','donorTypeID','donorType']
for don,donors in groupby(donor_outputs_sort, lambda x: x['projectID']):
    row_count = row_count + 1
    donorList = [don]
    donorID = []
    donorName = []
    donorShort = []
    donorTypeID = []
    donorType = []
    for d in donors:
        donorID.append(d['donorID'])
        donorName.append(d['long_descr'])
        donorShort.append(d['short_descr'])
        donorTypeID.append(d['donor_type_lvl1'].replace(" ",""))
        donorType.append(d['donor_type_lvl1_descr'])
    donorList.append(donorID)
    donorList.append(donorName)
    donorList.append(donorShort)
    donorList.append(donorTypeID)
    donorList.append(donorType)
    donorOutput.append(donorList)

print "Donors by Output Process Count: %d" % row_count
donorOutputs = []
for l in donorOutput:
    donorOutputs.append(dict(zip(donorOutHeader,l)))

# Process Outputs 
row_count = 0
outputs = []
outputsFull = []
outputsHeader = ['output_id','award_id','output_title','output_descr','gender_id','gender_descr','focus_area','focus_area_descr','crs','crs_descr','fiscal_year','budget','expenditure','donor_id','donor_short','donor_name','donor_type_id','donor_type']
for out,output in groupby(outputs_sort, lambda x: x['projectID']): 
    row_count = row_count + 1
    outputList = [out]
    outputGenID = []
    outputGenDescr = []
    outputFA = []
    outputFAdescr = []
    outputCRS = []
    outputCRSdescr = []
    outputFY = []
    outputBudget = []
    outputExpend = []
    for o in output:
        outputList.append(o['awardid'])
        outputList.append(o['project_description'])
        outputList.append(o['project_med_de'])
        outputList.append(o['gender_marker'])
        outputList.append(o['gender_marker_descr'])
        outputList.append(o['focus_area'])
        outputList.append(o['fa_description'])
        outputList.append(o['crs'])
        outputList.append(o['crs_descr'])
        outputFY.append(o['fiscal_year'])
        outputBudget.append(float(o['budget']))
        outputExpend.append(float(o['expenditure']))
#    outputList.append(outputGenID)
#    outputList.append(outputGenDescr)
#    outputList.append(outputFA)
#    outputList.append(outputFAdescr)
#    outputList.append(outputCRS)
#    outputList.append(outputCRSdescr)
    outputList.append(outputFY)
    outputList.append(outputBudget)
    outputList.append(outputExpend)
    for dOut in donorOutputs:
        if dOut['outputID'] == out:
            outputList.append(dOut['donorID'])
            outputList.append(dOut['donorShort'])
            outputList.append(dOut['donorName'])
            outputList.append(dOut['donorTypeID'])
            outputList.append(dOut['donorType'])
    outputs.append(outputList)
    outputsFull.append(dict(zip(outputsHeader,outputList)))

print "Output Process Count: %d" % row_count
#outputsFull = []
#for l in output:
#    print l
#    outputsFull.append(dict(zip(outputsHeader,l)))


# Process Outputs and Aggregate for Projects
row_count = 0
projects = []
projectsHeader = ['project_id','project_title','project_descr','inst_id','inst_descr','inst_type_id','inst_type_descr','fiscal_year','start','end','operating_unit_id','operating_unit','region_id','region_name','outputs','document_name','document_url']
for award,project in groupby(projects_sort, lambda x: x['awardID']): 
    projectList = [award]
    projectFY = []
    docTemp = []
    for p in project:
        projectList.append(p['award_title'])
        projectList.append(p['award_description'])
        projectList.append(p['institutionid'])
        projectList.append(p['inst_descr'])
        projectList.append(p['inst_type'])
        projectList.append(p['inst_type_descr'])
        if p['fiscal_year'] not in projectFY:
            projectFY.append(p['fiscal_year'])
        projectList.append(projectFY)
        if p['start_date'] not in projectList:
            projectList.append(p['start_date'].rstrip(' 00:00:00.0'))
        if p['end_date'] not in projectList:
            projectList.append(p['end_date'].rstrip(' 00:00:00.0'))
        for op in units_sort:
            if op['rollup_ou'] == p['operatingunit']:
                projectList.append(p['operatingunit'])
                projectList.append(op['rollup_ou_description'])
                for b in bureau_sort:
                    if b['bureau'] == p['bureau']:
                        projectList.append(p['bureau'])
                        projectList.append(b['bureau_description'])
    outputTemp = []
    for out in outputsFull:
        if out['award_id'] == award:
            outputTemp.append(out)
    projectList.append(outputTemp)
    for doc in docProjects:
        if doc['projectID'] == award:
            docTemp.append(doc['docName'])
            docTemp.append(doc['docURL'])
    projectList.append(docTemp)
    projects.append(projectList)

projectsFull = []
for l in projects:
    row_count = row_count + 1
    projectsFull.append(dict(zip(projectsHeader,l)))
print "Project Process Count: %d" % row_count

file_count = 0
for row in projectsFull:
    file_count = file_count + 1
    writeout = json.dumps(row, sort_keys=True, indent=4)
    f_out = open('../api/projects/%s.json' % row['project_id'], 'wb')
    f_out.writelines(writeout)
    f_out.close()
print 'Processing complete. %d project files generated.' % file_count

