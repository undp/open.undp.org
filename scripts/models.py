#
# UNDP Open Data
#

from exceptions import NotImplementedError
import json


class Field(object):

    """
    The class defining each field in the model

    Important instance variables:

    - name - The name of the field
    - key - The key used for the field in the original data
    - description - the description for the field
    - temp - used for holding temp variables in the cleanup process
    - type - type of the field, e.g. string, list, etc.
    """

    def __init__(self, name=None, key=None, description=None, default=None,
                 type=None, pk=False):
        self.name = name
        self.key = key
        self.description = description
        self.value = default
        self.temp = None
        self.type = type
        self.pk = pk

    @property
    def xml_key(self):
        return './' + str(self.key)

    def __repr__(self):
        try:
            return '%s' % self.value.encode('utf8')
        except AttributeError:
            return str(self.value)


class Model(object):

    """
    The model class represent the final output for each type of data
    """

    def is_equal(self, field, value):
        """Checks whether value exists in the instance variables

        Args:
            field - instance variable name e.g. award_id
            value - the value to check against
        """
        const = getattr(self, field)
        if const.value == value:
            return True
        else:
            return False

    def to_dict(self):
        """ Returns json representation of the model """
        output = {}
        for key in vars(self):
            var = getattr(self, key)
            if isinstance(var.value, set):
                var.value = list(var.value)
            output.update({var.name: var.value})

        return output

    def save(self, path):
        raise NotImplementedError


class Project(Model):

    """
    Project model - relies on output and subnational models

    Example of intended output:

    {
        "budget": [0.0],
        "document_name": [],
        "end": "2009-12-31",
        "expenditure": [-14933.0],
        "fiscal_year": ["2013"],
        "iati_op_id": "AF",
        "inst_descr": "",
        "inst_id": "",
        "inst_type_id": "",
        "operating_unit": "Afghanistan",
        "operating_unit_email": "registry.af@undp.org",
        "operating_unit_id": "AFG",
        "operating_unit_website": "http://www.undp.org.af/",
        "outputs": [{
            "award_id": "00011031",
            "budget": [0.0],
            "crs": "73010",
            "crs_descr": "Reconstruction relief and rehabilitation",
            "donor_id": ["00078", "00141"],
            "donor_name": ["GOVERNMENT OF CANADA", "GOVERNMENT OF JAPAN"],
            "donor_short": ["CAN", "JPN"],
            "expenditure": [-14933.0],
            "fiscal_year": ["2013"],
            "focus_area": "3",
            "focus_area_descr": "Crisis prevention & recovery",
            "gender_descr": "Gender Equality",
            "gender_id": "1",
            "output_descr": null,
            "output_id": "00011031",
            "output_title": "Partnership for Peace"
        }],
        "project_descr": "Partnership for Peace - Afghanistan's New Beginnings Programme - ANBP",
        "project_id": "00011031",
        "project_title": "Partnership for Peace",
        "region_id": "RBAP",
        "start": "2003-03-01",
        "subnational": [{
            "awardID": "00011031",
            "focus_area": "3",
            "focus_area_descr": "Crisis prevention & recovery",
            "lat": "33",
            "lon": "66",
            "name": "Afghanistan",
            "outputID": "00011031",
            "output_locID": "00011031-1",
            "precision": "9",
            "type": "PCL"
        }]
    }

    """

    def __init__(self):

        self.budget = Field(name='budget', default=0.0)
        self.document_name = Field(name="document_name", default=[], key="title")
        self.end = Field(name='end', key="activity-date[@type='end-planned']")
        self.expenditure = Field(name='expenditure', default=0.0)
        self.fiscal_year = Field(name="fiscal_year", default=[])
        self.iati_op_id = Field(name='iati_op_id', key='recipient-country')
        self.inst_id = Field(name='inst_id', key="ref", default='')
        self.inst_type_id = Field(name='inst_type_id', key='type', default='')
        self.inst_descr = Field(name='inst_descr', default='')
        self.operating_unit = Field(name='operating_unit', key='recipient-country')
        self.operating_unit_email = Field(name='operating_unit_email', key='email')
        self.operating_unit_id = Field(name='operating_unit_id')
        self.operating_unit_website = Field(name='operating_unit_website', key='activity-website')
        self.outputs = Field(name='outputs', default=[])
        self.project_descr = Field(name='project_descr', key='description')
        self.project_id = Field(name='project_id', pk=True)
        self.project_title = Field(name='project_title', key='title')
        self.region_id = Field(name='region_id', key='bureau', default='global')
        self.start = Field(name='start', key="activity-date[@type='start-actual']")
        self.subnational = Field(name='subnational', default=[])

    def save(self, path):
        j_file = open('%s/%s.json' % (path, self.project_id), 'w')
        j_file.write(json.dumps(self.to_dict()))
        j_file.close()


class Output(Model):

    """
    Ouptut model - nested inside the project model

    Intended output:
    {
        "award_id": "00011031",
        "budget": [0.0],
        "crs": "73010",
        "crs_descr": "Reconstruction relief and rehabilitation",
        "donor_id": ["00078", "00141"],
        "donor_name": ["GOVERNMENT OF CANADA", "GOVERNMENT OF JAPAN"],
        "donor_short": ["CAN", "JPN"],
        "expenditure": [-14933.0],
        "fiscal_year": ["2013"],
        "focus_area": "3",
        "focus_area_descr": "Crisis prevention & recovery",
        "gender_descr": "Gender Equality",
        "gender_id": "1",
        "output_descr": null,
        "output_id": "00011031",
        "output_title": "Partnership for Peace"
    }
    """

    def __init__(self):

        self.award_id = Field(name='award_id', key="related-activity[@type='1']", type='string')
        self.budget = Field(name='budget', key='budget', default=[], type='list')
        self.crs = Field(name='crs', key='code', type='string')
        self.crs_descr = Field(name='crs_descr', key="sector[@vocabulary='DAC']", type='string')
        self.donor_id = Field(name='donor_id', default=[], type='list')
        self.donor_name = Field(name='donor_name', default=[], type='list')
        self.donor_short = Field(name='donor_short', key='short_descr', default=[], type='list')
        self.expenditure = Field(name='expenditure', key="transaction-type[@code='E']", default=[], type='list')
        self.fiscal_year = Field(name='fiscal_year', default=[], type='list')
        self.focus_area = Field(name='focus_area', key='code', type='string')
        self.focus_area_descr = Field(name='focus_area_descr', key="sector[@vocabulary='RO']", type='string')
        self.gender_id = Field(name='gender_id', key='code', type='string')
        self.gender_descr = Field(name='gender_descr', key='policy-marker', type='string')
        self.output_descr = Field(name='output_descr', key='description', type='string')
        self.output_id = Field(name='output_id', type='string')
        self.output_title = Field(name='output_title', key='title', type='string')


class Subnational(Model):
    """
    Subnational Model nested inside the project model

    Example:

    {
        "awardID": "00011031",
        "focus_area": "3",
        "focus_area_descr": "Crisis prevention & recovery",
        "lat": "33",
        "lon": "66",
        "name": "Afghanistan",
        "outputID": "00011031",
        "output_locID": "00011031-1",
        "precision": "9",
        "type": "PCL"
    }
    """

    def __init__(self):

        self.awardID = Field(name='awardID', key="related-activity[@type='1']", type='string')
        self.focus_area = Field(name='focus_area', key='code')
        self.focus_area_descr = Field(name='focus_area_descr', key="sector[@vocabulary='RO']")
        self.lat = Field(name='lat', key='latitude')
        self.lon = Field(name='lon', key='longitude')
        self.name = Field(name='name')
        self.outputID = Field(name='outputID')
        self.output_locID = Field(name='output_locID')
        self.precision = Field(name='precision', key='precision')
        self.type = Field(name='type', key='code')


class Unit(Model):
    """
    Unit Model - depends on subnational

    Exampe:

    {
        "iso_num": "004",
        "op_unit": "AFG",
        "projects": [{
            "id": "00065840",
            "subnational": [{
                "awardID": "00065840",
                "focus_area": "2",
                "focus_area_descr": "Democratic governance",
                "lat": "33",
                "lon": "66",
                "name": "Afghanistan",
                "outputID": "00082180",
                "output_locID": "00082180-1",
                "precision": "9",
                "type": "PCL"
            }],
            "title": "Afghanistan Integrity Initiative"
        }]
    }
    """

    def __init__(self):

        self.iso_num = Field(name='iso_num')
        self.op_unit = Field(name='op_unit')
        self.projects = Field(name='projects', default=[])

    def save(self, path):
        if self.op_unit.value:
            j_file = open('%s/%s.json' % (path, self.op_unit.value), 'w')
            j_file.write(json.dumps(self.to_dict()))
            j_file.close()


class ProjectSummary(Model):
    """ Project Summary Model """

    def __init__(self):

        self.region = Field(name='region')
        self.operating_unit = Field(name='operating_unit')
        self.name = Field(name='name')
        self.id = Field(name='id')
        self.focus_area = Field(name='focus_area', default=set())
        self.fiscal_year = Field(name='fiscal_year')
        self.expenditure = Field(name='expenditure', default=0)
        self.donors = Field(name='donors', default=[])
        self.donor_types = Field(name='donor_types', default=[])
        self.donor_expend = Field(name='donor_expend', default=[])
        self.donor_countries = Field(name='donor_countries', default=[])
        self.donor_budget = Field(name='donor_budget', default=[])
        self.crs = Field(name='crs', default=set())
        self.budget = Field(name='budget', default=0)
        self.core = Field(name='core', default=False)


class UnitProject(Model):
    """
    The nested model inside Unit
    """

    def __init__(self):

        self.title = Field(name='title')
        self.id = Field(name='id')
        self.subnational = Field(name='subnational', default=[])


class Crs(Model):

    def __init__(self):

        self.id = Field(name='id')
        self.name = Field(name='name')


class Donor(Model):

    def __init__(self):

        self.country = Field(name='country')
        self.id = Field(name='id', key='ref')
        self.name = Field(name='name')


class CountryDonor(Model):

    def __init__(self):

        self.id = Field(name='id', key='ref')
        self.name = Field(name='name')


class TopDonor(Model):

    """ Model to produce
    {
        "country": "AUS",
        "donor_id": "11854",
        "name": "Australia",
        "other": "65271739",
        "regular": "0",
        "total": "65271739"
    }
    """

    def __init__(self):

        self.country = Field(name='country', key='abbrev')
        self.donor_id = Field(name='donor_id', key='id')
        self.name = Field(name='name', key='donor')
        self.other = Field(name='other', key='other')
        self.regular = Field(name='regular', key='regular')
        self.total = Field(name='total', key='total')


class TopDonorLocal(Model):

    """ Model to produce

    {
        "amount": "294734620",
        "country": "ARG",
        "donor_id": "01441",
        "name": "Argentina"
    }

    """

    def __init__(self):

        self.amount = Field(name='amount', key='amount')
        self.country = Field(name='country', key='abbrev')
        self.donor_id = Field(name='donor_id', key='id')
        self.name = Field(name='name', key='donor')


class Region(Model):

    """ Model to produce:

    {
        "id": "RBA",
        "name": "Reg Bureau for Africa"
    }
    """

    def __init__(self):

        self.name = Field(name='name')
        self.id = Field(name='id')


class OperatingUnit(Model):

    """ Model for:

    {
        "budget_sum": 877342412.0,
        "email": "registry.af@undp.org",
        "expenditure_sum": 473070961.0,
        "fund_type": "Other",
        "funding_sources_count": 34,
        "id": "AFG",
        "iso_num": "004",
        "lat": 33.838806,
        "lon": 66.026471,
        "name": "Afghanistan",
        "project_count": 31,
        "web": "http://www.undp.org.af/"
    }
    """

    def __init__(self):

        self.budget_sum = Field(name='budget_sum')
        self.email = Field(name='email')
        self.expenditure_sum = Field(name='expenditure_sum')
        self.fund_type = Field(name='fund_type')
        self.funding_sources_count = Field(name='funding_sources_count')
        self.id = Field(name='id')
        self.iso_num = Field(name='iso_num')
        self.lat = Field(name='lat')
        self.lon = Field(name='lon')
        self.name = Field(name='name')
        self.project_count = Field(name='project_count')
        self.web = Field(name='web')


class CoreDonor(Model):

    def __init__(self):

        self.donor_id = Field(name='donor_id', key='donor')
        self.short_description = Field(name='short_description', key='Donor Short Desc')
        self.description = Field(name='description', key='Donor Desc')
