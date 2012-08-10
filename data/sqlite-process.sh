#!/bin/bash

mkdir csv/ 
mkdir index/ 

# Generate project (level1) summary csv from sqlite db output
echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output csv/undp-project-summary.csv 
select 
    c.awardid as project_id, c.bureau as region, c.rollup_ou as operating_unit, 
    sum(c.project_budget) as budget, sum(c.project_expenditure) as expenditure, 
    g.donors as donors 
    FROM ( select b.bureau, b.rollup_ou, b.awardid, 
        b.project_id, b.project_budget, b.project_expenditure, 
        b.fiscal_year, b.start_dt, b.end_dt 
        from report_outputs b) as c 
    LEFT JOIN ( select a.awardid, a.fiscal_year, a.award_title, 
            a.award_description, a.begin_dt, a.end_dt 
            from project_level1 as a) as d 
            on c.awardid = d.awardid and c.fiscal_year = d.fiscal_year 
    JOIN ( select f.awardid, f.fiscal_year, group_concat(f.descrshort, ",") as donors 
        from output_donor f group by f.project_id, f.fiscal_year ) as g 
        on g.awardid = c.awardid and g.fiscal_year = c.fiscal_year 
group by d.awardid;
.quit
!

echo "Project Summary CSV generated."

echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output csv/undp-project-full.csv
select
     c.awardid as project_id, c.bureau as region, c.rollup_ou as operating_unit,
     c.fiscal_year as fiscal_year, 
     d.award_title as project_title, d.award_description as project_description, d.begin_dt as project_start, d.end_dt as project_end,
     sum(c.project_budget) as budget, sum(c.project_expenditure) as expenditure, g.donors as donors
     from (select b.bureau, b.rollup_ou, b.awardid, b.project_id, b.project_budget, b.project_expenditure, b.fiscal_year, b.start_dt, b.end_dt
               from report_outputs b) as c
     left join (
          select
               a.awardid, a.fiscal_year, a.award_title, a.award_description, a.begin_dt, a.end_dt
               from project_level1 as a) as d
           on c.awardid = d.awardid and c.fiscal_year = d.fiscal_year
    join (
          select f.awardid, f.fiscal_year, group_concat(f.descrshort, ",") as donors from output_donor f group by f.project_id, f.fiscal_year
          ) as g on g.awardid = c.awardid and g.fiscal_year = c.fiscal_year
group by d.awardid, d.fiscal_year;
.quit
!

echo "Full Project List CSV generated."

echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output csv/undp-subproject-full.csv
select
     c.project_id as project_id, c.project_title as project_title, 
     c.project_description as project_description, c.project_start as project_start, 
     c.project_end as project_end, c.region as region, e.rollup_ou_description as operating_unit, 
     b.awardid as project_id2, b.project_id as subproject_id, 
     b.project_description as subproject_title, b.project_long_description as subproject_description, 
     b.fiscal_year as fiscal_year, b.project_budget as budget, b.project_expenditure as expenditure, 
     g.donors as donors, d.GenderMarkerDescription as gender_mark, b.sp1_fa as focus_area, 
     b.sp1_co as corporate_outcome, b.start_dt as subproject_start, b.end_dt as subproject_end
     from report_outputs b
     left join (
     select a.awardid as project_id, a.fiscal_year as project_year, 
            a.award_title as project_title, a.award_description as project_description, 
            a.begin_dt as project_start, a.end_dt as project_end, a.bureau as region, 
            a.rollup_ou as operating_unit
            from project_level1 as a) as c 
            on c.project_id = b.awardid and b.fiscal_year = c.project_year
     left join gender_marker d on d.GenderMarkerCode = b.gender_marker
     left join operating_units e on e.rollup_ou = c.operating_unit
     left join (
            select f.project_id, f.fiscal_year, group_concat(f.descrshort, ",") as donors 
            from output_donor f group by f.project_id, f.fiscal_year) as g 
            on g.project_id = b.project_id and g.fiscal_year = b.fiscal_year;
.quit
!

echo "Full Subproject List CSV generated."

echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output csv/undp-regions-index.csv
SELECT bureau as region, bureau_description as region_description FROM regions;
.quit
!
echo "Region index CSV generated."

echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output csv/undp-projectid-index.csv
select awardid as project_id, award_title as project_title from project_level1 group by awardid;
.quit
!
echo "undp-projectid-index.csv generated"

echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output csv/undp-subprojectid-index.csv
select project_id as subproject_id, project_description as subproject_description from report_outputs group by project_id;
.quit
!
echo "undp-subprojectid-index.csv generated"

echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output csv/undp-donor-index.csv
select donor as donor_id, descrshort as donor_short, donor_long_description as donor_name from project_level1_donor where donor_id != '' group by donor_id;
!
echo "undp-donor-index.csv generated"

echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output csv/undp-focus-area-index.csv
select focus_area_1 as focus_area_id, sp1_fa_description as focus_area from outcomes where focus_area_1 != '' group by focus_area_1;
!
echo "undp-focus-area-index.csv generated"

echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output csv/undp-operating-unit-index.csv
select rollup_ou as operating_unit_id, rollup_ou_description as operating_unit_description from operating_units group by rollup_ou;
!
echo "undp-operating-unit-index.csv generated"

echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output csv/undp-outcome-index.csv
select cast(corporate_outcome_1 as integer) as outcome_id, sp1_co_description as outcome_description from outcomes group by cast(corporate_outcome_1 as integer) order by outcome_id ASC;
!
echo "undp-outcome-index.csv generated"

# Run Python project summary to JSON scrip
python projects_summary.py csv/undp-project-summary.csv

# Run Python script to generate index JSON files
python index.py
