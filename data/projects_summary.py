import csv, sys, json

# Open file
undp = csv.DictReader(open('csv/undp-project-summary.csv', 'rb'), delimiter = ',', quotechar = '"')

# Sort on project id
undp_sort = sorted(undp, key = lambda x: x['project_id'])

row_count = 0
for row in undp_sort:
    row_count = row_count + 1

print "Processing..."
print "Processed %d rows" % row_count
writeout = json.dumps(undp_sort, sort_keys=True, indent=4)

f_out = open('index/project_summary.json', 'wb')
f_out.writelines(writeout)
f_out.close()
