from __future__ import print_function

import urllib2
from collections import defaultdict
from lxml import etree
import copy
import json

from controller import Controller
import config as settings
from models import (Project, Output, Subnational, Unit, UnitProject, Crs, Donor, CountryDonor, ProjectSummary,
                    TopDonor, TopDonorLocal, Region, CoreDonor, OperatingUnit)
from _collection import (Projects, Outputs, Subnationals, Units, CrsIndex, DonorIndex, CountryDonorIndex,
                         ProjectSummaries, ReportDonors, DonorIDs, TopDonorGrossIndex, TopDonorLocalIndex,
                         RegionIndex, FocusAreaIndex, CoreDonors, OperatingUnitIndex)
from _collection import ObjectExists


class ProjectsController(Controller):

    """Main Process class that includes all the functions needed for processing UNDP xml data

    Main methods:

    run - Runs the whole class and generate everything
    """

    def __init__(self):
        self.undp_export = settings.UNDP_EXPORT
        self.projects = Projects()
        self.projectsummaries = ProjectSummaries()
        self.outputs = Outputs()
        self.subnationals = Subnationals()
        self.units = Units()
        self.crsindex = CrsIndex()
        self.donorindex = DonorIndex()
        self.countrydonorindex = CountryDonorIndex()
        self.topdonor_gross = TopDonorGrossIndex()
        self.topdonor_local = TopDonorLocalIndex()
        self.donor_ids = DonorIDs()
        self.region_index = RegionIndex()
        self.core_donors = CoreDonors()
        self.operating_unit_index = OperatingUnitIndex()
        self.api_path = settings.API_PATH
        self._years = set()
        self.geo = None

        # Adding 2010 because the xmls files are starting from 2011 but the legacy site expect to see 2010
        self.years = 2010

        self.country_donors = None

    @property
    def years(self):
        return self._years

    @years.setter
    def years(self, value):
        self._years.add(value)

    def generate(self):
        """ Main method. Execute necessary functions and generate json files """

        for files in reversed(self.get_filenames(settings.IATI_XML_ANNUAL)):
            self._prepare(files, 'iati-activity', 'projects')
            self._prepare(files, 'iati-activity', 'outputs')

        # Generating useful info for console
        counter = 0
        for i in self.outputs.collection.values():
            counter += len(i)

        self.log('Total outputs processed: %s' % counter)
        self.log('Total projects processed: %s' % len(self.projects.pks))

        self.log('Total Donor Index processed: %s' % len(self.donorindex.pks))
        self.log('Total Country Donor Index processed: %s' % len(self.countrydonorindex.pks))

        # Save Project Json files
        self.projects.save_json(self.outputs, self.subnationals, self.api_path)

        # Save Unit Json files
        self.units.save_json(self.subnationals, self.api_path)

        # Generate Core Donors
        self._populate_core_donors()
        self.core_donors.save_json(self.api_path, 'core-donors.json')

        # Save Summary files
        self._generate_project_summary(self.projects)
        self.projectsummaries.save_json(self.api_path)

        # Save Other Jsons
        self.crsindex.save_json(self.api_path, 'crs-index.json')
        self.donorindex.save_json(self.api_path, 'donor-index.json')
        self.countrydonorindex.save_json(self.api_path, 'donor-country-index.json')
        self._generate_year_index()

        # Top Donor Gross Index
        self._populate_top_donor_gross_index()
        self.topdonor_gross.save_json(self.api_path, 'top-donor-gross-index.json')

        # Top Donor Local Index
        self._populate_top_donor_local_index()
        self.topdonor_local.save_json(self.api_path, 'top-donor-local-index.json')

        # Region Index
        self._populate_region_index()
        self.region_index.save_json(self.api_path, 'region-index.json')

        # Focus Area Index
        focus = FocusAreaIndex()
        focus.save_json(self.api_path, 'focus-area-index.json')

        # Generating HDI
        self._generate_hdi()

        # Save Operating Unit Index
        self._populate_operating_unit_index()
        self.operating_unit_index.save_json(self.api_path, 'operating-unit-index.json')

    def _prepare(self, xml_file, tag, op_type):
        """Prepares and executes other methods to prepare the data.

        Arguments:
        xml_file - full path to the xml file
        tag -- one choice is available: iati-activity
        op_type -- only two choices available: outputs - projects

        """

        # Get IATI activities XML
        iter_obj = iter(etree.iterparse(xml_file, tag=tag))

        # Extract year
        try:
            year = int(self.extract_years([xml_file])[0])
            self.years = year
        except ValueError:
            return
        func = getattr(self, '_populate_%s' % op_type)

        func(iter_obj, year)

    def _populate_operating_unit_index(self):

        current_year = sorted(list(self.years), reverse=True)[0]

        country_isos = self.get_and_sort('%s/country_iso.csv' % settings.UNDP_EXPORT, 'iso3')
        units = self.get_and_sort(self.undp_export + '/report_units.csv', 'operating_unit')

        iso3 = dict([(i['iso3'].decode('utf-8').encode('ascii', 'ignore'),
                      i['iso_num'].decode('utf-8').encode('ascii', 'ignore')) for i in country_isos])

        units_index = dict([(i['operating_unit'], i['fund_type']) for i in units])

        for country in self.geo:
            if country['iso3'] in self.units.pks:
                obj = OperatingUnit()

                obj.id.value = country['iso3']
                obj.fund_type.value = units_index[obj.id.value]

                obj.name.value = country[obj.name.key]
                if country[obj.lat.key] != '':
                    obj.lat.value = country[obj.lat.key]
                    obj.lon.value = country[obj.lon.key]

                if obj.id.value in iso3:
                    obj.iso_num.value = iso3[obj.id.value]

                # Looping through project summaries to get total budgets
                funding_source = set()
                for project in self.projectsummaries.collection[current_year]:
                    if project.operating_unit.value == obj.id.value:
                        obj.project_count.value += 1
                        obj.budget_sum.value += round(project.budget.value, 2)
                        obj.expenditure_sum.value += round(project.expenditure.value, 2)
                        for item in project.donors.value:
                            funding_source.add(item)

                        project_obj = self.projects.collection[project.id.value]

                        obj.email.value = project_obj.operating_unit_email.value
                        obj.web.value = project_obj.operating_unit_website.value

                obj.funding_sources_count.value = len(funding_source)

                self.operating_unit_index.add(obj.id.value, obj)

    def _populate_core_donors(self):

        cores = self.get_and_sort(settings.DONOR_DATA + '/core_fund.csv', 'Donor')

        for core in cores:
            obj = CoreDonor()

            obj.donor_id.value = core['Donor']
            obj.description.value = core['Donor Desc']
            obj.short_description.value = core['Donor Level 3']

            # Adding extra zeros to the begining of donor ids to make them 5 characters
            additional_zeros = 5 - len(obj.donor_id.value)
            obj.donor_id.value = '%s%s' % (('0' * additional_zeros), obj.donor_id.value)

            self.core_donors.add(obj.donor_id.value, obj)

    def _populate_region_index(self):

        units = self.get_and_sort(self.undp_export + '/report_units.csv', 'bureau')
        choices = ['PAPP', 'RBA', 'RBAP', 'RBAS', 'RBEC', 'RBLAC']

        for unit in units:

            if (unit['bureau'] in choices and unit['hq_co'] == 'HQ') or unit['bureau'] == 'PAPP':
                if unit['ou_descr'] != 'Regional Center - Addis Ababa':
                    obj = Region()

                    obj.name.value = unit['ou_descr']
                    obj.id.value = unit['bureau']

                    try:
                        self.region_index.add(obj.id.value, obj)
                    except ObjectExists:
                        pass

        obj = Region()
        obj.name.value = 'Global'
        obj.id.value = 'global'

        self.region_index.add(obj.id.value, obj)

    def _populate_top_donor_local_index(self):

        local = self.get_and_sort(self.undp_export + '/donor_local.csv', 'donor')

        for item in local:
            obj = TopDonorLocal()

            obj.name.value = item[obj.name.key]
            obj.country.value = item[obj.country.key]
            obj.amount.value = item[obj.amount.key]
            obj.donor_id.value = self.donor_ids.collection.get(item['donor'], None)

            self.topdonor_local.add(obj.donor_id.value, obj)

    def _populate_top_donor_gross_index(self):

        gross = self.get_and_sort(self.undp_export + '/donor_gross.csv', 'donor')

        for item in gross:
            obj = TopDonor()

            obj.name.value = item[obj.name.key]
            obj.country.value = item[obj.country.key]
            obj.regular.value = item[obj.regular.key]
            obj.other.value = item[obj.other.key]
            obj.total.value = item[obj.total.key]
            obj.donor_id.value = self.donor_ids.collection.get(item['donor'], None)

            self.topdonor_gross.add(obj.donor_id.value, obj)

    def _generate_project_summary(self, projects):

        donors = self.get_and_sort(self.undp_export + '/report_donors.csv', 'awardID')
        report_donors = ReportDonors()

        # Create an index of donors based on awardID
        for item in donors:
            report_donors.add_update_list(item['awardID'], item)
            try:
                self.donor_ids.add(item['donor_type_lvl3_descr'], item['donorID'])
            except ObjectExists:
                pass

        regionsList = ['PAPP', 'RBA', 'RBAP', 'RBAS', 'RBEC', 'RBLAC']

        # Looping through years of projects
        counter = 0
        for project in projects.collection.values():
            for year in project.fiscal_year.value:

                # Should create a new model instance for each year of the project as they are stored in separate
                # summary files
                obj = ProjectSummary()

                # set region
                if project.region_id.value not in regionsList:
                    obj.region.value = 'global'
                else:
                    obj.region.value = project.region_id.value

                obj.operating_unit.value = project.operating_unit_id.value
                obj.name.value = project.project_title.value
                obj.id.value = project.project_id.value
                obj.fiscal_year.value = year

                # Fill out fields from report donors list
                try:
                    country = defaultdict(lambda: defaultdict(float))
                    for item in report_donors.collection[project.project_id.value]:
                        if int(item['fiscal_year']) == int(year) and item['donorID']:
                            country[item['donorID']]['budget'] += float(item['budget'])
                            country[item['donorID']]['expenditure'] += float(item['expenditure'])
                            country[item['donorID']]['type'] = item['donor_type_lvl1'].replace(" ", "")

                            if item['donor_type_lvl1'] == 'PROG CTY' or item['donor_type_lvl1'] == 'NON_PROG CTY':
                                country[item['donorID']]['name'] = item['donor_type_lvl3'].replace(" ", "")
                            elif item['donor_type_lvl1'] == 'MULTI_AGY':
                                country[item['donorID']]['name'] = item['donor_type_lvl1'].replace(" ", "")
                            else:
                                country[item['donorID']]['name'] = 'OTH'

                            # country[item['donorID']]['name'] = item['donor_type_lvl3']

                            if item['donorID'] == '00012':
                                obj.core.value = True

                    for key, value in country.iteritems():
                        obj.donor_countries.value.append(value['name'])
                        obj.donor_budget.value.append(value['budget'])
                        obj.donor_expend.value.append(value['expenditure'])
                        obj.donor_types.value.append(value['type'])
                        obj.donors.value.append(key)

                except KeyError:
                    # There are few projects ids that are not appearing the donor list. this catch resolve them
                    pass

                obj.expenditure.value = sum(obj.donor_expend.value)
                obj.budget.value = sum(obj.donor_budget.value)

                # Get other information from outputs
                for output in project.outputs.value:
                    obj.crs.value.add(output['crs'])
                    obj.focus_area.value.add(output['focus_area'])

                self.projectsummaries.add_update_list(year, obj)
                counter += 1

        self.log('%s summary projects processed' % counter)

    def _generate_year_index(self):
        """ Generates year-index.js """

        writeout = 'var FISCALYEARS = %s' % sorted(map(str, list(self.years)), reverse=True)
        f_out = open('%s/year-index.js' % self.api_path, 'wb')
        f_out.writelines(writeout)
        f_out.close()
        self.log('Year Index Generated')

    def _populate_units(self, project_obj):
        """ Fill Units collections """

        unit_project = UnitProject()
        unit_project.title.value = project_obj.project_title.value
        unit_project.id.value = project_obj.project_id.value

        if project_obj.operating_unit_id.value in self.units.pks:
            self.units.collection[project_obj.operating_unit_id.value].projects.value.append(unit_project.to_dict())
        else:
            unit = Unit()
            unit.op_unit.value = project_obj.operating_unit_id.value
            unit.projects.value.append(unit_project.to_dict())
            self.units.add(project_obj.operating_unit_id.value, unit)

    def _populate_projects(self, iter_obj, yr):
        """Loop through the iter_obj to and sort/clean data based project_id

        Produced a list of dictionaries. Sample:
        {'end': '2012-12-31', 'operating_unit_email': 'registry.lt@undp.org',
        'inst_id': '', 'operating_unit': 'Lithuania, Republic of',
        'iati_op_id': 'LT', 'inst_descr': '', 'start': '2005-01-01',
        'operating_unit_id': 'LTU',
        'operating_unit_website': 'http://www.undp.lt/',
        'project_id': '00038726', 'inst_type_id': '',
        'document_name': u'http://www.undp.org/content/dam/undp/documents/projects/LTU/00038726/RC fund.pdf'}

        Arguments:
        iter_obj - and iteratble etree object
        """
        counter = 0

        # Get sorted units
        report_units = self.get_and_sort(self.undp_export + '/report_units.csv', 'operating_unit')

        # Loop through each IATI activity in the XML
        for event, p in iter_obj:

            # IATI hierarchy used to determine if output or input1
            hierarchy = p.attrib['hierarchy']

            # Check for projects
            if hierarchy == '1':
                obj = Project()

                obj.project_id.value = self._grab_award_id(p[1].text)

                # Check if the project_id is unique
                if obj.project_id.value in self.projects.pks:
                    continue

                obj.fiscal_year.value.append(yr)
                obj.project_title.value = p.find(obj.project_title.xml_key).text.lower()

                obj.project_descr.value = p.find(obj.project_descr.xml_key).text
                documents = p.findall('./document-link')

                if documents:
                    names = []
                    links = []
                    for doc in documents:
                        links.append(urllib2.unquote(doc.get('url')).decode('utf-8'))

                        for d in doc.iterchildren(tag=obj.document_name.key):
                            names.append(d.text)

                    obj.document_name.value.extend([names, links])

                # Find start and end dates
                obj.start.value = p.find(obj.start.xml_key).text
                obj.end.value = p.find(obj.end.xml_key).text

                contact = p.findall('./contact-info')
                obj.operating_unit_email.value = [e.text for email in contact
                                                  for e in email.iterchildren(tag=obj.operating_unit_email.key)][0]

                # Find operating_unit
                # If recipient country didn't exist look for recipient region
                try:
                    obj.iati_op_id.value = (p.find(obj.iati_op_id.xml_key).attrib.get('code'))
                    obj.operating_unit.value = p.find(obj.operating_unit.xml_key).text
                    for r in report_units:
                        if (obj.iati_op_id.value == r['iati_operating_unit']
                                or obj.iati_op_id.value == r['operating_unit']):
                            obj.operating_unit_id.value = r['operating_unit']
                            obj.region_id.value = r[obj.region_id.key]

                except:
                    region_unit = p.findall("./recipient-region")
                    for ru in region_unit:
                        for r in report_units:
                            if ru.text == r['ou_descr']:
                                obj.operating_unit_id.value = r['operating_unit']
                                obj.operating_unit.value = r['ou_descr']
                    obj.iati_op_id.value = '998'

                # find contact info
                try:
                    for email in contact:
                        for e in email.iterchildren(tag=obj.operating_unit_email.key):
                            obj.operating_unit_email.value = e.text

                    obj.operating_unit_website.value = p.find(obj.operating_unit_website.xml_key).text
                except:
                    pass

                # Check for implementing organization
                try:
                    inst = p.find("./participating-org[@role='Implementing']")
                    obj.inst_id.value = inst.attrib.get(obj.inst_id.key)
                    obj.inst_type_id.value = inst.attrib.get(obj.inst_type_id.key)
                    obj.inst_descr.value = inst.text
                except:
                    pass

                # Populate the Unit Collection
                self._populate_units(obj)

                counter += 1
                self.log('Processing: %s' % counter, True)

                self.projects.add(obj.project_id.value, obj)

        self.log('%s - Project Annuals: %s rows processed' % (yr, counter))

    def _populate_outputs(self, iter_obj, yr):

        counter = 0

        # Get sorted country donoros
        sorted_donors = self.get_and_sort(self.undp_export + '/country_donors_updated.csv', 'id')

        # Get South-South projects

        ss_list = self.get_and_list(self.undp_export + '/SSCprojects_IDlist.csv', 'projectid')

        for event, o in iter_obj:
            hierarchy = o.attrib['hierarchy']

            if hierarchy == '2':
                obj = Output()
                crs = Crs()

                obj.output_id.value = self._grab_award_id(o[1].text)

                # Check if the project_id is unique
                if obj.output_id.value in self.outputs.output_ids:
                    continue

                obj.output_title.value = o.find(obj.output_title.xml_key).text
                obj.output_descr.value = o.find(obj.output_descr.xml_key).text

                try:
                    obj.gender_id.value = o.find(obj.gender_descr.xml_key).attrib.get(obj.gender_id.key)
                    obj.gender_descr.value = o.find(obj.gender_descr.xml_key).text
                except:
                    obj.gender_id.value = "0"
                    obj.gender_descr.value = "None"

                try:
                    obj.crs.value = o.find(obj.crs_descr.xml_key).get(obj.crs.key)
                    crs.name.value = obj.crs.value
                except AttributeError:
                    pass

                try:
                    obj.crs_descr.value = o.find(obj.crs_descr.xml_key).text
                    crs.id.value = obj.crs_descr.value
                except AttributeError:
                    pass

                try:
                    self.crsindex.add(crs.id.value, crs)
                except ObjectExists:
                    pass

                try:
                    obj.award_id.value = self._grab_award_id(o.find(obj.award_id.xml_key).get('ref'))
                except:
                    obj.award_id.value = self._grab_award_id(o.find("./related-activity[@type='2']").get('ref'))

                try:
                    if obj.award_id.value in ss_list:
                        obj.focus_area.value = '5'
                        obj.focus_area_descr.value = 'South-South'

                    else:
                        obj.focus_area.value = o.find(obj.focus_area_descr.xml_key).get(obj.focus_area.key)
                        obj.focus_area_descr.value = o.find(obj.focus_area_descr.xml_key).text

                except:
                    obj.focus_area.value = "-"
                    obj.focus_area_descr.value = "-"

                for donor in o.findall("./participating-org[@role='Funding']"):
                    ref = donor.get('ref')
                    obj.donor_id.value.add(ref)
                    if ref == '00012':
                        obj.donor_name.value.append('Voluntary Contributions')
                    else:
                        obj.donor_name.value.append(donor.text)

                    for d in sorted_donors:
                        # Check IDs from the CSV against the cntry_donors_sort.
                        # This provides funding country names not in XML
                        if d['id'] == ref:
                            # for outputs
                            obj.donor_short.value.append(d[obj.donor_short.key])

                # Find budget information to later append to projectFY array
                budget_expend = defaultdict(lambda: defaultdict(float))
                obj.budget.temp = o.findall(obj.budget.xml_key)
                for budget in obj.budget.temp:
                    for b in budget.iterchildren(tag='value'):
                        year = int(b.get('value-date').split('-', 3)[0])
                        budget_expend[year]['budget'] = float(b.text)

                # Use transaction data to get expenditure
                for tx in o.findall('transaction'):
                    for expen in tx.findall(obj.expenditure.xml_key):
                        for sib in expen.itersiblings():
                            if sib.tag == 'value':
                                year = int(sib.get('value-date').split('-', 3)[0])
                                budget_expend[year]['expenditure'] = float(sib.text)

                for key, value in budget_expend.iteritems():
                    obj.fiscal_year.value.append(key)
                    obj.budget.value.append(value['budget'])
                    obj.expenditure.value.append(value['expenditure'])

                # Run subnationals
                locations = o.findall('location')
                if locations:
                    self._populate_subnationals(obj.award_id.value, obj, o, locations)

                # Populate Donor Index
                self._populate_donor_index(o)

                counter += 1
                self.log('Processing: %s' % counter, True)
                self.outputs.add_update_list(obj.award_id.value, obj)

        self.log('%s - output Annuals: %s rows processed' % (yr, counter))

    def _populate_subnationals(self, project_id, output_obj, node, locations):
        """ Populate subnational object. This is dependant on _populate_outputs and cannot be executed separately

        project_id - the related project_id
        output_id - output model object
        node - output xml object

        Returns:
            Populatess subnationals property
        """

        counter = 0
        for location in locations:
            obj = Subnational()
            counter += 1
            obj.awardID.value = project_id

            obj.outputID.value = output_obj.output_id.value
            obj.output_locID.value = "%s-%d" % (obj.outputID.value, counter)

            # Focus areas
            obj.focus_area.value = output_obj.focus_area.value
            obj.focus_area_descr.value = output_obj.focus_area_descr.value

            for item in location.iterchildren():
                if item.tag == 'coordinates':
                    obj.lat.value = item.get(obj.lat.key)
                    obj.lon.value = item.get(obj.lon.key)
                    obj.precision.value = item.get(obj.precision.key)

                if item.tag == 'name':
                    obj.name.value = item.text

                if item.tag == 'location-type':
                    obj.type.value = item.get(obj.type.key)

                # IATI 1.04
                if item.tag == 'point':
                    pos = item.getchildren()
                    lat_lon = pos[0].text.split(' ')
                    obj.lat.value = lat_lon[0]
                    obj.lon.value = lat_lon[1]

                # IATI 1.04
                if item.tag == 'exactness':
                    obj.precision.value = item.get('code')

                # IATI 1.04
                if item.tag == 'feature-designation':
                    obj.type.value = item.get(obj.type.key)

            self.subnationals.add_update_list(project_id, obj)

    def _populate_donor_index(self, output_obj):
        """ Populates both donor-index and donor-country-index """

        if not self.country_donors:
            self.country_donors = self.get_and_sort(self.undp_export + '/country_donors_updated.csv', 'id')

        for donor in output_obj.findall("./participating-org[@role='Funding']"):
            obj = Donor()
            country_obj = CountryDonor()
            ref = donor.get(obj.id.key)
            if ref:

                for item in self.country_donors:
                    if ref == item['id']:

                        # Skip the loop if the ref already is added
                        if ref not in self.donorindex.pks:
                            obj.id.value = ref

                            obj.name.value = donor.text or "Unknown"

                            if item['donor_type_lvl1'] == 'PROG CTY' or item['donor_type_lvl1'] == 'NON_PROG CTY':
                                obj.country.value = item['donor_type_lvl3'].replace(" ", "")
                            elif item['donor_type_lvl1'] == 'MULTI_AGY':
                                obj.country.value = item['donor_type_lvl1'].replace(" ", "")
                            else:
                                obj.country.value = 'OTH'

                            self.donorindex.add(obj.id.value, obj)

                        if item['donor_type_lvl3'] not in self.countrydonorindex.pks:
                            country_obj.id.value = item['donor_type_lvl3']
                            country_obj.name.value = item['donor_type_lvl3_descr']

                            self.countrydonorindex.add(item['donor_type_lvl3'], country_obj)

    def _search_list_dict(_list, key, search):
        result = [item for item in _list if item[key] == search]
        if len(result) > 0:
            return result
        else:
            return False

    def _generate_hdi(self):

        hdi = self.get_and_sort('%s/hdi-csv-clean.csv' % settings.HDI, 'hdi2013')
        self.geo = self.get_and_sort('%s/country-centroids.csv' % settings.PROCESS_FILES, 'iso3')

        # Add current year to the years array
        years = [1980, 1985, 1990, 1995, 2000, 2005, 2006, 2007, 2008, 2011, 2012, 2013]
        # Set current year to the latest year of HDI Data
        current_year = 2013

        row_count = 0
        rank = 0
        hdi_index = []
        hdi_dict = {}
        for val in iter(hdi):
            row_count = row_count + 1
            hdi_total = []
            hdi_health = []
            hdi_ed = []
            hdi_inc = []
            change = []
            change_year = {}
            for y in years:
                if val['hdi%d' % y] != '':
                    if val['ed%d' % y] != "" and val['health%d' % y] != "" and val['income%d' % y] != "":
                        hdi_total.append([y, round(float(val['hdi%d' % y]), 3)])
                        hdi_health.append([y, round(float(val['health%d' % y]), 3)])
                        hdi_ed.append([y, round(float(val['ed%d' % y]), 3)])
                        hdi_inc.append([y, round(float(val['income%d' % y]), 3)])
                        if y != current_year:
                            change_year = round(float(val['hdi%d' % current_year]),
                                                3) - round(float(val['hdi%d' % y]), 3)
                            if len(change) == 0:
                                change.append(change_year)
            if len(change) == 0:
                change.append("")
            for ctry in self.geo:
                if ctry['name'] == val['country']:
                    if val['hdi%d' % current_year] == "":
                        g = {
                            "id": ctry['iso3'],
                            "name": val['country'],
                            "hdi": "",
                            "health": "",
                            "income": "",
                            "education": "",
                            "change": change[0],
                            "rank": "n.a."
                        }
                    else:
                        if ctry['iso3'].rfind("A-", 0, 2) == 0:
                            g = {
                                "id": ctry['iso3'],
                                "name": val['country'],
                                "hdi": hdi_total,
                                "health": hdi_health,
                                "income": hdi_inc,
                                "education": hdi_ed,
                                "change": change[0],
                                "rank": "n.a."
                            }
                        else:
                            rank = rank + 1

                            g = {
                                "id": ctry['iso3'],
                                "name": val['country'],
                                "hdi": hdi_total,
                                "health": hdi_health,
                                "income": hdi_inc,
                                "education": hdi_ed,
                                "change": change[0],
                                "rank": rank
                            }
                    hdi_index.append(g)
                    uid = ctry['iso3']
                    hdi_dict[uid] = copy.deepcopy(g)
                    hdi_dict[uid].pop('id')
                    hdi_dict[uid].pop('name')

        hdi_dict['total'] = rank
        hdi_index_sort = sorted(hdi_index, key=lambda x: x['rank'])
        hdi_writeout = json.dumps(hdi_index_sort, sort_keys=True, separators=(',', ':'))
        hdi_out = open('%s/hdi.json' % self.api_path, 'wb')
        hdi_out.writelines(hdi_writeout)
        hdi_out.close()

        jsvalue = "var HDI = "
        jsondump = json.dumps(hdi_dict, sort_keys=True, separators=(',', ':'))
        writeout = jsvalue + jsondump
        f_out = open('%s/hdi.js' % self.api_path, 'wb')
        f_out.writelines(writeout)
        f_out.close()

        self.log('HDI json generated')

    def extract_years(self, filenames):
        """Extract years from filenames
        filenames must be in this format: atlas_projects_2011.xml

        Arguments:
        filenames -- an array of filenames
        """
        return [f[-8:-4] for f in filenames]

    def _grab_award_id(self, text):
        """ grabs award id from the xml text

        @example
        Text: XM-DAC-41114-PROJECT-00068618
        Return: 00068618
        """
        return text.split('-')[-1]
