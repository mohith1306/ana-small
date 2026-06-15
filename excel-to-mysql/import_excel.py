# import pandas as pd
# from sqlalchemy import create_engine
# from sqlalchemy.engine import URL
# from dotenv import load_dotenv
# import os
# import re

# # Load env variables
# load_dotenv()

# MYSQL_HOST = os.getenv("MYSQL_HOST")
# MYSQL_PORT = os.getenv("MYSQL_PORT")
# MYSQL_USER = os.getenv("MYSQL_USER")
# MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
# MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")
# print("MySQL Connection Details:")
# print("Host:", MYSQL_HOST)
# print("Port:", MYSQL_PORT)
# # MySQL Connection
# # Build the URL via URL.create so special characters in the password
# # (e.g. "@", ":") are escaped correctly instead of breaking the URL.
# connection_url = URL.create(
#     "mysql+pymysql",
#     username=MYSQL_USER,
#     password=MYSQL_PASSWORD,
#     host=MYSQL_HOST,
#     port=int(MYSQL_PORT) if MYSQL_PORT else None,
#     database=MYSQL_DATABASE,
# )
# engine = create_engine(connection_url)

# EXCEL_FILE = "340B_CoveredEntity_Export_20260610_151054.xlsx"
# print("Reading Excel file:", EXCEL_FILE)
# print("Exists:", os.path.exists(EXCEL_FILE))
# print("Current directory:", os.getcwd())
# print("File size MB:", round(os.path.getsize(EXCEL_FILE)/(1024*1024), 2))
# xls = pd.ExcelFile(EXCEL_FILE)

# print(xls.sheet_names)
# df = pd.read_excel(
#     EXCEL_FILE,
#     sheet_name=0,
#     header=None,
#     nrows=20
# )

# print(df)
# print("Excel file read successfully. Sheets found:", list(excel_data.keys()))
# raw_df = pd.read_excel(
#     EXCEL_FILE,
#     sheet_name=0,
#     header=None
# )
# print("Sample data from the first sheet:")
# for i in range(10):
#     print(f"ROW {i}")
#     print(raw_df.iloc[i].tolist())
#     print()
# # # for sheet_name, df in excel_data.items():
# # #     print("Execution started for sheet:", sheet_name)
# # #     # Clean table name
# # #     table_name = re.sub(r'[^a-zA-Z0-9_]', '_', sheet_name.lower())

# # #     # Clean column names
# # #     df.columns = [
# # #         re.sub(r'[^a-zA-Z0-9_]', '_', str(col).strip())
# # #         for col in df.columns
# # #     ]

# # #     print(f"Creating table: {table_name}")

# # #     # Create table + insert rows
# # #     df.to_sql(
# # #         name=table_name,
# # #         con=engine,
# # #         if_exists="replace",
# # #         index=False
# # #     )
# for sheet_name, df in excel_data.items():
#     print("Execution started for sheet:", sheet_name)

#     table_name = re.sub(r'[^a-zA-Z0-9_]', '_', sheet_name.lower())

#     df.columns = [
#         re.sub(r'[^a-zA-Z0-9_]', '_', str(col).strip())
#         for col in df.columns
#     ]

#     df = df.dropna(how="all")
#     df = df.dropna(axis=1, how="all")

#     # Keep only the first 100 rows per sheet
#     df = df.head(100)

#     print(f"Creating table: {table_name}")

#     df.to_sql(
#         name=table_name,
#         con=engine,
#         if_exists="replace",
#         index=False
#     )
# print("All sheets imported successfully.")


# # from openpyxl import load_workbook
# # import time

# # start = time.time()

# # print("Opening workbook...")
# # wb = load_workbook(
# #     "340B_CoveredEntity_Export_20260610_151054.xlsx",
# #     read_only=True,
# #     data_only=True
# # )

# # print("Opened in", round(time.time() - start, 2), "seconds")
# # print("Sheets:", wb.sheetnames)

# # import pandas as pd

# # EXCEL_FILE = "340B_CoveredEntity_Export_20260610_151054.xlsx"

# # df = pd.read_excel(
# #     EXCEL_FILE,
# #     sheet_name="Contract Pharmacy Details",
# #     header=None,
# #     nrows=10,
# #     engine="openpyxl"
# # )

# # print(df)


import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from dotenv import load_dotenv
import os
import re

# -----------------------------
# Load Environment Variables
# -----------------------------
load_dotenv()

MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_PORT = os.getenv("MYSQL_PORT")
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")

# -----------------------------
# MySQL Connection
# -----------------------------
connection_url = URL.create(
    "mysql+pymysql",
    username=MYSQL_USER,
    password=MYSQL_PASSWORD,
    host=MYSQL_HOST,
    port=int(MYSQL_PORT),
    database=MYSQL_DATABASE,
)

engine = create_engine(connection_url)

# -----------------------------
# Excel File
# -----------------------------
EXCEL_FILE = "340B_CoveredEntity_Export_20260610_151054.xlsx"

print(f"Reading: {EXCEL_FILE}")
print(f"File Size: {round(os.path.getsize(EXCEL_FILE)/(1024*1024), 2)} MB")

# -----------------------------
# Read All Sheets
# -----------------------------
excel_data = pd.read_excel(
    EXCEL_FILE,
    sheet_name=None,
    header=4,          # Row containing actual column names
    engine="openpyxl"
)

print("Sheets Found:")
for sheet in excel_data.keys():
    print(" -", sheet)

# -----------------------------
# Import Each Sheet
# -----------------------------
for sheet_name, df in excel_data.items():

    print(f"\nProcessing Sheet: {sheet_name}")

    # Clean table name
    table_name = re.sub(
        r'[^a-zA-Z0-9_]+',
        '_',
        sheet_name.strip().lower()
    )

    # Clean column names
    cleaned_columns = []

    for col in df.columns:
        col = str(col).strip()

        col = re.sub(
            r'[^a-zA-Z0-9]+',
            '_',
            col
        )

        col = col.strip('_')

        if col == "":
            col = "unknown_column"

        cleaned_columns.append(col)

    df.columns = cleaned_columns

    # Remove completely empty rows
    df = df.dropna(how="all")

    # Remove completely empty columns
    df = df.dropna(axis=1, how="all")

    print("Columns:")
    print(df.columns.tolist())

    print("Rows:", len(df))

    # Import into MySQL
    df.to_sql(
        name=table_name,
        con=engine,
        if_exists="replace",
        index=False,
        chunksize=5000
    )

    print(f"Created table: {table_name}")

print("\nAll sheets imported successfully.")
