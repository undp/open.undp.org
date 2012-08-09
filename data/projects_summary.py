import csv, sys, json, gzip
from itertools import groupby

#Read in file
inFile = sys.argv[1]

# Open file
undp = csv.DictReader(open(inFile, 'rb'), delimiter = ',', quotechar = '"')

# Sort on project id
undp_sort = sorted(undp, key = lambda x: x['project_id'])

# format to pretty json
writeout = json.dumps(undp_sort, sort_keys=True, indent=4)

# write out to gzipped json
f_out = gzip.open('project_summary.json.gz', 'wb')
f_out.writelines(writeout)
f_out.close()
