## New Scripts Guide

1. Install requirements for Mac OS:

		$: pip install -r requirements.txt

2. Install requirements for Ubuntu:

        $: sudo apt-get update
        $: sudo apt-get install python-pip libxml2-dev libxslt-dev python-dev lib32z1-dev
        $: pip install -r requirements.txt

*Note: You might need to run the last command as sudo*

3. Make sure original source data (e.g. XML files) are up-to-date. Original source data is stored at:

		/scripts/data/

	For example UNDP's IATI data is stored at `/scripts/data/download/undp_export`

4. Run the main script

		$: python start.py

## Script Settings

All settings are stored at:

		/scripts/generators/config.py
