from __future__ import print_function
import sys
from exceptions import NotImplementedError
from sets import Set
import json

from models import CountryDonor

class ObjectExists(Exception):
    """ The object exists in the collection """
    pass


class Collection(object):

    """ Keeps a collection of objects with the ability to add/update and retrieve """

    def __init__(self):

        self._collection = {}
        self._pks = Set()

    @property
    def collection(self):
        """
        Returns a dictionary of primary keys and related objects

        Example:
            {1: [<object1>, <object2>]}
        """

        return self._collection

    @property
    def pks(self):
        return self._pks

    def add_update_list(self, pk, obj):
        """ add pk with a list of objs. If pk exists, append the obj list """
        self._pks.add(pk)
        try:
            self._collection[pk].append(obj)
        except KeyError:
            self._collection.update({pk: [obj]})

    def add(self, pk, obj):
        """
        Adds a new pk/obj pair to the collection
        Raises error if the pk already exists in the collection
        """
        if not pk in self._collection:
            self._collection.update({pk: obj})
            self._pks.add(pk)
        else:
            raise ObjectExists('the object exists in the collection')

    def delete(self, pk):
        """ Deletes the pk from the collection """
        raise NotImplementedError

    def save_json(self, path, name):
        j_file = open('%s/%s' % (path, name), 'w')

        _list = []
        for item in self.collection.values():
            _list.append(item.to_dict())
        j_file.write(json.dumps(_list))
        j_file.close()

        self.log('%s generated' % name)

    def log(self, message, inline=False):
        """ Print function with verbos twists """
        if inline:
            print(message, end='\r')
            sys.stdout.flush()
        else:
            print(message)


class Projects(Collection):

    """ Projects Collection """
    pass

    def save_json(self, outputs, subnationals, file_path):
        """ Store projects as json files on disk

        Sample json file
        {
            "project_descr": "Conservation de la  bi arides en Alg\u00e9rie",
            "fiscal_year": [2014, 2012, 2011],
            "end": "2014-12-31",
            "region_id": "RBAS",
            "operating_unit_email": "registry.dz@undp.org",
            "inst_id": "00045",
            "outputs": [{
                "output_id": "00011090",
                "crs": "41010",
                "donor_id": ["00012", "10003"],
                "focus_area": "4",
                "gender_descr": "Gender Equality",
                "output_title": "management of natural resource",
                "budget": [32326.0, 34819.0, 48244.0],
                "fiscal_year": [2014, 2012, 2011],
                "gender_id": "1",
                "donor_name": ["Voluntary Contributions", "Global Environment Fund Truste"],
                "award_id": "00011090",
                "output_descr": "Preservation of biodiversity and long-lasting resources in Algeria.",
                "donor_short": ["UNDP", "GEFTrustee"],
                "expenditure": [],
                "crs_descr": "Environmental policy and administrative management",
                "focus_area_descr": "Environment & sustainable development"
            }],
            "subnational": [{
                "outputID": "00011090",
                "output_locID": "00011090-1",
                "name": "Algeria",
                "focus_area": "-",
                "lat": "36.7525",
                "type": "PCL",
                "awardID": "00011090",
                "lon": "3.04197",
                "precision": "9",
                "focus_area_descr": "-"
            }],
            "operating_unit": "Algeria",
            "budget": 115389.0,
            "iati_op_id": "DZ",
            "inst_descr": "National Execution",
            "start": "2002-01-01",
            "operating_unit_id": "DZA",
            "expenditure": 0.0,
            "document_name": [
                ["UNDP-DZ-CPAP2012-2014"],
                ["http://www.dz.undp.org/_jcr_content/centerparsys/download_3/file.res/UNDP-DZ-CPAP2012-2014.pdf"]
            ],
            "project_id": "00011090",
            "inst_type_id": "10",
            "operating_unit_website": "http://www.dz.undp.org/",
            "project_title": "renforcement des capacit\u00e9s des ongs pour la biodiversit\u00e9"
        }

        """

        counter = 0
        for pid in self.pks:
            counter += 1

            # Add outputs to project
            if pid in outputs.pks:
                for item in outputs.collection[pid]:
                    self.collection[pid].outputs.value.append(item.to_dict())

                    self.collection[pid].budget.value += sum(item.budget.value)
                    self.collection[pid].expenditure.value += sum(item.expenditure.value)
                    for year in item.fiscal_year.value:
                        if year not in self.collection[pid].fiscal_year.value:
                            self.collection[pid].fiscal_year.value.append(year)

            # Add subnationals to projects
            if pid in subnationals.pks:
                for item in subnationals.collection[pid]:
                    self.collection[pid].subnational.value.append(item.to_dict())

            self.log('%s project json files processed' % counter, True)
            self.collection[pid].save('%s/projects' % file_path)

        self.log('%s project json files stored on disk' % counter)


class Outputs(Collection):

    """ Outputs Collection """

    def __init__(self):
        super(Outputs, self).__init__()
        self._output_ids = Set()

    @property
    def output_ids(self):
        return self._output_ids

    def add_update_list(self, pk, obj):
        super(Outputs, self).add_update_list(pk, obj)
        self._output_ids.add(obj.output_id.value)

    def add(self, pk, obj):
        super(Outputs, self).add(pk, obj)
        self._output_ids.add(obj.output_id.value)


class Subnationals(Collection):
    """ Subnationals Collection """
    pass


class Units(Collection):
    """ Units Collection """
    pass

    def save_json(self, subnationals, path):

        counter = 0
        for uid in self.pks:
            for key, project in enumerate(self.collection[uid].projects.value):
                try:
                    for item in subnationals.collection[project['id']]:
                        self.collection[uid].projects.value[key]['subnational'].append(item.to_dict())
                except KeyError:
                    pass
            counter += 1
            self.collection[uid].save('%s/units' % path)
            self.log('%s unit json files processed' % counter, True)

        self.log('%s unit json files stored on disk' % counter)


class CrsIndex(Collection):
    """ Crs Collection """
    pass


class DonorIndex(Collection):
    """ Collection of Donors """
    pass


class CountryDonorIndex(Collection):
    """ Collection of Country Donor """

    def __init__(self):

        super(CountryDonorIndex, self).__init__()

        default = [
            {"id": "OTH", "name": "Others"},
            {"id": "MULTI_AGY", "name": "Multi-lateral Agency"}
        ]
        for item in default:
            obj = CountryDonor()
            obj.id.value = item['id']
            obj.name.value = item['name']
            self.add(obj.id.value, obj)


class ProjectSummaries(Collection):
    """ Collection of Project Summaries """

    def save_json(self, path):

        for pk in self.pks:

            j_file = open('%s/project_summary_%s.json' % (path, pk), 'w')

            _list = []
            for item in self.collection[pk]:
                _list.append(item.to_dict())

            # Generate json file
            j_file.write(json.dumps(_list))
            j_file.close()

            self.log('%s summary json files generated' % pk)


class ReportDonors(Collection):
    """ Collection rows from report_donors.csv """
    pass


class DonorIDs(Collection):
    """ Collection of all Donor Names and IDs """
    pass


class TopDonorGrossIndex(Collection):
    pass


class TopDonorLocalIndex(Collection):
    pass


class RegionIndex(Collection):
    pass


class FocusAreaIndex(Collection):

    def __init__(self):

        self._collection = {}
        self._collection[1] = [
            {
                "color": "049fd9",
                "id": "2",
                "name": "Democratic governance"
            }, {
                "color": "ff5640",
                "id": "3",
                "name": "Crisis prevention & recovery"
            }, {
                "color": "c8c605",
                "id": "1",
                "name": "Poverty reduction & MDG achievement"
            }, {
                "color": "6ab139",
                "id": "4",
                "name": "Environment & sustainable development"
            }, {
                "color": "0066a0",
                "id": "5",
                "name": "South-South"
            }
        ]

    def save_json(self, path, name):
        j_file = open('%s/%s' % (path, name), 'w')

        # print(self.collection['1'])

        j_file.write(json.dumps(self.collection[1]))
        j_file.close()

        self.log('%s generated' % name)


class OperatingUnitIndex(Collection):
    pass


class CoreDonors(Collection):
    pass


class Donors(Collection):
    pass
