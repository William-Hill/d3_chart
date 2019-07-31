import os
import glob
import json
import re
from pathlib import Path
from flask import Flask
from flask import render_template, current_app as app, flash, request, redirect
from werkzeug.utils import secure_filename


app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(app.static_folder, "mean_climate_json_files")
ALLOWED_EXTENSIONS = {'json', 'csv'}
app.secret_key = "secret key"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# set max file upload size to 16MB
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_variables_from_json_filenames():
    data_directory = os.path.join(app.static_folder, "mean_climate_json_files")
    climate_json_file_paths = glob.glob("{}/*.json".format(data_directory))
    climate_json_files = [
        Path(filename).name for filename in climate_json_file_paths]
    variables = []
    for json_file in climate_json_files:
        variables.append(json_file.split("_")[0])

    variables.sort()
    return variables


def get_json_attributes(filename):
    json_file_object = open(filename)
    json_object = json.load(json_file_object)
    json_file_object.close()

    models_list = list(json_object["RESULTS"].keys())
    regions = list(json_object['RESULTS'][models_list[0]]
                       ['defaultReference']['r1i1p1'].keys())

    statistics = list(json_object['RESULTS'][models_list[0]]['defaultReference']["r1i1p1"][regions[0]].keys())

    season_list = list(json_object['RESULTS']['ACCESS1-0']
                       ['defaultReference']['r1i1p1'][regions[0]][statistics[0]].keys())

    print("models:", models_list)
    print("regions:", regions)
    print("statistics:", statistics)
    print("seasons:", season_list)

    variables = get_variables_from_json_filenames()
    print("variables:", variables)

@app.route('/', methods=['POST'])
def upload_file():
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            flash('No file selected for uploading')
            return redirect(request.url)
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            flash('File successfully uploaded')
            print('File successfully uploaded')
            return redirect('/')
        else:
            flash('Allowed file types are json or csv')
            return redirect(request.url)


@app.route('/')
def index(name=None):
    data_directory = os.path.join(app.static_folder, "mean_climate_json_files")
    climate_csv_file_paths = glob.glob("{}/*.csv".format(data_directory))
    climate_csv_files = [
        Path(filename).name for filename in climate_csv_file_paths]
    climate_csv_files.sort()

    get_json_attributes(os.path.join(data_directory, "pr_2.5x2.5_regrid2_regrid2_metrics.json"))
    return render_template('index.html', files=climate_csv_files)
