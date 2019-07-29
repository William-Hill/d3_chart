import os
import glob
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
    print("static folder:", app.static_folder)
    data_directory = os.path.join(app.static_folder, "mean_climate_json_files")
    climate_csv_file_paths = glob.glob("{}/*.csv".format(data_directory))
    print("climate_csv_file_paths:", climate_csv_file_paths)
    climate_csv_files = [
        Path(filename).name for filename in climate_csv_file_paths]
    climate_csv_files.sort()
    print("climate_csv_files:", climate_csv_files)
    return render_template('index.html', files=climate_csv_files)
