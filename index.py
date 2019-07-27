import os
import glob
from pathlib import Path
from flask import Flask
from flask import render_template, current_app as app
app = Flask(__name__)


@app.route('/')
def index(name=None):
    print("static folder:", app.static_folder)
    data_directory = os.path.join(app.static_folder, "mean_climate_json_files")
    climate_csv_file_paths = glob.glob("{}/*.csv".format(data_directory))
    print("climate_csv_file_paths:", climate_csv_file_paths)
    climate_csv_files = [
        Path(filename).name for filename in climate_csv_file_paths]
    print("climate_csv_files:", climate_csv_files)
    return render_template('index.html', files=climate_csv_files)
