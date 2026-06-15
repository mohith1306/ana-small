# Excel → MySQL importer

Imports data from an Excel workbook into an **existing** local MySQL database.
Each sheet may contain **multiple table blocks**; the script detects them and
inserts each into the matching MySQL table.

## Expected Excel layout

Each table block in a sheet must look like this:

```
sales_orders                      <-- TITLE row: ONE non-empty cell = MySQL table name
order_id   customer   amount      <-- HEADER row: column names
1          Alice      100         <-- data rows
2          Bob        250
                                  <-- a blank row ends the block
customers                         <-- next block's TITLE
id         name       email
...
```

Rules:
- The **title cell** (a row with a single filled cell) names the target MySQL table.
- The **next non-empty row** is the header (column names).
- Data continues until a **fully blank row** ends the block.
- Blocks are separated by at least one blank row. Many blocks per sheet are fine.

## Setup

```powershell
cd excel-to-mysql
pip install -r requirements.txt
copy .env.example .env      # then edit .env with your MySQL credentials
```

## Run

```powershell
# Preview what would be imported (no DB writes):
python import_excel.py "C:\path\to\workbook.xlsx" --dry-run

# Actually import:
python import_excel.py "C:\path\to\workbook.xlsx"

# Only one sheet, larger batches:
python import_excel.py "C:\path\to\workbook.xlsx" --sheet "Sheet1" --batch-size 500
```

## Behavior notes

- **Tables must already exist.** The script never creates or alters tables.
- Only columns whose names **match an existing table column** (case-insensitive,
  whitespace-trimmed) are inserted. Extra Excel columns are skipped (and reported).
- A title with no matching MySQL table is **skipped with a warning**.
- Empty cells become SQL `NULL`. Excel dates become MySQL `DATETIME`/`DATE` values.
- All inserts run in one transaction — on any MySQL error the whole run is
  **rolled back**, so a failed import won't leave partial data.
- `--dry-run` reports every detected block and a sample row without touching MySQL.
