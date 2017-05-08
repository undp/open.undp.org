# ------------------------------------------
# This script organizes donor data for donor visualizations, to be added to undp-xml-process.py
# ------------------------------------------
# This script runs Python commands to create the JSON API.
# Requirements: Python 2.6 or greater

import csv
import json

import config


def donors():
    # CSVs
    #*********************************

    # Expenses by region
    region_expenses = csv.DictReader(open('%s/region_expenses.csv' % config.DONOR_DATA,
                                          'rU'),
                                     delimiter=',',
                                     quotechar='"')
    region_expenses_sort = sorted(region_expenses, key=lambda x: x['id'])


    # Donors by fund modalities
    fund_modalities = csv.DictReader(open('%s/fund_modalities.csv' % config.DONOR_DATA,
                                          'rU'),
                                     delimiter=',',
                                     quotechar='"')
    fund_modalities_sort = sorted(fund_modalities, key=lambda x: x['key'])

    # Core fund donors
    core_donors = csv.DictReader(open('%s/core_fund.csv' % config.DONOR_DATA,
                                      'rU'),
                                 delimiter=',',
                                 quotechar='"')
    core_donors_sort = sorted(core_donors, key=lambda x: x['key'])

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
        "Trust Funds": 0,
        "Other": 0
    }

    # Get a list of all donors in the non-core donors list
    for d in fund_modalities_sort:
      # Fix names from CSV to match UN_AGY and MULTI_AGY used elsewhere in the site.
        if d['Donor Rollup Level 3'] == 'UN_AGY 1':
            donorID = 'UN_AGY'
        elif d['Donor Rollup Level 3'] == 'MUTLI_AGY2':
            donorID = 'MULTI_AGY'
        elif (d['Donor Rollup Level 3'] == 'OTH_CDF1' or d['Donor Rollup Level 3'] == 'OTH_2'
                or d['Donor Rollup Level 3'] == 'OTH_UND1'):
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
            "Trust Funds": 0,
            "Other": 0
        }

      # Contributions from non-core donors
        for k in fund_modalities_sort:
            if k['Donor Rollup Level 3'] == 'UN_AGY 1':
                donorID = 'UN_AGY'
            elif k['Donor Rollup Level 3'] == 'MUTLI_AGY2':
                donorID = 'MULTI_AGY'
            elif (k['Donor Rollup Level 3'] == 'OTH_CDF1' or k['Donor Rollup Level 3'] == 'OTH_2'
                    or k['Donor Rollup Level 3'] == 'OTH_UND1'):
                donorID = 'OTH'
            else:
                donorID = k['Donor Rollup Level 3']
            if donorID == d:
                row_count = row_count + 1
                val = k['Contribution Revenue'].replace("\"", "").replace(" ", "").replace("$", "").replace("(", "-").replace(")", "").replace(",", "")
                try:
                    newVal = int(val)
                except ValueError:
                    newVal = 0
                _type = k['Fund Rollup Level 3']
                temp[_type] += newVal
                totals[_type] += newVal
                if _type != "CORE":
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
                    val = k['Contribution Revenue'].replace("\"", "").replace(" ", "").replace("$", "").replace("(", "-").replace(")", "").replace(",", "")
                    try:
                        newVal = -1 * int(val)  # negate because negative values imply incoming donations
                    except ValueError:
                        newVal = 0
                    _type = k['Fund Rollup Level 2']
                    temp[_type] += newVal
                    totals[_type] += newVal

        # append the breakdown of contributions
        donorList[d].append(temp)
        # append this donor's overall contribution
        totalContribution = 0
        for k, v in temp.iteritems():
            totalContribution += v
        donorList[d].append(totalContribution)

    print row_count, 'successful matches'

    # make the combined output list (contains both individual donor contributions and overall totals)
    # outputTotals: list
    # Each entry of the list is a dictionary of the form:
    # {'name': donationType, 'value': donationAmount, 'donor-country': countryName or all for totals}
    outputTotals = []
    # append overall totals
    for k, v in totals.iteritems():
        innerStruct = {
            "name": k.lower(),
            "value": v,
            "donor-country": "all"
        }
        outputTotals.append(innerStruct)

    # append individual country data
    for d in donorList:
        for k, v in donorList[d][0].iteritems():
            innerStruct = {
                "name": k.lower(),
                "value": v,
                "donor-country": d
            }
            outputTotals.append(innerStruct)

    # Write the outputTotals array to file
    writeout = json.dumps(outputTotals, sort_keys=True, separators=(',', ':'))
    f_out = open('%s/donors/donors.json' % config.API_PATH, 'wb')
    f_out.writelines(writeout)
    f_out.close()
    # for entry in outputTotals:
    #   f_out.write("%s,\n" % entry)
    # f_out.write(']\n')
    # f_out.close()

    writeout = json.dumps(totals, sort_keys=True, separators=(',', ':'))
    f_out = open('%s/donors/total-modality.json' % config.API_PATH, 'wb')
    print "total modality JSON generated"
    f_out.writelines(writeout)
    f_out.close()

    writeout = json.dumps(regions, sort_keys=True, separators=(',', ':'))
    f_out = open('%s/donors/region-expenses.json' % config.API_PATH, 'wb')
    print "region modality JSON generated"
    f_out.writelines(writeout)
    f_out.close()

    writeout = json.dumps(donorList, sort_keys=True, separators=(',', ':'))
    f_out = open('%s/donors/donor-modality.json' % config.API_PATH, 'wb')
    f_out.writelines(writeout)
    print "donor modality JSON generated"
    f_out.close()

    # Subnational Locations Index
    # ************************
    refType = csv.DictReader(open('%s/ref_typeofproject.csv' % config.UNDP_EXPORT,
                                  'rb'), delimiter=',', quotechar='"')
    refType_sort = sorted(refType, key=lambda x: x['id'])
    refPrec = csv.DictReader(open('%s/ref_precisioncodes.csv' % config.UNDP_EXPORT,
                                  'rb'), delimiter=',', quotechar='"')
    refPrec_sort = sorted(refPrec, key=lambda x: x['id'])
    refScope = csv.DictReader(open('%s/ref_scopeofproject.csv' % config.UNDP_EXPORT,
                                   'rb'), delimiter=',', quotechar='"')
    refScope_sort = sorted(refScope, key=lambda x: x['id'])

    ref = {}
    ref['type'] = {}
    ref['precision'] = {}
    ref['scope'] = {}
    row_count = 0
    for x in refType_sort:
        ref['type'][x['id']] = x['description']
        row_count = row_count + 1

    for x in refScope_sort:
        ref['scope'][x['id']] = x['description']
        row_count = row_count + 1

    for x in refPrec_sort:
        ref['precision'][x['id']] = x['description']
        row_count = row_count + 1

    print "Subnational Location Index Count: %d" % row_count
    writeout = json.dumps(ref, sort_keys=True, separators=(',', ':'))
    f_out = open('%s/subnational-locs-index.json' % config.API_PATH, 'wb')
    f_out.writelines(writeout)
    f_out.close()
