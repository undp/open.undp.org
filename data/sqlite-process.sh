#!/bin/bash

sqlite3 undp-project-db.sqlite <<!
.headers on
.mode csv
.output undp-project-summary.csv
select c.awardid as project_id, c.bureau as region, c.rollup_ou as operating_unit, c.fiscal_year as fiscal_year, sum(c.project_budget) as budget, sum(c.project_expenditure) as expenditure, g.donors as donors from ( select b.bureau, b.rollup_ou, b.awardid, b.project_id, b.project_budget, b.project_expenditure, b.fiscal_year from report_outputs b) as c left join (select a.awardid, a.fiscal_year, a.award_title, a.award_description from project_level1 as a) as d on c.awardid = d.awardid and c.fiscal_year = d.fiscal_year join (select f.awardid, f.fiscal_year, group_concat(f.descrshort, ",") as donors from output_donor f group by f.project_id, f.fiscal_year) as g on g.awardid = c.awardid and g.fiscal_year = c.fiscal_year group by d.awardid;
!