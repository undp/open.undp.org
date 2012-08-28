#!/bin/bash

mkdir temp-csv/ 
mkdir ../api/ 
mkdir ../api/projects/

# Generate project (level1) summary csv from sqlite db output
echo "Processing sqlite..."
sqlite3 undp-project-db.sqlite <<!
.headers on 
.mode csv 
.output temp-csv/undp-project-summary.csv 
select 
    h.awardid as id, h.award_title as name, h.bureau as region, h.rollup_ou as operating_unit, 
    sum(h.project_budget) as budget, sum(h.project_expenditure) as expenditure, 
    j.donors as donors, h.crs as crs, h.sp1_fa as focus_area, h.sp1_co as outcome 
    from (
        (select 
            b.bureau, b.rollup_ou, b.awardid, 
            b.project_id, b.project_budget, b.project_expenditure, 
            b.fiscal_year, b.start_dt, b.end_dt, b.crs, b.sp1_fa, b.sp1_co 
        from report_outputs b) as c 
        left join (
        select 
            a.awardid, a.fiscal_year, a.award_title, 
            a.award_description, a.begin_dt, a.end_dt 
        from project_level1 as a) as d 
        on c.awardid = d.awardid and c.fiscal_year = d.fiscal_year
        ) as h 
left join ( 
        select i.awardid, h.donors 
        from 
            (select f.awardid from project_level1_donor f group by f.awardid) as i 
        join 
            ( select g.awardid, g.fiscal_year, group_concat(g.donor) as donors 
            from project_level1_donor g group by g.awardid, g.fiscal_year
            order by g.awardid, g.fiscal_year) as h on h.awardid = i.awardid
            group by i.awardid
    ) as j 
    on j.awardid = h.awardid 
group by h.awardid;

.output temp-csv/undp-project-full.csv
select
     c.awardid as project_id, c.bureau as region, c.rollup_ou as operating_unit,
     c.fiscal_year as fiscal_year, 
     d.award_title as project_title, d.award_description as project_description, 
     d.begin_dt as project_start, d.end_dt as project_end,
     sum(c.project_budget) as budget, sum(c.project_expenditure) as expenditure, g.donors as donors
     from (select b.bureau, b.rollup_ou, b.awardid, b.project_id, b.project_budget, b.project_expenditure, 
                b.fiscal_year, b.start_dt, b.end_dt 
               from report_outputs b) as c
     left join (
          select
               a.awardid, a.fiscal_year, a.award_title, a.award_description, a.begin_dt, a.end_dt
               from project_level1 as a) as d
           on c.awardid = d.awardid and c.fiscal_year = d.fiscal_year
    join (
          select f.awardid, f.fiscal_year, group_concat(f.descrshort, ",") as donors from output_donor f group by f.project_id, f.fiscal_year
          ) as g on g.awardid = c.awardid and g.fiscal_year = c.fiscal_year
group by d.awardid;

.output temp-csv/undp-subproject-full.csv
select
     c.project_id as project_id, c.project_title as project_title, 
     c.project_description as project_description, c.project_start as project_start, 
     c.project_end as project_end, c.region as region, e.rollup_ou_description as operating_unit, 
     b.awardid as project_id2, b.project_id as subproject_id, 
     b.project_description as subproject_title, b.project_long_description as subproject_description, 
     b.fiscal_year as fiscal_year, b.project_budget as budget, b.project_expenditure as expenditure, 
     g.donor_short as donor_short, g.donor_long as donor_long, d.GenderMarkerDescription as gender_mark, b.sp1_fa_description as focus_area, 
     b.sp1_co_description as corporate_outcome, b.start_dt as subproject_start, b.end_dt as subproject_end,
     b.crs as crs
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
            select f.project_id, f.fiscal_year, group_concat(f.descrshort, ",") as donor_short,
            group_concat(f.donor_long_description, ",") as donor_long 
            from output_donor f group by f.project_id, f.fiscal_year) as g 
            on g.project_id = b.project_id and g.fiscal_year = b.fiscal_year;

.output temp-csv/undp-regions-index.csv
select bureau as id, bureau_description as name FROM regions;

.output temp-csv/undp-donor-index.csv
select donor as id, donor_long_description as name from project_level1_donor where id != '' group by id;

.output temp-csv/undp-donor-type-index.csv
select donor as id, UN_LEVEL1_DESCR as name from donors where id != '' group by name;

.output temp-csv/undp-focus-area-index.csv
select focus_area_1 as id, sp1_fa_description as name from outcomes where id != '' group by id;

.output temp-csv/undp-operating-unit-index.csv
select rollup_ou as id, rollup_ou_description as name from operating_units where id != '' group by id;

.output temp-csv/undp-outcome-index.csv
select corporate_outcome_1 as id, sp1_co_description as name from outcomes where id != '' group by id;

.output temp-csv/undp-crs-index.csv
select crs as id, "" as name from report_outputs where id != '' group by id;
.quit
!

echo "CSV files created."

# Run Python script to generate index JSON files
python index.py

echo "Index files generated."

# Run Python scrip to generate all project JSON files
python all-projects.py

