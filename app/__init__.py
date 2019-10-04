import os
import glob
import json
import re
from pathlib import Path
from flask import Flask
from flask import render_template, current_app as app, flash, request, redirect, jsonify
from werkzeug.utils import secure_filename
from app import mean_climate_parser


app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(app.static_folder, "mean_climate_json_files")
ALLOWED_EXTENSIONS = {'json', 'csv'}
app.secret_key = "secret key"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
# set max file upload size to 16MB
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


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


@app.route("/plot_by_variable", methods=['POST'])
def generate_all_seasons_for_variable():
    request_json = request.get_json()
    mean_climate_parser.all_seasons_for_variable(
        request_json["variable"], request_json["model_generation"], request_json["region"], request_json["statistic"])
    return ""


@app.route("/plot_by_season", methods=['POST'])
def generate_all_seasons_by_variable():
    request_json = request.get_json()
    mean_climate_parser.all_variables_by_season(request_json["season"], request_json["model_generation"],
                                                request_json["region"], request_json["statistic"])
    return ""


@app.route('/newest_file')
def get_newest_file():
    model_generation = request.args.get('model_generation')
    data_directory = os.path.join(
        app.static_folder, "mean_climate_json_files", "{}_csv".format(model_generation))
    climate_json_file_paths = glob.glob("{}/*.csv".format(data_directory))
    latest_file = max(climate_json_file_paths, key=os.path.getctime)
    latest_file = Path(latest_file).name
    return jsonify(latestfile=latest_file)


@app.route('/')
def index(name=None):
    cmip5_csv_directory = os.path.join(
        app.static_folder, "mean_climate_json_files", "cmip5_csv")
    cmip5_csv_file_paths = glob.glob("{}/*.csv".format(cmip5_csv_directory))

    cmip6_csv_directory = os.path.join(
        app.static_folder, "mean_climate_json_files", "cmip6_csv")
    cmip6_csv_file_paths = glob.glob("{}/*.csv".format(cmip6_csv_directory))

    cmip5_csv_files = [
        Path(filename).name for filename in cmip5_csv_file_paths]
    cmip6_csv_files = [
        Path(filename).name for filename in cmip6_csv_file_paths]

    climate_csv_files = cmip5_csv_files + cmip6_csv_files
    climate_csv_files.sort()

    variables = mean_climate_parser.get_variables_from_json_filenames("cmip5")

    model_generations = (["cmip5", "cmip6"])

    data_directory = os.path.join(app.static_folder, "mean_climate_json_files")
    json_attributes = mean_climate_parser.get_json_attributes(os.path.join(
        data_directory, "cmip5_json", "pr.CMIP5.historical.regrid2.2p5x2p5.v20190821.json"))
    return render_template('index.html', files=climate_csv_files, statistics=json_attributes["statistics"], regions=json_attributes["regions"], seasons=json_attributes["seasons"], variables=variables, model_generations=model_generations)
